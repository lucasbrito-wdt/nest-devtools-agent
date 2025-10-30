# Solução Completa - CORS e Conectividade Docker

## Problema Original

O frontend não conseguia se conectar ao backend devido a dois problemas:

1. **Erro de CORS** - Backend não estava aceitando requisições do frontend
2. **Erro de Rede** - Backend não conseguia conectar ao PostgreSQL (erro `Can't reach database server at postgres:5432`)

## Soluções Aplicadas

### 1. Configuração de CORS no Backend

**Arquivo:** `packages/backend/src/main.ts`

Atualizado para permitir todas as origens em desenvolvimento:

```typescript
// CORS
const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') || [];
const isDevelopment = nodeEnv === 'development';

app.enableCors({
  origin: isDevelopment ? true : corsOrigins.length > 0 ? corsOrigins : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'x-api-key'],
});
```

**Comportamento:**
- **Desenvolvimento:** Aceita qualquer origem (`origin: true`)
- **Produção:** Usa lista específica de `CORS_ORIGINS` da variável de ambiente

### 2. Configuração de Rede Docker

**Arquivo:** `docker-compose.yml`

Criada uma rede compartilhada para todos os serviços:

```yaml
networks:
  devtools-network:
    driver: bridge
```

Todos os serviços agora estão conectados à mesma rede:

```yaml
services:
  postgres:
    networks:
      - devtools-network
  
  redis:
    networks:
      - devtools-network
  
  backend:
    networks:
      - devtools-network
  
  frontend:
    networks:
      - devtools-network
```

### 3. Configuração da API no Frontend

**Arquivo:** `packages/frontend/src/lib/api.ts`

Atualizado para usar variável de ambiente com fallback:

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
});
```

**Variável de ambiente no docker-compose:**
```yaml
environment:
  - VITE_API_URL=http://localhost:4001/api
```

## Arquitetura de Rede

```
┌─────────────────────────────────────────────────┐
│         devtools-network (bridge)               │
│                                                  │
│  ┌──────────────┐      ┌──────────────┐        │
│  │  PostgreSQL  │      │    Redis     │        │
│  │  :5432       │      │    :6379     │        │
│  └──────────────┘      └──────────────┘        │
│         ▲                      ▲                │
│         │                      │                │
│         └──────────┬───────────┘                │
│                    │                            │
│            ┌───────▼────────┐                   │
│            │    Backend     │                   │
│            │    :4001       │◄─────────┐        │
│            └────────────────┘          │        │
│                                         │        │
│            ┌────────────────┐          │        │
│            │   Frontend     │──────────┘        │
│            │    :3000       │                   │
│            └────────────────┘                   │
│                                                  │
└─────────────────────────────────────────────────┘
         │                    │
         │                    │
    localhost:4001       localhost:3001
    (porta exposta)     (porta exposta)
```

## Testes de Validação

### 1. Health Check do Backend
```bash
curl http://localhost:4001/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T23:12:34.626Z",
  "uptime": 29.016088625
}
```

### 2. CORS Headers
```bash
curl -H "Origin: http://localhost:3001" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS -I http://localhost:4001/api/health
```

**Headers esperados:**
```
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,PATCH,OPTIONS
Access-Control-Allow-Headers: Content-Type,Authorization,X-API-Key,x-api-key
```

### 3. Status dos Containers
```bash
docker-compose ps
```

**Todos devem estar "Up" e "healthy":**
```
NAME                STATUS
devtools-backend    Up
devtools-frontend   Up
devtools-postgres   Up (healthy)
devtools-redis      Up (healthy)
```

## Acessos

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:4001/api
- **Health Check:** http://localhost:4001/api/health
- **PostgreSQL:** localhost:5433
- **Redis:** localhost:6380

## Como Usar

### Iniciar todos os serviços
```bash
docker-compose up -d
```

### Ver logs
```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend
```

### Parar serviços
```bash
docker-compose down
```

### Rebuild completo
```bash
docker-compose down
docker-compose up -d --build
```

## Variáveis de Ambiente

### Backend (`docker-compose.yml`)
```yaml
PORT: 4001
NODE_ENV: development
DATABASE_URL: postgresql://devtools:devtools@postgres:5432/nest_devtools
REDIS_URL: redis://redis:6379
DEVTOOLS_API_KEY: changeme-secret-key
CORS_ORIGINS: http://localhost:3001,http://localhost:5173,http://172.21.0.5:3000,http://localhost:3000
RETENTION_DAYS: 7
RATE_LIMIT: 100
ENABLE_WEBSOCKET: true
```

### Frontend (`docker-compose.yml`)
```yaml
VITE_API_URL: http://localhost:4001/api
HOST: 0.0.0.0
PORT: 3000
```

## Segurança em Produção

⚠️ **IMPORTANTE:** As configurações atuais são para desenvolvimento.

Para produção, você deve:

1. **Desabilitar CORS aberto:**
   - Definir `NODE_ENV=production`
   - Configurar `CORS_ORIGINS` com domínios específicos

2. **Usar HTTPS:**
   - Configurar certificados SSL/TLS
   - Atualizar URLs para `https://`

3. **Proteger variáveis sensíveis:**
   - Usar secrets manager
   - Não commitar `.env` com valores reais
   - Trocar `DEVTOOLS_API_KEY` para valor seguro

4. **Isolar redes:**
   - PostgreSQL e Redis não devem expor portas publicamente
   - Usar rede interna apenas

## Troubleshooting

### Frontend não conecta ao Backend

1. Verificar se o backend está rodando:
   ```bash
   docker-compose logs backend
   ```

2. Testar endpoint diretamente:
   ```bash
   curl http://localhost:4001/api/health
   ```

3. Verificar CORS:
   ```bash
   curl -H "Origin: http://localhost:3001" -X OPTIONS -I http://localhost:4001/api/health
   ```

### Backend não conecta ao PostgreSQL

1. Verificar se todos estão na mesma rede:
   ```bash
   docker network inspect nest-devtools-agent_devtools-network
   ```

2. Verificar se PostgreSQL está healthy:
   ```bash
   docker-compose ps postgres
   ```

3. Testar conexão do backend ao PostgreSQL:
   ```bash
   docker-compose exec backend ping postgres
   ```

### Erro de CORS persiste

1. Limpar cache do navegador
2. Verificar se `NODE_ENV=development` no backend
3. Reiniciar containers:
   ```bash
   docker-compose restart backend frontend
   ```

## Data da Solução
27 de Outubro de 2025

