# Comprehensive Logging System - User Guide

## 🎉 Sistema Completo de Logging para NestJS DevTools

Este guia fornece instruções completas para usar o sistema de logging abrangente que captura:

- 📅 **Schedule/Jobs** - Tarefas agendadas e cron jobs
- 🔌 **HTTP Client** - Requisições HTTP de saída
- 💾 **Redis** - Operações Redis
- 👥 **Sessions** - Rastreamento de sessões de usuário
- 🌐 **Requests** - Requisições HTTP de entrada (existente)
- ⚠️ **Exceptions** - Exceções e erros (existente)
- 📝 **Logs** - Logs da aplicação (existente)

## 📦 Instalação

### 1. Instalar o Agent

```bash
npm install nest-devtools-agent
```

### 2. Configurar no seu App NestJS

```typescript
import { Module } from '@nestjs/common';
import { DevtoolsModule } from 'nest-devtools-agent';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Configuração do DevTools
    DevtoolsModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        enabled: config.get('NODE_ENV') !== 'production',
        backendUrl: config.get('DEVTOOLS_BACKEND_URL', 'http://localhost:4000'),
        apiKey: config.get('DEVTOOLS_API_KEY', 'dev-key'),

        // Configurações de captura
        captureHeaders: true,
        captureBody: true,
        captureResponse: true,
        captureResponseHeaders: true,
        captureSession: true,
        captureSchedule: true,
        captureHttpClient: true,
        captureRedis: true,

        // Configuração Redis (se usar Redis)
        redisConfig: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          db: 0,
        },
      }),
    }),

    // Seus outros módulos...
  ],
})
export class AppModule {}
```

## 🚀 Uso dos Tracers

### 1. Schedule Tracer - Rastreamento de Jobs

```typescript
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ScheduleTracer } from 'nest-devtools-agent';

@Injectable()
export class TasksService {
  constructor(private readonly scheduleTracer: ScheduleTracer) {}

  @Cron('0 * * * *') // A cada hora
  async handleHourlyTask() {
    const jobId = 'hourly-cleanup';
    const jobName = 'Hourly Cleanup Task';

    // Registra início do job
    this.scheduleTracer.trackJobStart(jobId, jobName, '0 * * * *');

    try {
      // Executa o trabalho
      const result = await this.performCleanup();

      // Registra sucesso
      this.scheduleTracer.trackJobComplete(jobId, result);
    } catch (error) {
      // Registra falha
      this.scheduleTracer.trackJobFailure(jobId, error);
    }
  }

  private async performCleanup() {
    // Sua lógica aqui
    return { deletedRecords: 42 };
  }
}
```

### 2. HTTP Client Tracer - Requisições de Saída

#### Opção A: Interceptar HttpService (Automático)

```typescript
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { HttpClientTracer } from 'nest-devtools-agent';

@Injectable()
export class ExternalApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly httpClientTracer: HttpClientTracer,
  ) {
    // Intercepta automaticamente todas as requisições do HttpService
    this.httpClientTracer.interceptAxiosInstance(this.httpService.axiosRef);
  }

  async fetchData() {
    // Todas as requisições serão rastreadas automaticamente
    const response = await this.httpService.get('https://api.example.com/data').toPromise();
    return response.data;
  }
}
```

#### Opção B: Rastreamento Manual

```typescript
async fetchDataManual() {
  return this.httpClientTracer.trackCustomRequest(
    'GET',
    'https://api.example.com/data',
    async () => {
      const response = await fetch('https://api.example.com/data');
      return response.json();
    },
    {
      headers: { 'Authorization': 'Bearer token' },
    }
  );
}
```

### 3. Redis Tracer - Operações Redis

#### Opção A: Interceptar Cliente Redis (Automático)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { RedisTracer } from 'nest-devtools-agent';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly redisTracer: RedisTracer,
  ) {
    // Intercepta automaticamente todas as operações
    this.redisTracer.interceptRedisClient(this.redis);
  }

  async get(key: string) {
    // Operação rastreada automaticamente
    return this.redis.get(key);
  }

  async set(key: string, value: string) {
    // Operação rastreada automaticamente
    return this.redis.set(key, value);
  }
}
```

#### Opção B: Cliente Wrapped

```typescript
constructor(
  @Inject('REDIS_CLIENT') private readonly redis: Redis,
  private readonly redisTracer: RedisTracer,
) {
  // Cria um cliente wrapped que rastreia automaticamente
  this.trackedRedis = this.redisTracer.createTrackedRedisClient(this.redis);
}

async cachedOperation() {
  await this.trackedRedis.set('key', 'value');
  const value = await this.trackedRedis.get('key');
  return value;
}
```

#### Opção C: Rastreamento Manual

```typescript
async customOperation() {
  return this.redisTracer.trackCustomOperation(
    'CUSTOM_COMMAND',
    async () => {
      // Sua operação customizada
      return await this.redis.eval('...script...', 0);
    },
    {
      key: 'my-key',
      args: ['arg1', 'arg2'],
    }
  );
}
```

### 4. Session Subscriber - Rastreamento de Sessões

#### Opção A: Middleware Automático (Recomendado)

```typescript
// No main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SessionSubscriber } from 'nest-devtools-agent';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar express-session
  app.use(
    session({
      secret: 'your-secret',
      resave: false,
      saveUninitialized: false,
    }),
  );

  // Adicionar middleware de rastreamento de sessão
  const sessionSubscriber = app.get(SessionSubscriber);
  app.use(sessionSubscriber.createSessionMiddleware());

  await app.listen(3000);
}
bootstrap();
```

#### Opção B: Interceptar Session Store

```typescript
import RedisStore from 'connect-redis';
import { SessionSubscriber } from 'nest-devtools-agent';

const sessionStore = new RedisStore({ client: redisClient });

// Intercepta o store para rastrear automaticamente
const sessionSubscriber = app.get(SessionSubscriber);
sessionSubscriber.interceptSessionStore(sessionStore);

app.use(
  session({
    store: sessionStore,
    secret: 'your-secret',
  }),
);
```

#### Opção C: Rastreamento Manual

```typescript
import { SessionSubscriber } from 'nest-devtools-agent';

@Injectable()
export class AuthService {
  constructor(private readonly sessionSubscriber: SessionSubscriber) {}

  async login(req: Request, userId: string) {
    const sessionId = req.session.id;

    // Registra criação de sessão
    this.sessionSubscriber.trackSessionCreated(
      sessionId,
      { userId, loginTime: new Date() },
      {
        userId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      },
    );
  }

  async logout(req: Request) {
    const sessionId = req.session.id;

    // Registra destruição de sessão
    this.sessionSubscriber.trackSessionDestroyed(sessionId, {
      userId: req.session.userId,
      ip: req.ip,
    });
  }
}
```

## 🖥️ Dashboard Frontend

### Acessar o Dashboard

1. **Iniciar o Backend:**

   ```bash
   cd packages/backend
   npm run start:dev
   ```

2. **Iniciar o Frontend:**

   ```bash
   cd packages/frontend
   npm run dev
   ```

3. **Abrir no Navegador:**
   - Dashboard: http://localhost:5173/
   - Schedule: http://localhost:5173/schedule
   - HTTP Client: http://localhost:5173/http-client
   - Redis: http://localhost:5173/redis
   - Sessions: http://localhost:5173/sessions

### Funcionalidades do Dashboard

#### 📅 Schedule Page

- Visualizar todos os jobs agendados
- Filtrar por status (scheduled, running, completed, failed)
- Ver duração de execução
- Acompanhar próxima execução
- Estatísticas: Total, Completados, Falhados, Taxa de Sucesso

#### 🔌 HTTP Client Page

- Monitorar requisições HTTP de saída
- Filtrar por método (GET, POST, PUT, DELETE)
- Filtrar por URL e status code
- Ver request/response completos
- Estatísticas: Total, Sucesso, Falhas, Duração Média

#### 💾 Redis Page

- Rastrear operações Redis
- Filtrar por comando e chave
- Ver argumentos e resultados
- Identificar operações lentas
- Estatísticas: Total, Sucesso, Falhas, Duração Média

#### 👥 Sessions Page

- Monitorar sessões de usuários
- Filtrar por ação (created, updated, destroyed, accessed)
- Ver dados da sessão
- Rastrear usuários ativos
- Estatísticas: Total, Ativas, Usuários Únicos, Duração Média

## ⚙️ Configuração Avançada

### Variáveis de Ambiente

```env
# Backend DevTools
DEVTOOLS_BACKEND_URL=http://localhost:4000
DEVTOOLS_API_KEY=your-secure-api-key

# Configurações de Captura
DEVTOOLS_CAPTURE_HEADERS=true
DEVTOOLS_CAPTURE_BODY=true
DEVTOOLS_CAPTURE_RESPONSE=true
DEVTOOLS_CAPTURE_RESPONSE_HEADERS=true
DEVTOOLS_CAPTURE_SESSION=true
DEVTOOLS_CAPTURE_SCHEDULE=true
DEVTOOLS_CAPTURE_HTTP_CLIENT=true
DEVTOOLS_CAPTURE_REDIS=true

# Redis (se usar)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/devtools
```

### Configuração Granular

```typescript
DevtoolsModule.forRoot({
  enabled: true,
  backendUrl: 'http://localhost:4000',
  apiKey: 'dev-key',

  // Controle fino sobre o que capturar
  captureHeaders: true,
  captureBody: true,
  captureResponse: false, // Desabilitar se responses forem muito grandes
  captureResponseHeaders: true,

  // Limites de tamanho
  maxBodySize: 10240, // 10KB

  // Timeout e retry
  timeout: 5000,
  maxRetries: 3,

  // Buffer para quando backend está offline
  enableBuffer: true,
  maxBufferSize: 100,

  // Campos sensíveis (serão redactados)
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
    'api_key',
    'credit_card',
  ],

  // Capturas específicas
  captureSession: true,
  captureSchedule: true,
  captureHttpClient: true,
  captureRedis: true,

  // Config Redis
  redisConfig: {
    host: 'localhost',
    port: 6379,
    db: 0,
  },

  // Ambiente
  environment: process.env.NODE_ENV,
});
```

## 🔒 Segurança

### Proteção de Dados Sensíveis

O sistema automaticamente redacta campos sensíveis:

```typescript
// Estes campos serão automaticamente redactados
const defaultSensitiveFields = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'api_key',
  'apiKey',
  'access_token',
  'refresh_token',
];

// Adicionar campos customizados
DevtoolsModule.forRoot({
  sensitiveFields: [...defaultSensitiveFields, 'ssn', 'credit_card', 'cvv'],
});
```

### Desabilitar em Produção

```typescript
DevtoolsModule.forRoot({
  enabled: process.env.NODE_ENV !== 'production',
  // ou
  enabled: process.env.DEVTOOLS_ENABLED === 'true',
});
```

## 📊 Casos de Uso

### 1. Debugging de Jobs Lentos

```typescript
// O Schedule Tracer automaticamente captura duração
@Cron('*/5 * * * *')
async processQueue() {
  this.scheduleTracer.trackJobStart('queue-processor', 'Queue Processor');

  try {
    await this.processItems();
    this.scheduleTracer.trackJobComplete('queue-processor');
  } catch (error) {
    this.scheduleTracer.trackJobFailure('queue-processor', error);
  }
}

// No dashboard: Schedule > Slowest Jobs
// Identifica jobs que estão demorando muito
```

### 2. Monitorar APIs Externas

```typescript
// Rastreia automaticamente todas as chamadas
this.httpClientTracer.interceptAxiosInstance(this.httpService.axiosRef);

// No dashboard: HTTP Client > Status Distribution
// Veja quantas requisições estão falhando por endpoint
```

### 3. Otimizar Cache Redis

```typescript
// Rastreia todas as operações Redis
this.redisTracer.interceptRedisClient(this.redis);

// No dashboard: Redis > Most Accessed Keys
// Identifica keys mais acessadas para otimização
```

### 4. Análise de Sessões

```typescript
// Rastreia ciclo de vida completo
app.use(sessionSubscriber.createSessionMiddleware());

// No dashboard: Sessions > Longest Sessions
// Identifica sessões anormalmente longas
```

## 🐛 Troubleshooting

### Eventos não aparecem no dashboard

1. Verificar se o backend está rodando
2. Verificar `enabled: true` na configuração
3. Verificar `backendUrl` correto
4. Verificar logs do backend para erros de ingestão

### Performance Impact

O sistema é otimizado para mínimo impacto:

- Envio assíncrono (fire-and-forget)
- Buffer para falhas temporárias
- Sanitização eficiente
- Configurável por tipo de evento

### Logs Excessivos

Ajustar nível de log:

```typescript
// No agent
const logger = new Logger(DevtoolsService.name);
logger.setLogLevels(['error', 'warn']); // Apenas erros e warnings
```

## 📚 Referências

- [Documentação Completa](./IMPLEMENTATION_SUMMARY.md)
- [Guia de Instalação](./packages/agent/INSTALLATION.md)
- [Exemplos de Uso](./packages/agent/USAGE_EXAMPLE.md)
- [API Reference](./docs/api.md)

## 🎯 Próximos Passos

Após configurar o sistema:

1. ✅ Configurar o agent no seu app
2. ✅ Habilitar os tracers necessários
3. ✅ Iniciar backend e frontend
4. ✅ Gerar alguns eventos (fazer requisições, executar jobs, etc.)
5. ✅ Visualizar no dashboard
6. ✅ Configurar alertas (opcional)
7. ✅ Integrar com CI/CD (opcional)

## 💡 Dicas

- **Desenvolvimento:** Habilite todos os tracers para máxima visibilidade
- **Staging:** Habilite tracers críticos (Schedule, HTTP Client)
- **Produção:** Desabilite ou use com muito cuidado (apenas erros críticos)
- **Performance:** Desabilite `captureResponse` se responses forem muito grandes
- **Segurança:** Sempre configure `sensitiveFields` adequadamente

---

**Sistema desenvolvido com ❤️ para facilitar o debugging e monitoramento de aplicações NestJS**
