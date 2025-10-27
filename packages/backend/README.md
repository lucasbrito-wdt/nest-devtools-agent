# @nest-devtools/backend

> 🚀 API backend do DevTools Telescope - ingestão e consulta de eventos

## Funcionalidades

- ✅ **Ingestão de eventos** — `POST /api/ingest` com autenticação por API key
- ✅ **Consulta de eventos** — `GET /api/events` com filtros avançados
- ✅ **Estatísticas** — `GET /api/events/stats/summary`
- ✅ **WebSocket** — updates em tempo real
- ✅ **Health check** — `GET /api/health`
- ✅ **Rate limiting** — 100 requests/minuto (configurável)
- ✅ **Política de retenção** — cleanup automático de eventos antigos

## Setup

### 1. Instalar dependências

```bash
pnpm install
```

### 2. Configurar ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite `.env.local`:

```env
# Configurações básicas
DATABASE_URL=postgresql://user:pass@localhost:5432/nest_devtools
DEVTOOLS_API_KEY=your-secret-key
NODE_ENV=development
PORT=4001

# DevTools Agent (auto-monitoramento opcional)
DEVTOOLS_BACKEND_URL=http://localhost:4001
DEVTOOLS_TIMEOUT=5000
DEVTOOLS_MAX_RETRIES=3
DEVTOOLS_ENABLE_BUFFER=false
```

**Nota:** O backend agora pode auto-monitorar suas próprias requisições usando o `nest-devtools-agent`. As variáveis `DEVTOOLS_*` são opcionais e apenas necessárias se você quiser que o próprio backend envie seus eventos para análise.

### 3. Subir banco de dados

Use Docker Compose (na raiz do projeto):

```bash
docker-compose up -d postgres
```

### 4. Rodar migrações

```bash
pnpm migration:run
```

### 5. Iniciar servidor

```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start:prod
```

Servidor rodando em: **http://localhost:4000**

## Endpoints

### POST /api/ingest

Ingere um novo evento.

**Headers:**

```
x-api-key: your-secret-key
Content-Type: application/json
```

**Body:**

```json
{
  "type": "request",
  "meta": {
    "method": "GET",
    "url": "/api/users",
    "statusCode": 200,
    "duration": 45,
    "timestamp": 1234567890
  }
}
```

**Response:**

```json
{
  "success": true,
  "eventId": "uuid-here"
}
```

### GET /api/events

Lista eventos com filtros.

**Query params:**

- `type` — `request`, `exception`, `log`, `query`, `job`
- `route` — filtro por rota
- `status` — status code
- `method` — HTTP method
- `fromDate` — data inicial (ISO)
- `toDate` — data final (ISO)
- `search` — busca por texto
- `page` — página (default: 1)
- `limit` — itens por página (default: 50, max: 100)
- `sortBy` — campo para ordenação (default: `createdAt`)
- `sortOrder` — `ASC` ou `DESC` (default: `DESC`)

**Exemplo:**

```
GET /api/events?type=request&status=500&page=1&limit=20
```

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### GET /api/events/:id

Busca evento específico por ID.

### GET /api/events/stats/summary

Retorna estatísticas gerais.

**Response:**

```json
{
  "totalEvents": 1500,
  "totalRequests": 1200,
  "totalExceptions": 50,
  "totalLogs": 250,
  "averageResponseTime": 120,
  "successRate": 95.5,
  "last24Hours": {
    "requests": 300,
    "exceptions": 5
  }
}
```

### GET /api/health

Health check.

## WebSocket

Conecte no WebSocket para receber updates em tempo real:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

socket.on('new-event', (event) => {
  console.log('Novo evento:', event);
});

socket.on('stats-update', (stats) => {
  console.log('Stats atualizadas:', stats);
});
```

## Segurança

### API Key

Todos os endpoints de ingestão exigem header `x-api-key`. Configure em `.env`:

```env
DEVTOOLS_API_KEY=your-very-secret-key-here
```

### CORS

Configure origens permitidas:

```env
CORS_ORIGINS=http://localhost:3000,https://devtools.myapp.com
```

### Rate Limiting

Limite de requests por minuto (default: 100):

```env
RATE_LIMIT=100
```

## Database

### Migrações

Gerar migração:

```bash
pnpm migration:generate src/migrations/MigrationName
```

Rodar migrações:

```bash
pnpm migration:run
```

Reverter última migração:

```bash
pnpm migration:revert
```

### Schema

Tabela principal:

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  route VARCHAR(255),
  status INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_route ON events(route);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_at ON events(created_at);
```

## Cleanup de Eventos Antigos

Configure política de retenção:

```env
RETENTION_DAYS=7
```

O cleanup pode ser executado manualmente ou via cron job.

## Troubleshooting

### Porta já em uso

Altere a porta em `.env`:

```env
PORT=4001
```

### Erro de conexão com banco

Verifique se Postgres está rodando e as credenciais estão corretas:

```bash
docker-compose ps
```

### WebSocket não conecta

Verifique CORS e firewall.

## Licença

MIT
