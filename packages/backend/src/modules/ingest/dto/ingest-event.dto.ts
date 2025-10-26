import { IsEnum, IsObject } from 'class-validator';
import { EventType } from '@nest-devtools/shared';

/**
 * DTO para ingestão de evento
 */
export class IngestEventDto {
  @IsEnum(EventType)
  type: EventType;

  @IsObject()
  meta: Record<string, any>;
}

