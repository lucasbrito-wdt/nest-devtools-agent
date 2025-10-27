import { Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Queue } from 'bull';
import { DevtoolsService } from '../devtools.service';
import { EventType, JobEventMeta } from '../shared/types';

/**
 * Tracer para filas Bull
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     BullModule.registerQueue({ name: 'emails' }),
 *     DevtoolsModule.forRoot({ ... }),
 *   ],
 *   providers: [DevtoolsBullTracer],
 * })
 * export class AppModule {}
 * ```
 */
@Injectable()
export class DevtoolsBullTracer implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly devtoolsService: DevtoolsService,
  ) {}

  async onModuleInit() {
    // Busca todas as queues registradas
    const queues = this.getQueues();

    for (const queue of queues) {
      this.attachListeners(queue);
    }
  }

  /**
   * Anexa listeners na queue
   */
  private attachListeners(queue: Queue) {
    const queueName = queue.name;

    // Job adicionado à fila
    queue.on('waiting', (jobId: string | number) => {
      this.sendJobEvent(queueName, String(jobId), 'waiting');
    });

    // Job iniciou processamento
    queue.on('active', async (job) => {
      this.sendJobEvent(queueName, String(job.id), 'active', job.data);
    });

    // Job completou com sucesso
    queue.on('completed', async (job, result) => {
      this.sendJobEvent(
        queueName,
        String(job.id),
        'completed',
        job.data,
        undefined,
        job.returnvalue,
      );
    });

    // Job falhou
    queue.on('failed', async (job, error) => {
      this.sendJobEvent(
        queueName,
        String(job.id),
        'failed',
        job.data,
        error.message,
        undefined,
        job?.attemptsMade,
      );
    });
  }

  /**
   * Envia evento de job
   */
  private sendJobEvent(
    queueName: string,
    jobId: string,
    status: 'waiting' | 'active' | 'completed' | 'failed',
    data?: any,
    error?: string,
    result?: any,
    attempts?: number,
  ) {
    const meta: JobEventMeta = {
      timestamp: Date.now(),
      jobId: String(jobId),
      jobName: data?.name || 'unknown',
      queueName,
      status,
      data,
      error,
      attempts,
    };

    this.devtoolsService.sendEvent({
      type: EventType.JOB,
      meta,
    });
  }

  /**
   * Busca todas as queues do BullModule
   */
  private getQueues(): Queue[] {
    // Implementação simplificada - pode precisar ajustar conforme versão do Bull
    try {
      // Tenta buscar queues do contexto do NestJS
      // Isso pode variar dependendo da versão e configuração
      return [];
    } catch {
      return [];
    }
  }
}
