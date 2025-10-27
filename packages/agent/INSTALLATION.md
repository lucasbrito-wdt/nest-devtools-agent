# 📦 Guia de Instalação - nest-devtools-agent

Este guia mostra **passo a passo** como instalar e configurar o `nest-devtools-agent` em sua aplicação NestJS.

---

## ✅ Pré-requisitos

- Node.js 18+ ou Bun
- Aplicação NestJS 10+
- Backend DevTools rodando (opcional para desenvolvimento)

---

## 🚀 Instalação Básica

### 1️⃣ Instalar o pacote

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

### 2️⃣ Importar no AppModule

**⚠️ IMPORTANTE**: Use `.forRoot()` ou `.forRootAsync()` - NÃO importe o módulo diretamente!

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { DevtoolsModule } from 'nest-devtools-agent';

@Module({
  imports: [
    // ✅ CORRETO - Use forRoot()
    DevtoolsModule.forRoot({
      enabled: process.env.NODE_ENV !== 'production',
      backendUrl: process.env.DEVTOOLS_BACKEND_URL || 'http://localhost:4000',
      apiKey: process.env.DEVTOOLS_API_KEY || 'dev-key',
    }),

    // ... outros módulos
  ],
})
export class AppModule {}
```

### 3️⃣ Configurar variáveis de ambiente

```env
# .env
NODE_ENV=development
DEVTOOLS_BACKEND_URL=http://localhost:4000
DEVTOOLS_API_KEY=sua-chave-secreta
```

### 4️⃣ Iniciar a aplicação

```bash
npm run start:dev
```

✅ Pronto! O agent agora está capturando eventos automaticamente.

---

## 🔧 Instalação com ConfigService (Recomendado)

Para aplicações que usam `@nestjs/config`:

### 1️⃣ Instalar dependências

```bash
pnpm add @nestjs/config
```

### 2️⃣ Configurar no AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DevtoolsModule } from 'nest-devtools-agent';

@Module({
  imports: [
    // Configurar módulo de config primeiro
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ✅ CORRETO - Use forRootAsync com ConfigService
    DevtoolsModule.forRootAsync({
      imports: [ConfigModule], // Importar ConfigModule
      inject: [ConfigService], // Injetar ConfigService
      useFactory: (config: ConfigService) => ({
        enabled: config.get('NODE_ENV') !== 'production',
        backendUrl: config.get('DEVTOOLS_BACKEND_URL', 'http://localhost:4000'),
        apiKey: config.get('DEVTOOLS_API_KEY', 'dev-key'),

        // Configurações opcionais
        timeout: config.get('DEVTOOLS_TIMEOUT', 5000),
        maxRetries: config.get('DEVTOOLS_MAX_RETRIES', 3),
        enableBuffer: config.get('DEVTOOLS_ENABLE_BUFFER', false),
      }),
    }),

    // ... outros módulos
  ],
})
export class AppModule {}
```

---

## ❌ Erros Comuns

### Erro: "Nest can't resolve dependencies of the DevtoolsService"

**Causa**: Você importou o módulo incorretamente.

```typescript
// ❌ ERRADO - Isso causará erro!
@Module({
  imports: [DevtoolsModule], // Falta .forRoot()
})
export class AppModule {}

// ✅ CORRETO
@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: true,
      backendUrl: 'http://localhost:4000',
      apiKey: 'dev-key',
    }),
  ],
})
export class AppModule {}
```

### Erro: "backendUrl is required when DevTools is enabled"

**Causa**: Você habilitou o DevTools mas não forneceu a URL do backend.

```typescript
// ❌ ERRADO
DevtoolsModule.forRoot({
  enabled: true,
  // backendUrl está faltando!
  apiKey: 'dev-key',
});

// ✅ CORRETO
DevtoolsModule.forRoot({
  enabled: true,
  backendUrl: 'http://localhost:4000', // ✅
  apiKey: 'dev-key',
});
```

### Agent não está capturando eventos

**Causas possíveis**:

1. `enabled: false` - Verifique se o DevTools está habilitado
2. Backend não está rodando - Inicie o backend DevTools
3. URL incorreta - Verifique se `backendUrl` está correto
4. Firewall/CORS - Verifique configurações de rede

**Solução**:

```typescript
DevtoolsModule.forRoot({
  enabled: true, // ✅ Certifique-se que está true
  backendUrl: 'http://localhost:4000', // ✅ URL correta
  apiKey: 'dev-key',
});
```

---

## 🔒 Configuração para Produção

**⚠️ NUNCA habilite em produção sem precauções!**

```typescript
DevtoolsModule.forRoot({
  // Habilitar apenas em ambientes específicos
  enabled: ['development', 'staging'].includes(process.env.NODE_ENV),

  // URL segura (HTTPS)
  backendUrl: process.env.DEVTOOLS_BACKEND_URL,

  // API Key forte (armazenada em secrets)
  apiKey: process.env.DEVTOOLS_API_KEY,

  // Sanitização sempre habilitada
  sensitiveFields: ['password', 'token', 'secret', 'authorization', 'credit_card', 'ssn', 'cpf'],

  // Limitar captura para economia
  captureBody: false,
  captureResponse: false,
});
```

---

## 📊 Verificar Instalação

Após instalar, você deve ver logs no console:

```
[Nest] 12345  - 01/15/2025, 10:00:00 AM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 01/15/2025, 10:00:00 AM   DEBUG [DevtoolsService] DevTools Agent initialized
```

Se você fizer uma requisição HTTP, deverá ver eventos sendo enviados:

```
[Nest] 12345  - 01/15/2025, 10:00:05 AM   DEBUG [DevtoolsService] Event sent: request
```

---

## 🔍 Teste de Integração

Para testar se está funcionando:

### 1️⃣ Fazer uma requisição

```bash
curl http://localhost:3000/api/users
```

### 2️⃣ Verificar logs

```
[Nest] 12345  - 01/15/2025, 10:00:05 AM   DEBUG [DevtoolsService] Event sent: request
```

### 3️⃣ Verificar no painel DevTools

Abra o painel DevTools e verifique se a requisição aparece lá.

---

## 📚 Próximos Passos

- [Configuração Avançada](./README.md#️-opções-de-configuração)
- [Segurança](./README.md#-segurança)
- [API Reference](./README.md#️-api)
- [Troubleshooting Completo](./README.md#-troubleshooting)

---

## 🆘 Precisa de Ajuda?

- [Abrir uma issue](https://github.com/lucasbrito-wdt/nest-devtools-agent/issues)
- [Ver exemplos](../examples/)
- [Documentação completa](./README.md)

---

**Feito com ❤️ para a comunidade NestJS**
