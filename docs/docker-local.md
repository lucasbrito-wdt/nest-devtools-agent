# 🐳 Uso Local via Docker — Nest DevTools Telescope

> Guia completo para rodar o Nest DevTools localmente usando Docker Compose

---

## 📋 Índice

1. [Requisitos](#requisitos)
2. [Portas Configuradas](#portas-configuradas)
3. [Quick Start](#quick-start)
4. [Comandos Úteis](#comandos-úteis)
5. [Troubleshooting](#troubleshooting)
6. [Configuração Avançada](#configuração-avançada)

---

## 📦 Requisitos

- Docker instalado ([download aqui](https://www.docker.com/get-started))
- Docker Compose instalado (incluído com Docker Desktop)
- 4GB+ de RAM disponível
- Portas livres: `3001`, `4001`, `5433`, `6380`

---

## 🔌 Portas Configuradas

Para evitar conflitos com serviços já rodando na sua máquina, usamos portas alternativas:

| Serviço    | Porta Externa | Porta Interna | URL                         |
| ---------- | ------------- | ------------- | --------------------------- |
| PostgreSQL | 5433          | 5432          | postgresql://localhost:5433 |
| Redis      | 6380          | 6379          | redis://localhost:6380      |
| Backend    | 4001          | 4001          | http://localhost:4001       |
| Frontend   | 3001          | 3000          | http://localhost:3001       |

---

## 🚀 Quick Start

### 1️⃣ Clone e entre no projeto

```bash
git clone https://github.com/yourorg/nest-devtools-agent.git
cd nest-devtools-agent
```

### 2️⃣ Configure variáveis de ambiente (opcional)

```bash
cp .env.example .env
```

Edite o `.env` se quiser personalizar:

- `DEVTOOLS_API_KEY`: Altere para uma chave segura
- `RETENTION_DAYS`: Dias de retenção de dados
- `RATE_LIMIT`: Limite de requisições

### 3️⃣ Suba os serviços

```bash
# Opção 1: Usando npm/pnpm
pnpm docker:up

# Opção 2: Usando Docker Compose diretamente
docker-compose up -d
```

### 4️⃣ Aguarde os containers iniciarem (~30s)

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver status dos containers
docker-compose ps

# Testar health check do banco
curl http://localhost:4001/api/health
```

### 5️⃣ Acesse a interface

**Frontend (Dashboard):**

```
http://localhost:3001
```

**Backend (API):**

```
http://localhost:4001/api
```

**Health Check:**

```
http://localhost:4001/api/health
```

---

## 🎯 Comandos Úteis

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend

# Apenas banco
docker-compose logs -f postgres
```

### Reiniciar serviços

```bash
# Reiniciar tudo
docker-compose restart

# Reiniciar apenas o backend
docker-compose restart backend
```

### Parar serviços

```bash
# Parar e manter volumes (dados preservados)
pnpm docker:down

# Parar e remover volumes (REMOVE TODOS OS DADOS!)
docker-compose down -v
```

### Rebuild (quando mudar código)

```bash
# Rebuild forçado de todos os serviços
docker-compose up -d --build

# Rebuild apenas o backend
docker-compose up -d --build backend
```

### Acessar container via shell

```bash
# Shell no backend
docker exec -it devtools-backend sh

# Shell no banco
docker exec -it devtools-postgres psql -U devtools -d nest_devtools

# Shell no Redis
docker exec -it devtools-redis redis-cli
```

---

## 🔧 Configuração Avançada

### Modificar portas

Edite o `docker-compose.yml`:

```yaml
services:
  backend:
    ports:
      - '5000:4001' # Muda externa de 4001 para 5000
```

### Adicionar variáveis de ambiente

Crie um arquivo `.env` na raiz:

```env
DEVTOOLS_API_KEY=minha-chave-segura
RETENTION_DAYS=30
```

### Alterar limite de memória

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
```

### Usar Dockerfile específico

```bash
# Desenvolvimento
docker-compose -f docker-compose.yml up

# Produção
docker-compose -f docker-compose.prod.yml up
```

---

## 🐛 Troubleshooting

### Porta já em uso

**Erro:** `Bind for 0.0.0.0:4001 failed: port is already allocated`

**Solução:**

```bash
# Ver quem está usando a porta
netstat -ano | findstr :4001  # Windows
lsof -i :4001                  # Mac/Linux

# Parar o processo ou alterar a porta no docker-compose.yml
```

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs backend

# Verificar se dependências estão prontas
docker-compose ps

# Rebuild do zero
docker-compose down -v
docker-compose up -d --build
```

### Banco não está pronto

**Erro:** `Connection to database at 'localhost:5433' failed`

**Solução:**

```bash
# Verificar se postgres está healthy
docker-compose ps

# Aguardar mais tempo (postgres precisa inicializar)
# Use depends_on com healthcheck (já configurado)
```

### Erro de permissão

**Linux/Mac:**

```bash
sudo docker-compose up -d
```

**Windows:**

- Certifique-se que está rodando Docker Desktop como Administrador

### Limpar tudo e começar de novo

```bash
# Para TUDO
docker-compose down -v

# Remove imagens antigas
docker rmi $(docker images -q nest-devtools*)

# Remove volumes órfãos
docker volume prune

# Inicia novamente
docker-compose up -d
```

---

## 🔐 Segurança

⚠️ **IMPORTANTE:** Estas configurações são para desenvolvimento!

**Para produção:**

1. Altere `DEVTOOLS_API_KEY` no `.env`
2. Configure `CORS_ORIGINS` corretamente
3. Use HTTPS
4. Configure Rate Limiting
5. Habilite autenticação no frontend
6. Use secrets management (ex: Docker Secrets, Kubernetes Secrets)

---

## 📊 Monitoramento

### Ver uso de recursos

```bash
docker stats
```

### Ver logs estruturados

```bash
docker-compose logs backend | grep ERROR
```

### Verificar conectividade

```bash
# Backend → PostgreSQL
docker exec -it devtools-backend ping postgres

# Backend → Redis
docker exec -it devtools-backend ping redis
```

---

## 🎓 Próximos Passos

Agora que o DevTools está rodando via Docker:

1. [Integre na sua app NestJS](../GETTING_STARTED.md)
2. [Configure o agent](../npm-publicacao-setup.md)
3. [Acesse o dashboard](http://localhost:3001)

---

**Feito com ❤️ para a comunidade NestJS**
