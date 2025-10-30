# 🔧 Atualização de Configuração do DevtoolsService

## 📋 Resumo

O `DevtoolsService` foi atualizado para incluir suporte completo a todas as novas configurações disponíveis na interface `DevToolsAgentConfig`, incluindo métodos auxiliares para facilitar o acesso e verificação das configurações.

## ✨ Novas Funcionalidades

### 1. Logs de Configuração Expandidos

O construtor do `DevtoolsService` agora exibe logs detalhados de **todas** as configurações disponíveis:

```typescript
🔧 DevtoolsService inicializado
  ├─ Enabled: true
  ├─ Backend URL: http://localhost:4000
  ├─ Environment: development
  ├─ Timeout: 5000ms
  ├─ Max Retries: 3
  ├─ Max Body Size: 10240 bytes
  ├─ Buffer Enabled: false
  ├─ Max Buffer Size: 100
  ├─ Capture Headers: true
  ├─ Capture Body: true
  ├─ Capture Response: false
  ├─ Capture Response Headers: false
  ├─ Capture Session: false
  ├─ Capture Schedule: false
  ├─ Capture HTTP Client: false
  ├─ Capture Redis: false
  └─ Sensitive Fields: 9 fields
```

### 2. Novos Métodos Auxiliares

O `DevtoolsService` agora oferece métodos auxiliares para facilitar a verificação de configurações:

#### Verificação de Captura

```typescript
// Verifica se a captura de headers está habilitada
shouldCaptureHeaders(): boolean

// Verifica se a captura de body está habilitada
shouldCaptureBody(): boolean

// Verifica se a captura de response está habilitada
shouldCaptureResponse(): boolean

// Verifica se a captura de response headers está habilitada
shouldCaptureResponseHeaders(): boolean

// Verifica se a captura de sessão está habilitada
shouldCaptureSession(): boolean

// Verifica se a captura de schedule está habilitada
shouldCaptureSchedule(): boolean

// Verifica se a captura de HTTP Client está habilitada
shouldCaptureHttpClient(): boolean

// Verifica se a captura de Redis está habilitada
shouldCaptureRedis(): boolean
```

#### Obtenção de Valores de Configuração

```typescript
// Retorna o tamanho máximo do body a ser capturado (padrão: 10KB)
getMaxBodySize(): number

// Retorna a lista de campos sensíveis
getSensitiveFields(): string[]

// Retorna o ambiente configurado (padrão: 'development')
getEnvironment(): string

// Retorna a configuração do Redis (se disponível)
getRedisConfig(): RedisConfig | undefined
```

### 3. Configuração Desabilitada Completa

O método `getDisabledConfig()` agora retorna uma configuração completa com todas as propriedades:

```typescript
{
  enabled: false,
  backendUrl: '',
  apiKey: '',
  maxBodySize: 0,
  timeout: 0,
  maxRetries: 0,
  enableBuffer: false,
  maxBufferSize: 0,
  sensitiveFields: [],
  captureHeaders: false,
  captureBody: false,
  captureResponse: false,
  captureResponseHeaders: false,
  captureSession: false,
  captureSchedule: false,
  captureHttpClient: false,
  captureRedis: false,
  environment: 'disabled',
}
```

## 🔄 Componentes Atualizados

Todos os componentes que dependem do `DevtoolsService` foram atualizados para usar os novos métodos auxiliares:

### 1. DevtoolsRequestInterceptor

**Antes:**

```typescript
const config = this.devtoolsService.getConfig();
if (config?.captureHeaders !== false) {
  meta.headers = request.headers;
}
```

**Depois:**

```typescript
if (this.devtoolsService.shouldCaptureHeaders()) {
  meta.headers = request.headers;
}
```

### 2. ScheduleTracer

**Antes:**

```typescript
const config = this.devtoolsService.getConfig();
if (!config?.captureSchedule) return;
```

**Depois:**

```typescript
if (!this.devtoolsService.shouldCaptureSchedule()) return;
```

### 3. HttpClientTracer

**Antes:**

```typescript
const config = this.devtoolsService.getConfig();
const maxBodySize = config.maxBodySize || 10240;
```

**Depois:**

```typescript
const maxBodySize = this.devtoolsService.getMaxBodySize();
```

### 4. RedisTracer

**Antes:**

```typescript
const config = this.devtoolsService.getConfig();
environment: config.environment,
database: config.redisConfig?.db,
```

**Depois:**

```typescript
environment: this.devtoolsService.getEnvironment(),
database: this.devtoolsService.getRedisConfig()?.db,
```

### 5. SessionSubscriber

**Antes:**

```typescript
const config = this.devtoolsService.getConfig();
if (!config?.captureSession) return;
```

**Depois:**

```typescript
if (!this.devtoolsService.shouldCaptureSession()) return;
```

## 📦 Configurações Suportadas

Todas as configurações da interface `DevToolsAgentConfig` estão agora totalmente integradas:

### Configurações Básicas

- ✅ `enabled` - Habilita/desabilita o DevTools
- ✅ `backendUrl` - URL do backend DevTools
- ✅ `apiKey` - API Key para autenticação
- ✅ `environment` - Ambiente (dev, staging, production)

### Configurações de Performance

- ✅ `maxBodySize` - Tamanho máximo do body (padrão: 10KB)
- ✅ `timeout` - Timeout para envio de eventos (padrão: 5000ms)
- ✅ `maxRetries` - Número máximo de tentativas (padrão: 3)

### Configurações de Buffer

- ✅ `enableBuffer` - Habilita buffer de eventos
- ✅ `maxBufferSize` - Tamanho máximo do buffer (padrão: 100)

### Configurações de Captura

- ✅ `captureHeaders` - Captura headers da requisição (padrão: true)
- ✅ `captureBody` - Captura body da requisição (padrão: true)
- ✅ `captureResponse` - Captura response (padrão: false)
- ✅ `captureResponseHeaders` - Captura response headers (padrão: false)
- ✅ `captureSession` - Captura dados de sessão (padrão: false)
- ✅ `captureSchedule` - Captura eventos de schedule/cron (padrão: false)
- ✅ `captureHttpClient` - Captura requisições HTTP de saída (padrão: false)
- ✅ `captureRedis` - Captura operações Redis (padrão: false)

### Configurações de Segurança

- ✅ `sensitiveFields` - Campos sensíveis para redação

### Configurações Específicas

- ✅ `redisConfig` - Configuração de conexão Redis

## 🎯 Benefícios

1. **Código Mais Limpo**: Uso de métodos auxiliares torna o código mais legível
2. **Menos Repetição**: Lógica de verificação centralizada no `DevtoolsService`
3. **Melhor Manutenibilidade**: Alterações na lógica de configuração em um único lugar
4. **Type Safety**: TypeScript garante que todos os métodos estão corretos
5. **Logs Detalhados**: Facilita debugging e troubleshooting
6. **Consistência**: Todos os componentes usam a mesma interface

## 📝 Exemplo de Uso

```typescript
import { Injectable } from '@nestjs/common';
import { DevtoolsService } from 'nest-devtools-agent';

@Injectable()
export class MyService {
  constructor(private readonly devtools: DevtoolsService) {}

  async myMethod() {
    // Verifica se deve capturar
    if (this.devtools.shouldCaptureHttpClient()) {
      // Captura evento
      await this.devtools.sendEvent({
        type: 'http_client',
        meta: {
          timestamp: Date.now(),
          method: 'GET',
          url: 'https://api.example.com',
          environment: this.devtools.getEnvironment(),
        },
      });
    }
  }
}
```

## 🔍 Verificação

Para verificar se as configurações estão corretas, basta iniciar a aplicação e observar os logs:

```bash
npm run start:dev
```

Você verá os logs detalhados do `DevtoolsService` mostrando todas as configurações ativas.

## ✅ Testes

Todos os arquivos foram compilados com sucesso sem erros de TypeScript ou linter:

```bash
✓ devtools.service.ts
✓ request.interceptor.ts
✓ schedule.tracer.ts
✓ http-client.tracer.ts
✓ redis.tracer.ts
✓ session.subscriber.ts
```

## 📚 Documentação Relacionada

- [README.md](./README.md) - Documentação principal
- [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) - Exemplos de uso
- [INSTALLATION.md](./INSTALLATION.md) - Guia de instalação

---

**Data da Atualização**: 27 de outubro de 2025  
**Versão**: 0.2.8
