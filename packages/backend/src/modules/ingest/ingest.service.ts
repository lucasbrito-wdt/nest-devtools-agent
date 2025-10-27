import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestEventDto } from './dto/ingest-event.dto';
import { EventType } from 'nest-devtools-shared';
import { DevToolsGateway } from '../websocket/devtools.gateway';

/**
 * Serviço de ingestão de eventos (Prisma)
 */
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wsGateway: DevToolsGateway,
  ) {}

  /**
   * Ingere um evento e persiste no banco
   */
  async ingestEvent(dto: IngestEventDto, projectId?: string) {
    // Extrai route e status do payload para indexação
    const route = this.extractRoute(dto);
    const status = this.extractStatus(dto);

    this.logger.debug(`💾 Persistindo evento no banco de dados`);
    this.logger.debug(`  ├─ Tipo: ${dto.type}`);
    this.logger.debug(`  ├─ Route: ${route || 'N/A'}`);
    this.logger.debug(`  ├─ Status: ${status || 'N/A'}`);
    this.logger.debug(`  └─ Project ID: ${projectId || 'N/A'}`);

    // Cria e persiste evento
    const saved = await this.prisma.event.create({
      data: {
        type: dto.type,
        payload: dto.meta as any,
        route,
        status,
        projectId,
      },
    });

    this.logger.log(`✅ Evento persistido: ${saved.id} (${saved.type})`);

    // Emite evento WebSocket em tempo real
    this.logger.debug(`📡 Emitindo evento via WebSocket`);
    this.wsGateway.emitNewEvent(saved as any, projectId);

    // Se for exceção, emite alerta
    if (saved.type === EventType.EXCEPTION) {
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
}
