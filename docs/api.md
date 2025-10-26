# 📡 API Reference — Nest DevTools Backend

> Documentação completa dos endpoints da API

---

## Base URL

```
http://localhost:4000/api
```

**Produção:**

```
https://devtools.myapp.com/api
```

---

## Autenticação

Todos os endpoints (exceto `/health`) requerem API Key:

```http
x-api-key: your-secret-api-key
```

---

## Endpoints

### 1. POST /ingest

Ingere um novo evento capturado pelo Agent.

**Headers:**

```
x-api-key: your-secret-api-key
Content-Type: application/json
```

**Body:**

```typescript
{
  type: EventType; // 'request' | 'exception' | 'log' | 'query' | 'job'
  meta: Record<string, any>; // Payload do evento
}
```

**Exemplo: Request Event**

```json
{
  "type": "request",
  "meta": {
    "method": "GET",
    "url": "/api/users",
    "route": "/api/users",
    "statusCode": 200,
    "duration": 45,
    "timestamp": 1706123456789,
    "headers": {
      "user-agent": "Mozilla/5.0...",
      "host": "localhost:3000"
    },
    "query": { "page": "1" },
    "body": null,
    "ip": "127.0.0.1"
  }
}
```

**Exemplo: Exception Event**

```json
{
  "type": "exception",
  "meta": {
    "name": "UnauthorizedException",
    "message": "Invalid credentials",
    "stack": "Error: Invalid credentials\n    at ...",
    "statusCode": 401,
    "method": "POST",
    "url": "/api/auth/login",
    "timestamp": 1706123456789
  }
}
```

**Response:**

```typescript
{
  success: boolean;
  eventId?: string;
  error?: string;
}
```

**Status Codes:**

- `200 OK` — Evento ingerido com sucesso
- `400 Bad Request` — Payload inválido
- `401 Unauthorized` — API Key inválida
- `429 Too Many Requests` — Rate limit excedido

---

### 2. GET /events

Lista eventos com filtros e paginação.

**Query Params:**

| Param | Tipo | Descrição |
|-------|------|-----------|
| `type` | `EventType` | Filtro por tipo |
| `route` | `string` | Filtro por rota (ILIKE) |
| `status` | `number` | Filtro por status code |
| `method` | `string` | Filtro por método HTTP |
| `fromDate` | `string` (ISO) | Data inicial |
| `toDate` | `string` (ISO) | Data final |
| `search` | `string` | Busca por texto (rota ou payload) |
| `page` | `number` | Página (default: 1) |
| `limit` | `number` | Itens por página (default: 50, max: 100) |
| `sortBy` | `string` | Campo para ordenação (default: `createdAt`) |
| `sortOrder` | `'ASC' \| 'DESC'` | Ordem (default: `DESC`) |

**Exemplo:**

```bash
GET /api/events?type=request&status=500&page=1&limit=20
```

**Response:**

```typescript
{
  data: PersistedEvent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

**Exemplo de Response:**

```json
{
  "data": [
    {
      "id": "uuid-123",
      "type": "request",
      "payload": { "method": "GET", "url": "/api/users", ... },
      "route": "/api/users",
      "status": 200,
      "createdAt": "2025-01-24T10:30:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

### 3. GET /events/:id

Busca evento específico por ID.

**Params:**

- `id` (UUID) — ID do evento

**Response:**

```typescript
PersistedEvent
```

**Exemplo:**

```bash
GET /api/events/uuid-123
```

```json
{
  "id": "uuid-123",
  "type": "request",
  "payload": {
    "method": "GET",
    "url": "/api/users",
    "statusCode": 200,
    "duration": 45
  },
  "route": "/api/users",
  "status": 200,
  "createdAt": "2025-01-24T10:30:00Z"
}
```

**Status Codes:**

- `200 OK` — Evento encontrado
- `404 Not Found` — Evento não existe

---

### 4. GET /events/stats/summary

Retorna estatísticas gerais do sistema.

**Response:**

```typescript
{
  totalEvents: number;
  totalRequests: number;
  totalExceptions: number;
  totalLogs: number;
  averageResponseTime: number; // ms
  successRate: number; // % (0-100)
  last24Hours: {
    requests: number;
    exceptions: number;
  };
}
```

**Exemplo:**

```bash
GET /api/events/stats/summary
```

```json
{
  "totalEvents": 15234,
  "totalRequests": 12000,
  "totalExceptions": 234,
  "totalLogs": 3000,
  "averageResponseTime": 125,
  "successRate": 98.5,
  "last24Hours": {
    "requests": 3456,
    "exceptions": 12
  }
}
```

---

### 5. GET /health

Health check (não requer autenticação).

**Response:**

```typescript
{
  status: 'ok';
  timestamp: string;
  uptime: number; // segundos
}
```

**Exemplo:**

```bash
GET /api/health
```

```json
{
  "status": "ok",
  "timestamp": "2025-01-24T10:30:00Z",
  "uptime": 12345.67
}
```

---

## WebSocket

### Conectar

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');
```

### Eventos

#### 1. `new-event`

Emitido quando um novo evento é ingerido.

**Payload:**

```typescript
PersistedEvent
```

**Exemplo:**

```typescript
socket.on('new-event', (event: PersistedEvent) => {
  console.log('Novo evento:', event);
});
```

#### 2. `stats-update`

Emitido quando estatísticas são atualizadas.

**Payload:**

```typescript
DevToolsStats
```

**Exemplo:**

```typescript
socket.on('stats-update', (stats: DevToolsStats) => {
  console.log('Stats:', stats);
});
```

---

## Rate Limiting

**Limite padrão:** 100 requests/minuto por IP

**Headers de resposta:**

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706123456
```

**Quando exceder:**

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
```

---

## Tipos TypeScript

Todos os tipos estão em `@nest-devtools/shared`:

```typescript
import {
  EventType,
  PersistedEvent,
  DevToolsStats,
  EventsQueryFilters,
  PaginationParams,
} from '@nest-devtools/shared';
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Payload inválido |
| 401 | API Key inválida ou ausente |
| 404 | Recurso não encontrado |
| 429 | Rate limit excedido |
| 500 | Erro interno do servidor |

---

## Exemplos Práticos

### Filtrar requisições com erro (status >= 400)

```bash
curl "http://localhost:4000/api/events?type=request&status=500" \
  -H "x-api-key: YOUR_KEY"
```

### Buscar por rota específica

```bash
curl "http://localhost:4000/api/events?route=/api/users" \
  -H "x-api-key: YOUR_KEY"
```

### Eventos das últimas 24h

```bash
FROM_DATE=$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%SZ)
TO_DATE=$(date -u +%Y-%m-%dT%H:%M:%SZ)

curl "http://localhost:4000/api/events?fromDate=$FROM_DATE&toDate=$TO_DATE" \
  -H "x-api-key: YOUR_KEY"
```

### Busca por texto

```bash
curl "http://localhost:4000/api/events?search=UnauthorizedException" \
  -H "x-api-key: YOUR_KEY"
```

---

## Postman Collection

_Em breve: link para collection do Postman_

---

## OpenAPI/Swagger (futuro)

_Planejado para v0.3: documentação interativa com Swagger_

```
GET /api/docs
```

---

**Dúvidas? Abra uma issue no GitHub!**

