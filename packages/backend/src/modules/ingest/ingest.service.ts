import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { IngestEventDto } from './dto/ingest-event.dto';
import { EventType } from '@nest-devtools/shared';
import { DevToolsGateway } from '../websocket/devtools.gateway';

/**
 * Serviço de ingestão de eventos
 */
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly wsGateway: DevToolsGateway,
  ) {}

  /**
   * Ingere um evento e persiste no banco
   */
  async ingestEvent(dto: IngestEventDto, projectId?: string): Promise<Event> {
    // Extrai route e status do payload para indexação
    const route = this.extractRoute(dto);
    const status = this.extractStatus(dto);

    // Cria entidade
    const event = this.eventRepository.create({
      type: dto.type,
      payload: dto.meta,
      route,
      status,
    });

    // Persiste
    const saved = await this.eventRepository.save(event);

    this.logger.debug(`Event ingested: ${saved.id} (${saved.type})`);

    // Emite evento WebSocket em tempo real
    this.wsGateway.emitNewEvent(saved, projectId);

    // Se for exceção, emite alerta
    if (saved.type === EventType.EXCEPTION) {
      this.wsGateway.emitAlert({
        type: 'error',
        title: 'Nova Exceção',
        message: dto.meta.message || 'Exceção capturada',
        timestamp: new Date().toISOString(),
      }, projectId);
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
