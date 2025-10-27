import { Controller, Post, Body, UseGuards } from '@nestjs/common';
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
  constructor(private readonly ingestService: IngestService) {}

  /**
   * Endpoint para ingestão de eventos
   * Rate limited: 100 requests/minuto (configurável)
   */
  @Post()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async ingest(@Body() dto: IngestEventDto): Promise<IngestEventResponse> {
    try {
      const event = await this.ingestService.ingestEvent(dto);

      return {
        success: true,
        eventId: event.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

