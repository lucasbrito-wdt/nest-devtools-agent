import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { IngestModule } from './modules/ingest/ingest.module';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { GraphModule } from './modules/graph/graph.module';
import { typeOrmConfig } from './config/typeorm.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: 60000, // 1 minuto
          limit: config.get<number>('RATE_LIMIT') || 100,
        },
      ],
    }),

    // Módulos de feature
    IngestModule,
    EventsModule,
    HealthModule,
    WebSocketModule,
    GraphModule, // ← Novo módulo de grafo
  ],
})
export class AppModule {}
