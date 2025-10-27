import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestEventDto } from './dto/ingest-event.dto';
import { EventType } from 'nest-devtools-shared';
import { DevToolsGateway } from '../websocket/devtools.gateway';
import { ScheduleService } from '../schedule/schedule.service';
import { HttpClientService } from '../http-client/http-client.service';
import { RedisService } from '../redis/redis.service';
import { SessionsService } from '../sessions/sessions.service';

/**
 * Serviço de ingestão de eventos (Prisma)
 */
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: DevToolsGateway,
    private readonly scheduleService: ScheduleService,
    private readonly httpClientService: HttpClientService,
    private readonly redisService: RedisService,
    private readonly sessionsService: SessionsService,
  ) {}

  /**
   * Ingere um evento e persiste no banco
   */
  async ingestEvent(dto: IngestEventDto, projectId?: string) {
    this.logger.debug(`💾 Persistindo evento no banco de dados`);
    this.logger.debug(`  ├─ Tipo: ${dto.type}`);
    this.logger.debug(`  └─ Project ID: ${projectId || 'N/A'}`);

    // Route to specific table based on event type
    let saved: any;

    switch (dto.type) {
      case EventType.SCHEDULE:
        saved = await this.ingestSchedule(dto, projectId);
        break;

      case EventType.HTTP_CLIENT:
        saved = await this.ingestHttpClient(dto, projectId);
        break;

      case EventType.REDIS:
        saved = await this.ingestRedis(dto, projectId);
        break;

      case EventType.SESSION:
        saved = await this.ingestSession(dto, projectId);
        break;

      case EventType.REQUEST:
      case EventType.EXCEPTION:
      case EventType.LOG:
      case EventType.QUERY:
      case EventType.JOB:
      default:
        // Legacy events go to the events table
        saved = await this.ingestLegacyEvent(dto, projectId);
        break;
    }

    this.logger.log(`✅ Evento persistido: ${saved.id} (${dto.type})`);

    // Emite evento WebSocket em tempo real
    this.logger.debug(`📡 Emitindo evento via WebSocket`);
    this.wsGateway.emitNewEvent(saved as any, projectId);

    // Se for exceção, emite alerta
    if (dto.type === EventType.EXCEPTION) {
      const exceptionMsg = (dto.meta as any).message || 'Exceção capturada';
      this.logger.warn(`🚨 Exceção detectada: ${exceptionMsg}`);

      this.wsGateway.emitAlert(
        {
          type: 'error',
          title: 'Nova Exceção',
          message: exceptionMsg,
          timestamp: new Date().toISOString(),
        },
        projectId,
      );
    }

    return saved;
  }

  /**
   * Ingere evento de schedule
   */
  private async ingestSchedule(dto: IngestEventDto, projectId?: string) {
    const meta = dto.meta as any;
    return this.scheduleService.create({
      jobId: meta.jobId,
      jobName: meta.jobName,
      cronExpression: meta.cronExpression,
      status: meta.status,
      startedAt: meta.startedAt ? new Date(meta.startedAt) : undefined,
      completedAt: meta.completedAt ? new Date(meta.completedAt) : undefined,
      duration: meta.duration,
      error: meta.error,
      result: meta.result,
      nextRunAt: meta.nextRunAt ? new Date(meta.nextRunAt) : undefined,
      projectId,
    });
  }

  /**
   * Ingere evento de HTTP client
   */
  private async ingestHttpClient(dto: IngestEventDto, projectId?: string) {
    const meta = dto.meta as any;
    return this.httpClientService.create({
      method: meta.method,
      url: meta.url,
      baseURL: meta.baseURL,
      headers: meta.headers,
      requestBody: meta.requestBody,
      responseStatus: meta.responseStatus,
      responseHeaders: meta.responseHeaders,
      responseBody: meta.responseBody,
      duration: meta.duration,
      error: meta.error,
      timeout: meta.timeout,
      retries: meta.retries,
      projectId,
    });
  }

  /**
   * Ingere evento de Redis
   */
  private async ingestRedis(dto: IngestEventDto, projectId?: string) {
    const meta = dto.meta as any;
    return this.redisService.create({
      command: meta.command,
      args: meta.args,
      key: meta.key,
      value: meta.value,
      duration: meta.duration,
      error: meta.error,
      database: meta.database,
      result: meta.result,
      projectId,
    });
  }

  /**
   * Ingere evento de sessão
   */
  private async ingestSession(dto: IngestEventDto, projectId?: string) {
    const meta = dto.meta as any;
    return this.sessionsService.create({
      sessionId: meta.sessionId,
      userId: meta.userId,
      action: meta.action,
      sessionData: meta.sessionData,
      expiresAt: meta.expiresAt ? new Date(meta.expiresAt) : undefined,
      ip: meta.ip,
      userAgent: meta.userAgent,
      projectId,
    });
  }

  /**
   * Ingere eventos legados (REQUEST, EXCEPTION, LOG, QUERY, JOB)
   */
  private async ingestLegacyEvent(dto: IngestEventDto, projectId?: string) {
    const route = this.extractRoute(dto);
    const status = this.extractStatus(dto);
    const sessionId = this.extractSessionId(dto);
    const userId = this.extractUserId(dto);

    return this.prisma.event.create({
      data: {
        type: dto.type,
        payload: dto.meta as any,
        route,
        status,
        sessionId,
        userId,
        projectId,
      },
    });
  }

  /**
   * Extrai rota do payload para indexação
   */
  private extractRoute(dto: IngestEventDto): string | undefined {
    if (dto.type === EventType.REQUEST || dto.type === EventType.EXCEPTION) {
      return dto.meta.route || dto.meta.url;
    }
    return undefined;
  }

  /**
   * Extrai status code do payload para indexação
   */
  private extractStatus(dto: IngestEventDto): number | undefined {
    if (dto.type === EventType.REQUEST) {
      return dto.meta.statusCode;
    }
    if (dto.type === EventType.EXCEPTION) {
      return dto.meta.statusCode;
    }
    return undefined;
  }

  /**
   * Extrai session ID do payload
   */
  private extractSessionId(dto: IngestEventDto): string | undefined {
    if (dto.type === EventType.REQUEST) {
      return (dto.meta as any).sessionId;
    }
    return undefined;
  }

  /**
   * Extrai user ID do payload
   */
  private extractUserId(dto: IngestEventDto): string | undefined {
    if (dto.type === EventType.REQUEST) {
      return (dto.meta as any).userId;
    }
    return undefined;
  }
}
