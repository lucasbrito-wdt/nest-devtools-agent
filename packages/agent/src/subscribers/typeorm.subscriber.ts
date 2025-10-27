import { EventSubscriber, EntitySubscriberInterface } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { DevtoolsService } from '../devtools.service';
import { EventType, QueryEventMeta } from '../shared/types';

/**
 * Subscriber do TypeORM para capturar queries SQL
 */
@Injectable()
@EventSubscriber()
export class DevtoolsTypeOrmSubscriber implements EntitySubscriberInterface {
  private queryStartTimes = new Map<string, number>();

  constructor(private readonly devtoolsService: DevtoolsService) {}

  /**
   * Intercepta antes da query
   */
  beforeQuery(event: any): void {
    const queryId = this.generateQueryId(event);
    this.queryStartTimes.set(queryId, Date.now());
  }

  /**
   * Intercepta depois da query
   */
  afterQuery(event: any): void {
    const queryId = this.generateQueryId(event);
    const startTime = this.queryStartTimes.get(queryId);

    if (!startTime) return;

    const duration = Date.now() - startTime;
    this.queryStartTimes.delete(queryId);

    const meta: QueryEventMeta = {
      timestamp: Date.now(),
      query: event.query,
      parameters: event.parameters,
      duration,
      connection: event.connection?.name || 'default',
      database: event.connection?.options?.database,
    };

    // Envia evento de forma assíncrona
    this.devtoolsService.sendEvent({
      type: EventType.QUERY,
      meta,
    });
  }

  /**
   * Gera ID único para a query
   */
  private generateQueryId(event: any): string {
    return `${event.query}-${Date.now()}`;
  }
}
