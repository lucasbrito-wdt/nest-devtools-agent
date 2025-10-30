# 📖 Exemplos de Uso - nest-devtools-agent

Este documento contém exemplos práticos de como usar o `nest-devtools-agent` em diferentes cenários.

---

## 📌 Exemplo 1: Configuração Básica

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { DevtoolsModule } from 'nest-devtools-agent';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: process.env.NODE_ENV !== 'production',
      backendUrl: 'http://localhost:4000',
      apiKey: 'dev-key',
    }),
    UsersModule,
  ],
})
export class AppModule {}
```

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
}
bootstrap();
```

---

## 📌 Exemplo 2: Com ConfigService

```typescript
// src/config/devtools.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('devtools', () => ({
  enabled: process.env.NODE_ENV !== 'production',
  backendUrl: process.env.DEVTOOLS_BACKEND_URL || 'http://localhost:4000',
  apiKey: process.env.DEVTOOLS_API_KEY || 'dev-key',
  timeout: parseInt(process.env.DEVTOOLS_TIMEOUT, 10) || 5000,
  maxRetries: parseInt(process.env.DEVTOOLS_MAX_RETRIES, 10) || 3,
  enableBuffer: process.env.DEVTOOLS_ENABLE_BUFFER === 'true',
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
    'api_key',
    'apiKey',
    'access_token',
    'refresh_token',
  ],
}));
```

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevtoolsModule } from 'nest-devtools-agent';
import devtoolsConfig from './config/devtools.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [devtoolsConfig],
    }),

    DevtoolsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        enabled: config.get('devtools.enabled'),
        backendUrl: config.get('devtools.backendUrl'),
        apiKey: config.get('devtools.apiKey'),
        timeout: config.get('devtools.timeout'),
        maxRetries: config.get('devtools.maxRetries'),
        enableBuffer: config.get('devtools.enableBuffer'),
        sensitiveFields: config.get('devtools.sensitiveFields'),
      }),
    }),
  ],
})
export class AppModule {}
```

```env
# .env
NODE_ENV=development
DEVTOOLS_BACKEND_URL=http://localhost:4000
DEVTOOLS_API_KEY=dev-key
DEVTOOLS_TIMEOUT=5000
DEVTOOLS_MAX_RETRIES=3
DEVTOOLS_ENABLE_BUFFER=false
```

---

## 📌 Exemplo 3: Configuração por Ambiente

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { DevtoolsModule } from 'nest-devtools-agent';

function getDevtoolsConfig() {
  const env = process.env.NODE_ENV;

  // Configuração para desenvolvimento
  if (env === 'development') {
    return {
      enabled: true,
      backendUrl: 'http://localhost:4000',
      apiKey: 'dev-key',
      captureBody: true,
      captureResponse: true,
      captureHeaders: true,
    };
  }

  // Configuração para staging
  if (env === 'staging') {
    return {
      enabled: true,
      backendUrl: process.env.DEVTOOLS_BACKEND_URL,
      apiKey: process.env.DEVTOOLS_API_KEY,
      captureBody: true,
      captureResponse: false, // Não capturar response em staging
      captureHeaders: true,
      sensitiveFields: ['password', 'token', 'secret', 'authorization', 'cookie'],
    };
  }

  // Configuração para produção (desabilitado)
  return {
    enabled: false,
    backendUrl: '',
    apiKey: '',
  };
}

@Module({
  imports: [DevtoolsModule.forRoot(getDevtoolsConfig())],
})
export class AppModule {}
```

---

## 📌 Exemplo 4: Com Feature Flags

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevtoolsModule } from 'nest-devtools-agent';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    DevtoolsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Feature flag para habilitar DevTools
        const isDevtoolsEnabled = config.get('FEATURE_DEVTOOLS_ENABLED') === 'true';

        return {
          enabled: isDevtoolsEnabled && config.get('NODE_ENV') !== 'production',
          backendUrl: config.get('DEVTOOLS_BACKEND_URL'),
          apiKey: config.get('DEVTOOLS_API_KEY'),
        };
      },
    }),
  ],
})
export class AppModule {}
```

```env
# .env
NODE_ENV=development
FEATURE_DEVTOOLS_ENABLED=true
DEVTOOLS_BACKEND_URL=http://localhost:4000
DEVTOOLS_API_KEY=dev-key
```

---

## 📌 Exemplo 5: Monitoramento Seletivo

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { DevtoolsModule } from 'nest-devtools-agent';

@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: true,
      backendUrl: 'http://localhost:4000',
      apiKey: 'dev-key',

      // Capturar apenas headers (sem body)
      captureHeaders: true,
      captureBody: false,
      captureResponse: false,

      // Campos sensíveis para redação
      sensitiveFields: [
        'password',
        'token',
        'secret',
        'authorization',
        'cookie',
        'credit_card',
        'ssn',
        'cpf',
      ],
    }),
  ],
})
export class AppModule {}
```

---

## 📌 Exemplo 6: Com Microserviços

```typescript
// src/app.module.ts (API Gateway)
import { Module } from '@nestjs/common';
import { DevtoolsModule } from 'nest-devtools-agent';

@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: true,
      backendUrl: 'http://devtools-backend:4000',
      apiKey: process.env.DEVTOOLS_API_KEY,
      environment: 'api-gateway',
    }),
  ],
})
export class ApiGatewayModule {}
```

```typescript
// src/app.module.ts (Microserviço de Usuários)
import { Module } from '@nestjs/common';
import { DevtoolsModule } from 'nest-devtools-agent';

@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: true,
      backendUrl: 'http://devtools-backend:4000',
      apiKey: process.env.DEVTOOLS_API_KEY,
      environment: 'users-service',
    }),
  ],
})
export class UsersServiceModule {}
```

---

## 📌 Exemplo 7: Injeção Manual do DevtoolsService

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { DevtoolsService } from 'nest-devtools-agent';

@Injectable()
export class UsersService {
  constructor(private readonly devtools: DevtoolsService) {}

  async createUser(data: any) {
    try {
      // Lógica de criação de usuário
      const user = await this.create(data);

      // Enviar evento customizado para DevTools
      await this.devtools.sendEvent({
        type: 'custom',
        timestamp: new Date().toISOString(),
        source: 'UsersService',
        meta: {
          action: 'user_created',
          userId: user.id,
          email: user.email,
        },
      });

      return user;
    } catch (error) {
      // Enviar erro para DevTools
      await this.devtools.sendEvent({
        type: 'exception',
        timestamp: new Date().toISOString(),
        source: 'UsersService',
        meta: {
          error: error.message,
          stack: error.stack,
          action: 'create_user_failed',
        },
      });

      throw error;
    }
  }

  async getBufferStats() {
    // Obter estatísticas do buffer
    return this.devtools.getBufferStats();
  }

  async flushEvents() {
    // Forçar envio de eventos do buffer
    await this.devtools.flushBuffer();
  }
}
```

---

## 📌 Exemplo 8: Testes (Desabilitar DevTools)

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Desabilitar DevTools durante testes
      .overrideProvider('DEVTOOLS_CONFIG')
      .useValue({
        enabled: false,
        backendUrl: '',
        apiKey: '',
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });
});
```

Ou via variável de ambiente:

```bash
# Rodar testes com DevTools desabilitado
NODE_ENV=test pnpm test
```

---

## 📌 Exemplo 9: Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - DEVTOOLS_BACKEND_URL=http://devtools-backend:4000
      - DEVTOOLS_API_KEY=dev-key
    depends_on:
      - devtools-backend

  devtools-backend:
    image: nest-devtools-backend:latest
    ports:
      - '4000:4000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@db:5432/devtools
      - API_KEY=dev-key
    depends_on:
      - db

  db:
    image: postgres:15
    ports:
      - '5432:5432'
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=devtools
```

---

## 📌 Exemplo 10: Kubernetes

```yaml
# k8s/devtools-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: devtools-config
data:
  DEVTOOLS_BACKEND_URL: 'http://devtools-backend-service:4000'
  NODE_ENV: 'staging'
```

```yaml
# k8s/devtools-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: devtools-secret
type: Opaque
data:
  DEVTOOLS_API_KEY: base64-encoded-key
```

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: my-api:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              valueFrom:
                configMapKeyRef:
                  name: devtools-config
                  key: NODE_ENV
            - name: DEVTOOLS_BACKEND_URL
              valueFrom:
                configMapKeyRef:
                  name: devtools-config
                  key: DEVTOOLS_BACKEND_URL
            - name: DEVTOOLS_API_KEY
              valueFrom:
                secretKeyRef:
                  name: devtools-secret
                  key: DEVTOOLS_API_KEY
```

---

## 📌 Exemplo 11: Tracking HTTP Client (Axios, Fetch, HttpService)

O `nest-devtools-agent` automaticamente captura requisições HTTP de saída feitas através de:

- ✅ **Axios** (instância global e instâncias criadas dinamicamente)
- ✅ **HttpService do NestJS** (detecção automática)
- ✅ **Fetch nativo** (Node.js 18+)

### Configuração Básica

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { DevtoolsModule } from 'nest-devtools-agent';

@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: true,
      backendUrl: 'http://localhost:4000',
      apiKey: 'dev-key',
      
      // Habilitar tracking de HTTP Client
      captureHttpClient: true,
      
      // Opções de captura
      captureHeaders: true,
      captureBody: true,
      captureResponse: true,
      captureResponseHeaders: false,
    }),
  ],
})
export class AppModule {}
```

### Exemplo com Axios

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class UsersService {
  // Todas as chamadas axios são automaticamente rastreadas
  async fetchUserFromExternalAPI(userId: string) {
    // ✅ Esta requisição será automaticamente capturada
    const response = await axios.get(`https://api.external.com/users/${userId}`);
    return response.data;
  }

  // Instâncias criadas dinamicamente também são capturadas
  async fetchWithCustomInstance() {
    const client = axios.create({
      baseURL: 'https://api.custom.com',
      timeout: 5000,
    });
    
    // ✅ Esta requisição também será capturada automaticamente
    const response = await client.get('/data');
    return response.data;
  }
}
```

### Exemplo com HttpService do NestJS

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(private readonly httpService: HttpService) {}

  async fetchUser(userId: string) {
    // ✅ Requisições via HttpService são automaticamente detectadas e rastreadas
    const response = await firstValueFrom(
      this.httpService.get(`https://api.example.com/users/${userId}`),
    );
    return response.data;
  }

  async createUser(data: any) {
    // ✅ POST requests também são rastreados
    const response = await firstValueFrom(
      this.httpService.post('https://api.example.com/users', data),
    );
    return response.data;
  }
}
```

### Exemplo com Fetch Nativo

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  // ✅ Fetch nativo (Node.js 18+) é automaticamente interceptado
  async fetchUserWithFetch(userId: string) {
    const response = await fetch(`https://api.example.com/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/json',
      },
    });
    
    return await response.json();
  }

  async createUserWithFetch(data: any) {
    const response = await fetch('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    return await response.json();
  }
}
```

### Interceptar Instâncias Axios Já Criadas

Se você tem uma instância Axios que foi criada antes do módulo inicializar:

```typescript
// src/users/users.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { HttpClientTracer } from 'nest-devtools-agent';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly externalApiClient: AxiosInstance;

  constructor(private readonly httpClientTracer: HttpClientTracer) {
    // Instância criada antes do módulo inicializar
    this.externalApiClient = axios.create({
      baseURL: 'https://external-api.com',
      timeout: 10000,
    });
  }

  onModuleInit() {
    // Registra manualmente para tracking
    this.httpClientTracer.interceptAxiosInstance(this.externalApiClient);
  }

  async fetchData() {
    // ✅ Agora será rastreado
    const response = await this.externalApiClient.get('/data');
    return response.data;
  }
}
```

### Tracking Manual para Requisições Customizadas

Para requisições feitas com bibliotecas não suportadas:

```typescript
// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { HttpClientTracer } from 'nest-devtools-agent';
import * as https from 'https';

@Injectable()
export class UsersService {
  constructor(private readonly httpClientTracer: HttpClientTracer) {}

  async fetchWithCustomLibrary() {
    // Wrap sua requisição customizada
    return await this.httpClientTracer.trackCustomRequest(
      'GET',
      'https://api.custom.com/data',
      async () => {
        // Sua lógica customizada aqui
        return { data: 'result' };
      },
      {
        headers: { 'Authorization': 'Bearer token' },
        clientType: 'unknown', // ou 'axios', 'fetch', 'httpService'
      },
    );
  }
}
```

### Dados Capturados

Para cada requisição HTTP de saída, os seguintes dados são capturados:

```typescript
{
  type: 'http_client',
  meta: {
    timestamp: 1705234567890,
    method: 'GET',
    url: 'https://api.example.com/users/123',
    baseURL: 'https://api.example.com',
    clientType: 'axios', // ou 'fetch', 'httpService', 'unknown'
    headers: {
      'Authorization': 'Bearer ***',
      'Content-Type': 'application/json',
    },
    requestBody: { /* corpo da requisição */ },
    responseStatus: 200,
    responseHeaders: {
      'content-type': 'application/json',
    },
    responseBody: { /* corpo da resposta */ },
    duration: 245, // em milissegundos
    timeout: 5000,
    retries: 0,
    hostname: 'server-01',
    pid: 12345,
    environment: 'development',
  },
}
```

### Filtros e Sanitização

Campos sensíveis são automaticamente redigidos (sanitizados):

```typescript
// Configuração de campos sensíveis
DevtoolsModule.forRoot({
  // ...
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'authorization',
    'apiKey',
    'api_key',
    'access_token',
    'refresh_token',
  ],
});
```

Os valores desses campos serão substituídos por `***` nos eventos enviados.

---

## 📌 Exemplo 12: Tracking Redis - Operações Redis

O `nest-devtools-agent` captura automaticamente todas as operações Redis executadas na sua aplicação, suportando:

- ✅ **ioredis** (biblioteca mais popular)
- ✅ **node-redis** (cliente oficial do Redis)
- ✅ **Comandos customizados** via tracking manual

### Configuração Básica

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { DevtoolsModule } from 'nest-devtools-agent';

@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: true,
      backendUrl: 'http://localhost:4000',
      apiKey: 'dev-key',
      
      // Habilitar tracking de Redis
      captureRedis: true,
      
      // Configuração opcional do Redis (para metadata)
      redisConfig: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        db: parseInt(process.env.REDIS_DB, 10) || 0,
      },
    }),
  ],
})
export class AppModule {}
```

### Método 1: Interceptar Cliente Redis Automaticamente (Recomendado)

Esta é a forma mais simples e recomendada. O `RedisTracer` intercepta automaticamente todas as operações do cliente Redis.

#### Exemplo com ioredis

```typescript
// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisTracer } from 'nest-devtools-agent';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT, 10) || 6379,
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB, 10) || 0,
        });
      },
    },
    // RedisTracer já está disponível globalmente após importar DevtoolsModule
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
```

```typescript
// src/cache/cache.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisTracer } from 'nest-devtools-agent';

@Injectable()
export class CacheService implements OnModuleInit {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly redisTracer: RedisTracer,
  ) {}

  onModuleInit() {
    // ✅ Intercepta automaticamente todas as operações Redis
    this.redisTracer.interceptRedisClient(this.redis);
  }

  // Todas as operações abaixo serão automaticamente rastreadas
  async get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      return this.redis.setex(key, ttl, value);
    }
    return this.redis.set(key, value);
  }

  async del(key: string) {
    return this.redis.del(key);
  }

  async exists(key: string) {
    return this.redis.exists(key);
  }

  async incr(key: string) {
    return this.redis.incr(key);
  }

  async hget(key: string, field: string) {
    return this.redis.hget(key, field);
  }

  async hset(key: string, field: string, value: string) {
    return this.redis.hset(key, field, value);
  }

  async hgetall(key: string) {
    return this.redis.hgetall(key);
  }
}
```

#### Exemplo com node-redis

```typescript
// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { createClient } from 'redis';
import { RedisTracer } from 'nest-devtools-agent';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async () => {
        const client = createClient({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        });
        await client.connect();
        return client;
      },
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
```

```typescript
// src/cache/cache.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { RedisTracer } from 'nest-devtools-agent';

@Injectable()
export class CacheService implements OnModuleInit {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: RedisClientType,
    private readonly redisTracer: RedisTracer,
  ) {}

  onModuleInit() {
    // ✅ Intercepta automaticamente todas as operações Redis
    this.redisTracer.interceptRedisClient(this.redis);
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: string) {
    return this.redis.set(key, value);
  }

  async del(key: string) {
    return this.redis.del(key);
  }
}
```

### Método 2: Cliente Wrapped (Para Controle Mais Fino)

Se você precisa de mais controle sobre quais comandos são rastreados, pode usar o método `createTrackedRedisClient`:

```typescript
// src/cache/cache.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisTracer } from 'nest-devtools-agent';

@Injectable()
export class CacheService implements OnModuleInit {
  private trackedRedis: any;

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly redisTracer: RedisTracer,
  ) {}

  onModuleInit() {
    // ✅ Cria um cliente wrapped que rastreia apenas comandos comuns
    this.trackedRedis = this.redisTracer.createTrackedRedisClient(this.redis);
  }

  async cachedOperation() {
    // ✅ Será rastreado automaticamente
    await this.trackedRedis.set('key', 'value');
    const value = await this.trackedRedis.get('key');
    return value;
  }

  async untrackedOperation() {
    // ⚠️ NÃO será rastreado (usa cliente original)
    return this.redis.eval('custom script', 0);
  }
}
```

**Comandos suportados no wrapper:**

- Strings: `get`, `set`, `del`, `exists`, `expire`, `ttl`, `incr`, `decr`, `incrby`, `decrby`
- Hashes: `hget`, `hset`, `hdel`, `hgetall`
- Lists: `lpush`, `rpush`, `lpop`, `rpop`, `lrange`
- Sets: `sadd`, `srem`, `smembers`, `sismember`
- Sorted Sets: `zadd`, `zrem`, `zrange`, `zscore`

### Método 3: Tracking Manual para Operações Customizadas

Para operações Redis muito específicas ou comandos não suportados automaticamente:

```typescript
// src/cache/cache.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisTracer } from 'nest-devtools-agent';

@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly redisTracer: RedisTracer,
  ) {}

  async customLuaScript(key: string, value: string) {
    // ✅ Wrap operação customizada para tracking
    return this.redisTracer.trackCustomOperation(
      'EVAL',
      async () => {
        // Seu script Lua customizado
        return await this.redis.eval(
          `
            local key = KEYS[1]
            local value = ARGV[1]
            redis.call('SET', key, value)
            return redis.call('GET', key)
          `,
          1,
          key,
          value,
        );
      },
      {
        key: key,
        args: [value],
      },
    );
  }

  async batchOperation(keys: string[]) {
    // ✅ Tracking manual para operações em lote
    return this.redisTracer.trackCustomOperation(
      'MGET',
      async () => {
        return await this.redis.mget(...keys);
      },
      {
        args: keys,
      },
    );
  }

  async pipelineOperation() {
    // ✅ Tracking para pipelines
    return this.redisTracer.trackCustomOperation(
      'PIPELINE',
      async () => {
        const pipeline = this.redis.pipeline();
        pipeline.set('key1', 'value1');
        pipeline.set('key2', 'value2');
        pipeline.get('key1');
        return await pipeline.exec();
      },
      {
        args: ['key1', 'key2'],
      },
    );
  }
}
```

### Configuração com ConfigService

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevtoolsModule } from 'nest-devtools-agent';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    DevtoolsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        enabled: config.get('NODE_ENV') !== 'production',
        backendUrl: config.get('DEVTOOLS_BACKEND_URL'),
        apiKey: config.get('DEVTOOLS_API_KEY'),
        
        // Configuração do Redis tracking
        captureRedis: config.get('DEVTOOLS_CAPTURE_REDIS') === 'true',
        redisConfig: {
          host: config.get('REDIS_HOST'),
          port: parseInt(config.get('REDIS_PORT'), 10),
          db: parseInt(config.get('REDIS_DB'), 10),
        },
      }),
    }),
  ],
})
export class AppModule {}
```

```env
# .env
NODE_ENV=development
DEVTOOLS_BACKEND_URL=http://localhost:4000
DEVTOOLS_API_KEY=dev-key
DEVTOOLS_CAPTURE_REDIS=true

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

### Exemplo Completo: Serviço de Cache com Redis Tracking

```typescript
// src/users/users.service.ts
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { RedisTracer } from 'nest-devtools-agent';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
    private readonly redisTracer: RedisTracer,
  ) {}

  onModuleInit() {
    // Intercepta automaticamente todas as operações
    this.redisTracer.interceptRedisClient(this.redis);
  }

  async getUserById(userId: string) {
    const cacheKey = `user:${userId}`;
    
    // ✅ GET será rastreado automaticamente
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Buscar do banco de dados...
    const user = await this.fetchUserFromDatabase(userId);
    
    // ✅ SET será rastreado automaticamente
    await this.redis.setex(cacheKey, 3600, JSON.stringify(user));
    
    return user;
  }

  async incrementUserViews(userId: string) {
    const key = `user:${userId}:views`;
    
    // ✅ INCR será rastreado automaticamente
    return await this.redis.incr(key);
  }

  async getUserSession(userId: string) {
    const key = `session:${userId}`;
    
    // ✅ HGETALL será rastreado automaticamente
    return await this.redis.hgetall(key);
  }

  async setUserSession(userId: string, sessionData: Record<string, string>) {
    const key = `session:${userId}`;
    
    // ✅ HSET será rastreado automaticamente
    const pipeline = this.redis.pipeline();
    Object.entries(sessionData).forEach(([field, value]) => {
      pipeline.hset(key, field, value);
    });
    await pipeline.exec();
  }

  private async fetchUserFromDatabase(userId: string) {
    // Sua lógica de busca no banco...
    return { id: userId, name: 'John Doe' };
  }
}
```

### Dados Capturados

Para cada operação Redis, os seguintes dados são capturados:

```typescript
{
  type: 'redis',
  meta: {
    timestamp: 1705234567890,
    command: 'GET', // Comando Redis em maiúsculas
    args: ['user:123'], // Argumentos do comando
    key: 'user:123', // Primeiro argumento (geralmente a chave)
    value: '{"id":"123","name":"John"}', // Valor (para SET, SETEX, etc.)
    duration: 2, // Duração em milissegundos
    result: '{"id":"123","name":"John"}', // Resultado da operação
    error: undefined, // Erro (se houver)
    database: 0, // Número do banco Redis
    hostname: 'server-01',
    pid: 12345,
    environment: 'development',
  },
}
```

### Exemplo de Erro Capturado

```typescript
{
  type: 'redis',
  meta: {
    timestamp: 1705234567890,
    command: 'GET',
    args: ['user:123'],
    key: 'user:123',
    duration: 5,
    error: 'Connection timeout',
    database: 0,
    hostname: 'server-01',
    pid: 12345,
    environment: 'development',
  },
}
```

### Verificando se o Tracking Está Funcionando

1. **Verifique os logs do console:**

```bash
# Você deverá ver logs como:
# 🔴 RedisTracer habilitado
# ✅ Redis: GET user:123 (2ms)
# ✅ Redis: SET user:123 (1ms)
```

2. **Verifique no dashboard DevTools:**

Acesse `http://localhost:4000/redis` (ou a URL do seu backend) e você verá todas as operações Redis em tempo real.

3. **Teste com uma operação Redis:**

```typescript
// Em qualquer serviço que tenha Redis injetado
async testRedis() {
  await this.redis.set('test:key', 'test:value');
  const value = await this.redis.get('test:key');
  console.log(value); // 'test:value'
  
  // Verifique o dashboard DevTools - você deve ver 2 eventos Redis
}
```

### Troubleshooting

#### Redis tracking não está funcionando

1. **Verifique se `captureRedis: true`** está configurado no `DevtoolsModule.forRoot()`
2. **Verifique se o RedisTracer está sendo injetado** corretamente
3. **Verifique se `interceptRedisClient()`** foi chamado no `onModuleInit()`
4. **Verifique os logs** para mensagens como "🔴 RedisTracer habilitado"

#### Cliente Redis não é reconhecido

O `RedisTracer` suporta automaticamente:
- `ioredis` - classe `Redis` ou `Cluster`
- `node-redis` - clientes com método `sendCommand`

Se você usa outra biblioteca, use o método `trackCustomOperation()` para tracking manual.

#### Performance degradada

Se você notar lentidão ao usar Redis tracking:

1. **Verifique se o backend DevTools está acessível** - erros de conexão podem causar delays
2. **Configure buffer** para evitar bloqueios:
   ```typescript
   DevtoolsModule.forRoot({
     // ...
     enableBuffer: true,
     maxBufferSize: 100,
   })
   ```
3. **Desabilite tracking em produção** ou apenas em ambientes específicos

---

## 🔍 Verificação

Após configurar, verifique se está funcionando:

```bash
# Fazer uma requisição de teste
curl http://localhost:3000/api/users

# Verificar logs do container
docker logs api

# Você deverá ver:
# [DevtoolsService] Event sent: request
```

---

## 📚 Mais Recursos

- [Documentação Completa](./README.md)
- [Guia de Instalação](./INSTALLATION.md)
- [Troubleshooting](./README.md#-troubleshooting)

---

**Feito com ❤️ para a comunidade NestJS**
