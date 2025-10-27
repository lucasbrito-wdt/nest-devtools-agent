import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DevtoolsModule } from 'nest-devtools-agent';
import { IngestModule } from './modules/ingest/ingest.module';
import { EventsModule } from './modules/events/events.module';
import { HealthModule } from './modules/health/health.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { GraphModule } from './modules/graph/graph.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { HttpClientModule } from './modules/http-client/http-client.module';
import { RedisModule } from './modules/redis/redis.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    PrismaModule,

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

    // DevTools monitoring
    DevtoolsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        enabled: config.get('NODE_ENV') !== 'production',
        backendUrl: config.get('DEVTOOLS_BACKEND_URL', 'http://localhost:4000'),
        apiKey: config.get('DEVTOOLS_API_KEY', 'dev-key'),
        timeout: config.get('DEVTOOLS_TIMEOUT', 5000),
        maxRetries: config.get('DEVTOOLS_MAX_RETRIES', 3),
        enableBuffer: config.get('DEVTOOLS_ENABLE_BUFFER') === 'true',
        captureHeaders: true,
        captureBody: true,
        captureResponse: false,
      }),
    }),

    // Módulos de feature
    IngestModule,
    EventsModule,
    HealthModule,
    WebSocketModule,
    GraphModule,
    ScheduleModule,
    HttpClientModule,
    RedisModule,
    SessionsModule,
  ],
})
export class AppModule {}
