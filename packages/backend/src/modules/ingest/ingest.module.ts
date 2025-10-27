import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller';
import { IngestService } from './ingest.service';
import { WebSocketModule } from '../websocket/websocket.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { HttpClientModule } from '../http-client/http-client.module';
import { RedisModule } from '../redis/redis.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [
    WebSocketModule, // ← Importa WebSocket para broadcast
    ScheduleModule,
    HttpClientModule,
    RedisModule,
    SessionsModule,
  ],
  controllers: [IngestController],
  providers: [IngestService],
})
export class IngestModule {}
