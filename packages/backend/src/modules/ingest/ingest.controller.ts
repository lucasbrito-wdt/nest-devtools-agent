import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IngestService } from './ingest.service';
import { ApiKeyGuard } from '@/common/guards/api-key.guard';
import { IngestEventDto } from './dto/ingest-event.dto';
import { IngestEventResponse } from 'nest-devtools-shared';

/**
 * Controller responsável pela ingestão de eventos
 */
@Controller('ingest')
@UseGuards(ApiKeyGuard)
export class IngestController {
  private readonly logger = new Logger(IngestController.name);

  constructor(private readonly ingestService: IngestService) {
    this.logger.log('🚀 IngestController inicializado');
  }

  /**
   * Endpoint para ingestão de eventos
   * Rate limited: 100 requests/minuto (configurável)
   */
  @Post()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async ingest(@Body() dto: IngestEventDto): Promise<IngestEventResponse> {
    const eventInfo =
      (dto.meta as any)?.method && (dto.meta as any)?.url
        ? `${(dto.meta as any).method} ${(dto.meta as any).url}`
        : dto.type;

    this.logger.log(`📥 Recebido evento: ${eventInfo}`);
    this.logger.debug(`  ├─ Tipo: ${dto.type}`);
    this.logger.debug(`  └─ Payload size: ${JSON.stringify(dto).length} bytes`);

    try {
      const startTime = Date.now();
      const event = await this.ingestService.ingestEvent(dto);
      const duration = Date.now() - startTime;

      this.logger.log(`✅ Evento persistido com sucesso em ${duration}ms: ${event.id}`);

      return {
        success: true,
        eventId: event.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`❌ Erro ao ingerir evento: ${eventInfo}`);
      this.logger.error(`  ├─ Erro: ${errorMessage}`);
      this.logger.error(
        `  └─ Stack: ${error instanceof Error ? error.stack?.split('\n')[1]?.trim() : 'N/A'}`,
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}
