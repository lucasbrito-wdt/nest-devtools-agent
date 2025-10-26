# 🏗️ Arquitetura do Nest DevTools Telescope

## Visão Geral

O Nest DevTools Telescope é construído como uma arquitetura **desacoplada** com 3 componentes principais:

```
┌──────────────┐
│   App NestJS │ ← Sua aplicação com o Agent instalado
└──────┬───────┘
       │ HTTP POST /ingest
       ↓
┌──────────────────┐
│  Backend (API)   │ ← Servidor NestJS para ingestão e consulta
│  PostgreSQL      │
│  Redis (cache)   │
└──────┬───────────┘
       │ REST API + WebSocket
       ↓
┌──────────────────┐
│  Frontend (UI)   │ ← Interface React para visualização
└──────────────────┘
```

---

## Componentes

### 1. Agent (`@nest-devtools/agent`)

**Responsabilidade:** Instrumentação da aplicação NestJS

**Tecnologias:**
- NestJS Interceptors (APP_INTERCEPTOR)
- NestJS Exception Filters (APP_FILTER)
- Axios (HTTP client)

**Arquitetura interna:**

```typescript
DevtoolsModule
  ├── DevtoolsService (singleton)
  │   ├── sendEvent()
  │   ├── sanitizeEvent()
  │   └── buffer (offline queue)
  │
  ├── RequestInterceptor (global)
  │   └── Captura: método, rota, status, headers, body, timing
  │
  └── ExceptionFilter (global)
      └── Captura: exceções, stacktraces, contexto
```

**Fluxo de captura:**

1. Request chega → `RequestInterceptor` ativa
2. Captura metadata inicial (método, URL, headers)
3. Executa handler da rota
4. Captura response e timing
5. Sanitiza dados sensíveis
6. Envia para backend via `DevtoolsService.sendEvent()`
7. Se falhar, adiciona ao buffer local (opcional)

**Segurança:**
- Sanitização de campos sensíveis (passwords, tokens)
- Truncamento de payloads grandes
- Fail-silent: nunca quebra a aplicação
- Rate limiting interno (evita flood)

---

### 2. Backend (`@nest-devtools/backend`)

**Responsabilidade:** Ingestão, persistência e consulta de eventos

**Tecnologias:**
- NestJS (framework)
- TypeORM (ORM)
- PostgreSQL (database)
- Socket.IO (WebSocket)
- Redis (cache - opcional)

**Arquitetura modular:**

```
AppModule
  ├── IngestModule
  │   ├── IngestController (POST /ingest)
  │   └── IngestService (validação + persistência)
  │
  ├── EventsModule
  │   ├── EventsController (GET /events, /events/:id, /stats)
  │   ├── EventsService (queries + estatísticas)
  │   └── Event (entity TypeORM)
  │
  ├── WebSocketModule
  │   └── DevToolsGateway (realtime updates)
  │
  └── HealthModule
      └── HealthController (GET /health)
```

**Schema do Banco de Dados:**

```sql
events
  ├── id (UUID, PK)
  ├── type (ENUM: request, exception, log, query, job)
  ├── payload (JSONB) ← Dados completos do evento
  ├── route (VARCHAR) ← Índice para busca rápida
  ├── status (INT) ← Índice para busca rápida
  └── created_at (TIMESTAMP)

Índices:
  - idx_events_type
  - idx_events_route
  - idx_events_status
  - idx_events_created_at
  - idx_events_payload_gin (JSONB search)
```

**Endpoints principais:**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/ingest` | Ingere novo evento (requer API key) |
| GET | `/api/events` | Lista eventos com filtros |
| GET | `/api/events/:id` | Busca evento específico |
| GET | `/api/events/stats/summary` | Estatísticas gerais |
| GET | `/api/health` | Health check |

**Segurança:**
- API Key authentication (`x-api-key` header)
- CORS configurável
- Rate limiting (100 req/min por IP)
- Input validation (class-validator)
- Sanitização de output

**Performance:**
- Índices otimizados
- JSONB para payload flexível
- Paginação em queries
- Cache Redis (opcional)

---

### 3. Frontend (`@nest-devtools/frontend`)

**Responsabilidade:** Interface web para visualização

**Tecnologias:**
- React 18
- Vite (bundler)
- TailwindCSS (styling)
- TanStack Query (data fetching)
- TanStack Table (tabelas)
- Tabler Icons
- Zustand (state management)
- Socket.IO Client (WebSocket)

**Estrutura de páginas:**

```
/                → Dashboard (estatísticas gerais)
/requests        → Lista de requisições HTTP
/requests/:id    → Detalhes de uma requisição
/exceptions      → Lista de exceções
/logs            → Lista de logs
```

**Features:**
- Dark mode
- Busca e filtros avançados
- Paginação
- Realtime updates (WebSocket)
- Responsive design
- Export CSV/JSON (futuro)

**State Management:**

```typescript
// Global
useThemeStore → Dark/Light mode

// Server state (TanStack Query)
useQuery(['events']) → Lista de eventos
useQuery(['stats']) → Estatísticas
```

---

## Fluxo de Dados Completo

### 1. Captura de Evento

```
[App NestJS]
  ↓ Request: GET /api/users
RequestInterceptor captura:
  - method: GET
  - url: /api/users
  - timestamp: 1234567890
  ↓ Executa handler
  ↓ Response: 200 OK, duration: 45ms
DevtoolsService.sendEvent({
  type: 'request',
  meta: { method, url, status, duration, ... }
})
  ↓ HTTP POST http://backend:4000/api/ingest
```

### 2. Ingestão no Backend

```
[Backend]
POST /api/ingest
  ↓ ApiKeyGuard valida header x-api-key
  ↓ ThrottleGuard verifica rate limit
  ↓ IngestController recebe DTO
  ↓ IngestService valida e sanitiza
  ↓ Persiste no PostgreSQL (tabela events)
  ↓ Emite evento WebSocket (new-event)
Response: { success: true, eventId: 'uuid' }
```

### 3. Visualização no Frontend

```
[Frontend]
useQuery(['events']) → GET /api/events?page=1&limit=20
  ↓ Backend retorna paginado
  ↓ TanStack Table renderiza
WebSocket.on('new-event') → Novo evento chega
  ↓ React Query invalida cache
  ↓ Tabela atualiza automaticamente
```

---

## Escalabilidade

### Horizontal Scaling

**Backend:**
- Stateless (sem sessão)
- Load balancer na frente
- PostgreSQL com replicas (read/write split)
- Redis para cache distribuído

**Frontend:**
- CDN para assets estáticos
- Nginx com cache

### Vertical Scaling

**PostgreSQL:**
- Particionamento de tabela `events` por data
- Archiving de eventos antigos (S3)
- Vacuum automático

**Performance esperada:**
- Ingestão: ~10k eventos/s (single instance)
- Query: <100ms (com índices)
- WebSocket: ~5k conexões simultâneas

---

## Monitoramento

### Logs estruturados

```typescript
// Backend
logger.log('Event ingested', {
  eventId: uuid,
  type: 'request',
  duration: 45
});
```

### Métricas (futuro)

- Prometheus + Grafana
- Métricas custom:
  - `devtools_events_ingested_total`
  - `devtools_ingest_duration_ms`
  - `devtools_query_duration_ms`

### Alertas (futuro)

- Taxa de exceções > threshold
- Latência média > threshold
- Disco > 80%

---

## Deployment

### Development

```bash
pnpm install
pnpm docker:up  # PostgreSQL + Redis
pnpm dev        # Todos os serviços
```

### Production

**Option 1: Docker Compose**

```bash
docker-compose up -d
```

**Option 2: Kubernetes (futuro)**

```yaml
# Helm chart
helm install devtools ./charts/devtools
```

**Option 3: Serverless (futuro)**

- Backend → AWS Lambda + API Gateway
- Frontend → Vercel/Netlify
- Database → RDS PostgreSQL

---

## Trade-offs e Decisões Arquiteturais

### ✅ Por que JSONB no PostgreSQL?

**Prós:**
- Flexibilidade (schema-less para payloads variados)
- Índices GIN para busca
- Suporte nativo a queries JSON

**Contras:**
- Performance menor que colunas tipadas
- Tamanho maior no disco

**Alternativa considerada:** MongoDB
- Rejeitada por falta de transações robustas

---

### ✅ Por que WebSocket em vez de Polling?

**Prós:**
- Realtime sem overhead
- Menor latência

**Contras:**
- Mais complexo
- Problemas com firewalls/proxies

**Alternativa:** Server-Sent Events (SSE)
- Considerada para futura opção

---

### ✅ Por que não usar processo separado para Agent?

**Decisão:** Agent roda in-process na aplicação

**Prós:**
- Zero configuração extra
- Sem overhead de IPC

**Contras:**
- Se crashar, leva a app junto (mitigado com fail-silent)

---

## Roadmap Técnico

### v0.2
- [ ] Query tracing (TypeORM/Prisma)
- [ ] WebSocket realtime (completo)
- [ ] Export CSV/JSON

### v0.3
- [ ] Jobs/Queues tracing
- [ ] Grafos de módulos
- [ ] Replay de requests

### v1.0
- [ ] Multi-tenancy
- [ ] RBAC
- [ ] Hosted version
- [ ] Integrações (Sentry, Grafana, Slack)

---

## Contribuindo com Arquitetura

Ao propor mudanças:

1. **Documente decisões** — Use ADRs (Architecture Decision Records)
2. **Mantenha desacoplamento** — Agent não deve depender de backend
3. **Pense em escala** — 10k eventos/s deve ser possível
4. **Segurança first** — Nunca exponha dados sensíveis

**Discussões:** GitHub Discussions

