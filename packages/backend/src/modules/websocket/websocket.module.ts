import { Module } from '@nestjs/common';
import { DevToolsGateway } from './devtools.gateway';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [EventsModule],
  providers: [DevToolsGateway],
  exports: [DevToolsGateway], // ← Exporta para outros módulos usarem
})
export class WebSocketModule {}
