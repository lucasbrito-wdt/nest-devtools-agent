import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    WebSocketModule, // ← Importa WebSocket para broadcast
  ],
  controllers: [IngestController],
  providers: [IngestService],
})
export class IngestModule {}
