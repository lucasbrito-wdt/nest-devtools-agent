# ⚙️ Configuração Avançada — Nest DevTools Telescope

> Guia completo de customização

---

## Agent Configuration

### 1. Configuração Básica

```typescript
import { DevtoolsModule } from '@nest-devtools/agent';

@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: process.env.NODE_ENV !== 'production',
      backendUrl: 'http://localhost:4000',
      apiKey: process.env.DEVTOOLS_API_KEY!,
    }),
  ],
})
export class AppModule {}
```

### 2. Todas as Opções

```typescript
interface DevToolsAgentConfig {
  // Obrigatórios
  enabled: boolean;
  backendUrl: string;
  apiKey: string;

  // Opcionais
  maxBodySize?: number;              // Default: 10240 (10KB)
  timeout?: number;                  // Default: 5000ms
  maxRetries?: number;               // Default: 3
  enableBuffer?: boolean;            // Default: false
  maxBufferSize?: number;            // Default: 100
  sensitiveFields?: string[];        // Default: ['password', 'token', ...]
  captureHeaders?: boolean;          // Default: true
  captureBody?: boolean;             // Default: true
  captureResponse?: boolean;         // Default: false
  environment?: string;              // Default: process.env.NODE_ENV
}
```

### 3. Configuração Assíncrona

```typescript
DevtoolsModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    enabled: configService.get('DEVTOOLS_ENABLED') === 'true',
    backendUrl: configService.get('DEVTOOLS_URL')!,
    apiKey: configService.get('DEVTOOLS_API_KEY')!,
    maxBodySize: configService.get('DEVTOOLS_MAX_BODY_SIZE') || 10240,
  }),
  inject: [ConfigService],
})
```

---

## Backend Configuration

### 1. Variáveis de Ambiente

Crie `.env`:

```env
# Server
PORT=4000
NODE_ENV=development

# Security
DEVTOOLS_API_KEY=your-secret-key-here

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Database
DATABASE_URL=postgresql://devtools:devtools@localhost:5432/nest_devtools

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Retention
RETENTION_DAYS=7

# Rate Limiting
RATE_LIMIT=100

# WebSocket
ENABLE_WEBSOCKET=true
```

### 2. Configuração de Banco de Dados

**TypeORM:**

```typescript
// src/config/typeorm.config.ts
export const typeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  entities: [Event],
  synchronize: false, // ← SEMPRE false em produção
  logging: ['error', 'warn'],
  maxQueryExecutionTime: 1000, // Log queries > 1s
  poolSize: 20,
});
```

**Connection Pooling:**

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?pool=20&statement_timeout=30000
```

### 3. CORS Avançado

```typescript
// src/main.ts
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = configService
      .get<string>('CORS_ORIGINS')
      .split(',');
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-api-key'],
});
```

### 4. Rate Limiting Customizado

**Por rota:**

```typescript
@Controller('ingest')
export class IngestController {
  @Post()
  @Throttle({ default: { limit: 500, ttl: 60000 } }) // 500 req/min
  async ingest(@Body() dto: IngestEventDto) {
    // ...
  }
}
```

**Por user/tenant (futuro):**

```typescript
@Throttle({ key: 'user', limit: 100, ttl: 60000 })
```

---

## Frontend Configuration

### 1. Variáveis de Ambiente

Crie `.env.local`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4000
```

### 2. Configuração de Proxy (Vite)

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
});
```

### 3. Configuração de Build

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false, // true em dev
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tanstack: ['@tanstack/react-query', '@tanstack/react-table'],
        },
      },
    },
  },
});
```

---

## Performance Tuning

### 1. Database Indexes

```sql
-- Índices customizados para suas queries mais frequentes
CREATE INDEX idx_events_custom 
ON events((payload->>'userId'), created_at DESC);

-- Índice parcial (só erros)
CREATE INDEX idx_events_errors 
ON events(created_at) 
WHERE status >= 400;
```

### 2. Query Optimization

**Limit payload size:**

```typescript
// Backend
@Get('events')
async findAll(@Query() query: QueryEventsDto) {
  return this.eventsService.findAll(query, {
    select: ['id', 'type', 'route', 'status', 'createdAt'], // ← Sem payload
  });
}
```

**Pagination eficiente:**

```typescript
// Use cursor-based em vez de offset
@Get('events')
async findAll(@Query('cursor') cursor?: string) {
  return this.eventsService.findAllCursor({ cursor, limit: 50 });
}
```

### 3. Caching (Redis)

```typescript
// Implementação futura
@Injectable()
export class EventsService {
  async getStats(): Promise<DevToolsStats> {
    const cached = await this.redis.get('stats');
    if (cached) return JSON.parse(cached);

    const stats = await this.calculateStats();
    await this.redis.setex('stats', 60, JSON.stringify(stats)); // 1 min TTL
    return stats;
  }
}
```

---

## Multi-Environment Setup

### Development

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://dev:dev@localhost:5432/devtools_dev
CORS_ORIGINS=http://localhost:3000
```

### Staging

```env
NODE_ENV=staging
PORT=4000
DATABASE_URL=postgresql://stage:***@db.staging.com:5432/devtools_stage
CORS_ORIGINS=https://devtools-staging.myapp.com
DEVTOOLS_API_KEY=staging-secret-key
```

### Production

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://prod:***@db.prod.com:5432/devtools_prod
CORS_ORIGINS=https://devtools.myapp.com
DEVTOOLS_API_KEY=prod-super-secret-key
RETENTION_DAYS=30
RATE_LIMIT=1000
```

---

## Docker Compose Customization

### Development

```yaml
# docker-compose.dev.yml
services:
  backend:
    build:
      context: ./packages/backend
      target: development
    volumes:
      - ./packages/backend/src:/app/src
    command: pnpm dev
```

### Production

```yaml
# docker-compose.prod.yml
services:
  backend:
    build:
      context: ./packages/backend
      target: production
    environment:
      NODE_ENV: production
    restart: always
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

---

## Logging Configuration

### Winston (recomendado)

```typescript
// Backend
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
        }),
      ],
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
})
export class AppModule {}
```

---

## Monitoring & Alerts (futuro)

### Prometheus Metrics

```typescript
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
})
export class AppModule {}
```

### Healthchecks

```typescript
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
```

---

## Troubleshooting

### Backend lento

1. Adicione índices
2. Reduza payload size
3. Use Redis para cache
4. Habilite query logging

### Frontend lento

1. Lazy load rotas
2. Virtual scrolling (tabelas grandes)
3. Debounce de busca
4. Service Worker (futuro)

---

**Dúvidas? Consulte a [documentação completa](./architecture.md)!**

