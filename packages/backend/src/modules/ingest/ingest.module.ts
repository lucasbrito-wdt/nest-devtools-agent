import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { Event } from '../events/entities/event.entity';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    WebSocketModule, // ← Importa WebSocket para broadcast
  ],
  controllers: [IngestController],
  providers: [IngestService],
})
export class IngestModule {}
