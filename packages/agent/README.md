# 🔭 nest-devtools-agent

> Agent de instrumentação NestJS para DevTools Telescope - rastreie requisições HTTP, exceções e logs em tempo real

[![npm version](https://badge.fury.io/js/nest-devtools-agent.svg)](https://www.npmjs.com/package/nest-devtools-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

---

## 🎯 O que é?

O `nest-devtools-agent` é uma biblioteca de instrumentação para aplicações NestJS que captura automaticamente:

- ✅ **Requisições HTTP** — método, rota, status, headers, body, timing
- ✅ **Exceções** — stacktraces completos com contexto
- ✅ **Logs** — agregação e busca de logs da aplicação
- ✅ **Performance** — métricas de latência e throughput

Inspirado no [Laravel Telescope](https://laravel.com/docs/telescope), mas feito especificamente para NestJS.

---

## 📦 Instalação

```bash
# npm
npm install nest-devtools-agent

# yarn
yarn add nest-devtools-agent

# pnpm
pnpm add nest-devtools-agent

# bun
bun add nest-devtools-agent
```

---

## 🚀 Quick Start

### 1️⃣ Configurar no seu AppModule

```typescript
import { Module } from '@nestjs/common';
import { DevtoolsModule } from 'nest-devtools-agent';

@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: process.env.NODE_ENV !== 'production',
      backendUrl: process.env.DEVTOOLS_BACKEND_URL || 'http://localhost:4000',
      apiKey: process.env.DEVTOOLS_API_KEY,
    }),
    // ... outros módulos
  ],
})
export class AppModule {}
```

### 2️⃣ Configurar variáveis de ambiente

```env
# .env
DEVTOOLS_BACKEND_URL=http://localhost:4000
DEVTOOLS_API_KEY=seu-secret-key-aqui
NODE_ENV=development
```

### 3️⃣ Pronto! 🎉

O agent agora está capturando automaticamente:

- Todas as requisições HTTP
- Todas as exceções não tratadas
- Todos os logs da aplicação

---

## ⚙️ Opções de Configuração

```typescript
interface DevtoolsConfig {
  /** Habilitar/desabilitar agent */
  enabled: boolean;

  /** URL do backend DevTools */
  backendUrl: string;

  /** API Key para autenticação */
  apiKey?: string;

  /** Intervalo de envio de eventos (ms) */
  flushInterval?: number; // padrão: 5000

  /** Tamanho máximo do batch */
  batchSize?: number; // padrão: 50

  /** Sanitizar dados sensíveis */
  sanitize?: boolean; // padrão: true

  /** Campos a serem sanitizados */
  sanitizeFields?: string[]; // padrão: ['password', 'token', ...]

  /** Capturar request body */
  captureRequestBody?: boolean; // padrão: true

  /** Capturar response body */
  captureResponseBody?: boolean; // padrão: true

  /** Timeout de envio (ms) */
  timeout?: number; // padrão: 5000

  /** Ignorar rotas específicas */
  ignoreRoutes?: string[]; // padrão: ['/health', '/metrics']
}
```

### Exemplo Avançado

```typescript
DevtoolsModule.forRoot({
  enabled: process.env.NODE_ENV !== 'production',
  backendUrl: 'https://devtools.minha-empresa.com',
  apiKey: process.env.DEVTOOLS_API_KEY,

  // Performance
  flushInterval: 10000, // enviar a cada 10s
  batchSize: 100,

  // Segurança
  sanitize: true,
  sanitizeFields: ['password', 'token', 'secret', 'authorization', 'credit_card'],

  // Captura
  captureRequestBody: true,
  captureResponseBody: false, // não capturar response (economia)

  // Filtros
  ignoreRoutes: ['/health', '/metrics', '/favicon.ico'],
});
```

---

## 🔒 Segurança

### ⚠️ **IMPORTANTE: Nunca habilite em produção sem precauções!**

O DevTools é uma ferramenta de desenvolvimento/staging. Para usar em produção:

1. **Autenticação forte**: Configure API key segura
2. **Feature flag**: Habilite apenas em ambientes controlados
3. **Sanitização**: Sempre mantenha `sanitize: true`
4. **CORS**: Configure CORS no backend
5. **Rate limiting**: Configure rate limits no backend

### Exemplo de Configuração Segura

```typescript
DevtoolsModule.forRoot({
  // Apenas em staging
  enabled: process.env.NODE_ENV === 'staging',

  // URL segura (HTTPS)
  backendUrl: 'https://devtools-backend.com',

  // API Key forte (32+ caracteres)
  apiKey: process.env.DEVTOOLS_API_KEY, // armazenada em secrets

  // Sanitização habilitada
  sanitize: true,
  sanitizeFields: [
    'password',
    'token',
    'secret',
    'authorization',
    'credit_card',
    'ssn',
    'cpf',
    'api_key',
  ],

  // Não capturar payloads sensíveis
  captureRequestBody: false,
  captureResponseBody: false,
});
```

---

## 📊 O que é Capturado?

### Requisições HTTP

```json
{
  "type": "request",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "method": "POST",
  "path": "/api/users",
  "statusCode": 201,
  "duration": 245,
  "requestHeaders": {
    "content-type": "application/json",
    "user-agent": "Mozilla/5.0..."
  },
  "requestBody": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "responseBody": {
    "id": "123",
    "name": "John Doe"
  }
}
```

### Exceções

```json
{
  "type": "exception",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "message": "User not found",
  "stack": "Error: User not found\n    at UserService.findOne...",
  "context": {
    "method": "GET",
    "path": "/api/users/999",
    "userId": "123"
  }
}
```

### Logs

```json
{
  "type": "log",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User created successfully",
  "context": {
    "userId": "123",
    "action": "create"
  }
}
```

---

## 🛠️ API

### DevtoolsModule

#### `forRoot(config: DevtoolsConfig): DynamicModule`

Configura o módulo globalmente.

#### `forRootAsync(options: DevtoolsAsyncConfig): DynamicModule`

Configuração assíncrona (ex: usando ConfigService).

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

DevtoolsModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    enabled: config.get('DEVTOOLS_ENABLED'),
    backendUrl: config.get('DEVTOOLS_BACKEND_URL'),
    apiKey: config.get('DEVTOOLS_API_KEY'),
  }),
});
```

---

## 🧪 Testando

Durante testes, você pode desabilitar o agent:

```typescript
// test/app.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DEVTOOLS_CONFIG')
      .useValue({ enabled: false })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });
});
```

Ou via variável de ambiente:

```bash
NODE_ENV=test pnpm test
```

---

## 🔧 Troubleshooting

### ❌ Erro: "Nest can't resolve dependencies of the DevtoolsService"

**Causa**: O módulo não está sendo importado corretamente ou você esqueceu de usar `.forRoot()` ou `.forRootAsync()`.

**Solução**:

```typescript
// ❌ ERRADO - Não importe o módulo diretamente
@Module({
  imports: [DevtoolsModule], // ❌ ISSO CAUSARÁ O ERRO!
})
export class AppModule {}

// ✅ CORRETO - Use forRoot() ou forRootAsync()
@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: process.env.NODE_ENV !== 'production',
      backendUrl: process.env.DEVTOOLS_BACKEND_URL || 'http://localhost:4000',
      apiKey: process.env.DEVTOOLS_API_KEY,
    }),
  ],
})
export class AppModule {}

// ✅ CORRETO - Com ConfigService (assíncrono)
@Module({
  imports: [
    ConfigModule.forRoot(),
    DevtoolsModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        enabled: config.get('NODE_ENV') !== 'production',
        backendUrl: config.get('DEVTOOLS_BACKEND_URL'),
        apiKey: config.get('DEVTOOLS_API_KEY'),
      }),
    }),
  ],
})
export class AppModule {}
```

### Agent não está capturando eventos

1. Verifique se `enabled: true`
2. Verifique se o backend está rodando
3. Verifique a URL do backend
4. Verifique logs do console

### Eventos não aparecem no painel

1. Verifique a API key
2. Verifique CORS no backend
3. Verifique se o backend está acessível
4. Verifique logs de rede (Network tab)

### Performance degradada

1. Aumente `flushInterval` (menos envios)
2. Reduza `batchSize` (batches menores)
3. Desabilite captura de body:
   ```typescript
   captureRequestBody: false,
   captureResponseBody: false,
   ```
4. Adicione rotas à lista de ignorados:
   ```typescript
   ignoreRoutes: ['/health', '/metrics', '/static/*'];
   ```

---

## 📚 Documentação Completa

- [📦 Guia de Instalação Detalhado](./INSTALLATION.md) - Instalação passo a passo com troubleshooting
- [📖 Exemplos de Uso](./USAGE_EXAMPLE.md) - 10+ exemplos práticos de configuração
- [🔧 Troubleshooting](./README.md#-troubleshooting) - Soluções para problemas comuns
- [🔒 Guia de Segurança](./README.md#-segurança) - Boas práticas de segurança

---

## 🤝 Contribuição

Contribuições são bem-vindas! Veja [CONTRIBUTING.md](https://github.com/SEU-USUARIO/nest-devtools-agent/blob/main/CONTRIBUTING.md).

---

## 📄 Licença

MIT © 2025

---

## 🙏 Inspiração

Inspirado no [Laravel Telescope](https://laravel.com/docs/telescope) e projetos da comunidade NestJS.

---

**Feito com ❤️ para a comunidade NestJS**

[⭐ Star no GitHub](https://github.com/SEU-USUARIO/nest-devtools-agent)
