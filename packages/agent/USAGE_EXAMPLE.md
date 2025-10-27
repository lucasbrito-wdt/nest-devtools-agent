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
