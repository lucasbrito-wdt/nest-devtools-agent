# 🔭 Nest DevTools Telescope

> **DevTools tipo Laravel Telescope para NestJS** — rastreamento de requisições HTTP, exceções, logs, queries SQL e jobs em tempo real.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)

---

## 🎯 Objetivo

Prover visibilidade completa da sua aplicação NestJS durante desenvolvimento e staging:

- ✅ **Requisições HTTP** — método, rota, status, headers, body, timing
- ✅ **Exceções** — stacktraces completos com contexto
- ✅ **Logs** — agregação e busca de logs da aplicação
- ✅ **Queries SQL** — profiling de queries do TypeORM/Prisma (em breve)
- ✅ **Jobs/Queues** — rastreamento de filas Bull/BeeQueue (em breve)
- ✅ **Grafo de Módulos** — visualização de dependências (em breve)

---

## 🏗️ Arquitetura

**Monorepo com 4 pacotes:**

```
nest-devtools-telescope/
├── packages/
│   ├── agent/       → Biblioteca NestJS (interceptors + filters)
│   ├── backend/     → API de ingestão e consulta (NestJS + Postgres)
│   ├── frontend/    → UI React (Vite + TailwindCSS)
│   └── shared/      → Tipos TypeScript compartilhados
├── docker-compose.yml
└── docs/
```

**Fluxo de dados:**

```
App NestJS → Agent (interceptors) → Backend (ingest) → Postgres → Frontend (UI)
                                          ↓
                                    WebSocket (realtime)
```

---

## 🚀 Quick Start

### 1️⃣ Instalar dependências

```bash
pnpm install
```

### 2️⃣ Subir infraestrutura (Postgres + Redis)

```bash
pnpm docker:up
```

### 3️⃣ Rodar migrações

```bash
cd packages/backend
pnpm migration:run
```

### 4️⃣ Iniciar backend + frontend

```bash
# Terminal 1 - Backend
pnpm dev:backend

# Terminal 2 - Frontend
pnpm dev:frontend
```

### 5️⃣ Integrar na sua app NestJS

Instale o agent:

```bash
pnpm add @nest-devtools/agent
```

Configure no `AppModule`:

```typescript
import { DevtoolsModule } from '@nest-devtools/agent';

@Module({
  imports: [
    DevtoolsModule.forRoot({
      enabled: process.env.NODE_ENV !== 'production',
      backendUrl: 'http://localhost:4000',
      apiKey: process.env.DEVTOOLS_API_KEY,
    }),
  ],
})
export class AppModule {}
```

Configure `.env`:

```env
DEVTOOLS_API_KEY=changeme-secret-key
```

Acesse o painel: **http://localhost:3000**

---

## 📦 Pacotes

### `@nest-devtools/agent`

Biblioteca de instrumentação. Instala interceptors globais para capturar:
- Requisições HTTP (timing, payloads)
- Exceções não tratadas
- Logs da aplicação

### `@nest-devtools/backend`

API NestJS para:
- `POST /ingest` — recebe eventos do agent
- `GET /events` — lista com filtros e paginação
- WebSocket — updates em tempo real

### `@nest-devtools/frontend`

SPA React com:
- Lista de requisições com busca e filtros
- Detalhamento de request/response
- Visualização de exceções
- Timeline e latência

### `@nest-devtools/shared`

Tipos TypeScript compartilhados entre agent/backend/frontend.

---

## 🔒 Segurança

⚠️ **CRÍTICO: Nunca habilite em produção sem autenticação forte!**

- ✅ Feature flag `enabled: false` em produção
- ✅ Autenticação via API key
- ✅ CORS restrito
- ✅ Sanitização de payloads (redaction de PII)
- ✅ Rate limiting no endpoint de ingestão
- ✅ Política de retenção configurável

---

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Build todos os pacotes
pnpm build

# Rodar testes
pnpm test

# Lint
pnpm lint

# Formatar código
pnpm format

# Type checking
pnpm typecheck
```

---

## 📚 Documentação

Consulte a pasta `docs/` para guias detalhados:

- [Arquitetura](docs/architecture.md)
- [Segurança](docs/security.md)
- [API Reference](docs/api.md)
- [Configuração Avançada](docs/configuration.md)

---

## 🗺️ Roadmap

### ✅ MVP (v0.1)
- [x] Agent com RequestInterceptor e ExceptionFilter
- [x] Backend com ingestão e consulta
- [x] Frontend com lista de requests
- [x] Segurança básica (API key)

### 🔄 v0.2 (em progresso)
- [ ] Query tracing (TypeORM/Prisma)
- [ ] WebSocket para realtime updates
- [ ] Export CSV/JSON
- [ ] Grafo de módulos (estático)

### 📋 v0.3 (planejado)
- [ ] Jobs/Queues tracing
- [ ] Metrics & charts (latência, throughput)
- [ ] Replay de requests
- [ ] Integrações (Sentry, Grafana)

### 🚀 v1.0 (futuro)
- [ ] Multi-project support
- [ ] Team roles & permissions
- [ ] Hosted option
- [ ] Alerts & notifications

---

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📄 Licença

MIT © 2025

---

## 🙏 Agradecimentos

Inspirado pelo [Laravel Telescope](https://laravel.com/docs/telescope) e projetos da comunidade NestJS.

---

**Feito com ❤️ para a comunidade NestJS**

