# 🚀 Deployment Guide — Production

> Deploy completo para Railway (Backend), Netlify (Frontend) e Supabase (Database)

---

## Arquitetura de Deploy

```
Frontend (Netlify CDN) ← Users
         ↓
Backend (Railway NestJS) ← API
         ↓
Database (Supabase) ← PostgreSQL + Auth
```

---

## 1️⃣ Database: Supabase

### Setup

1. Crie conta em https://supabase.com
2. Crie novo projeto
3. Anote: `Database URL` e `anon key`

### Migrations

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link projeto
supabase link --project-ref your-project-ref

# Rodar migrations
supabase db push
```

### Connection String

```
postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
```

---

## 2️⃣ Backend: Railway

### Setup

```bash
# 1. Criar conta em https://railway.app
# 2. New Project → Deploy from GitHub
# 3. Selecione o repositório
# 4. Configure build settings

# OU via CLI
npm install -g @railway/cli
railway login
railway init
railway up
```

### Environment Variables (Railway Dashboard)

```
PORT=4000
NODE_ENV=production
DATABASE_URL=postgresql://...@supabase...
DEVTOOLS_API_KEY=your-secret-key
CORS_ORIGINS=https://your-frontend.netlify.app
RETENTION_DAYS=30
RATE_LIMIT=100
ENABLE_WEBSOCKET=true
```

### railway.json

Já configurado na raiz do projeto.

---

## 3️⃣ Frontend: Netlify

### Setup

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Criar site
netlify sites:create

# Deploy
netlify deploy --prod
```

**Configuração via Dashboard:**
1. New site → Deploy from GitHub
2. Selecione o repositório
3. Configure build:
   - Base directory: `/`
   - Build command: `pnpm install && pnpm build`
   - Publish directory: `packages/frontend/dist`

### Environment Variables (Netlify UI)

```
VITE_API_URL=https://your-backend.up.railway.app/api
VITE_WS_URL=https://your-backend.up.railway.app
```

### netlify.toml

Já configurado na raiz do projeto.

---

## 4️⃣ Agent Configuration (Production)

```typescript
// Sua app
DevtoolsModule.forRoot({
  enabled: process.env.NODE_ENV === 'staging', // staging only
  backendUrl: 'https://your-backend.up.railway.app',
  apiKey: process.env.DEVTOOLS_API_KEY!,
})
```

---

## 🔒 Segurança em Produção

### Checklist

- [ ] HTTPS habilitado (todos os serviços)
- [ ] API Keys fortes (32+ caracteres)
- [ ] CORS configurado (sem `*`)
- [ ] OAuth/SSO habilitado
- [ ] RLS no Supabase ativo
- [ ] Rate limiting configurado
- [ ] Logs de auditoria ativos
- [ ] Backup automático do banco
- [ ] Monitoramento (Sentry, Grafana)

---

## 📊 Monitoramento

### Supabase

- Dashboard → Logs
- Query performance
- Connection pooling

### Netlify

- Functions → Analytics
- Error logs
- Build logs

### Netlify

- Analytics tab
- Build logs
- Request logs

### Railway

- Metrics tab
- CPU/Memory usage
- Request logs

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - run: netlify deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: cd packages/frontend && pnpm build
      # Railway auto-deploys on push
```

---

## 💰 Custos Estimados

### Free Tier (Desenvolvimento)

- Supabase: Free (500MB DB)
- Netlify: Free (100GB bandwidth)
- Railway: $5/month (trial credit)

**Total: ~$5/mês**

### Production (Scale)

- Supabase Pro: $25/mês (8GB DB)
- Netlify Pro: $19/mês (400GB bandwidth)
- Railway: $20/mês (8GB RAM)

**Total: ~$64/mês**

---

## 🐛 Troubleshooting

### Backend não conecta

```bash
# Teste conexão
psql $DATABASE_URL

# Verifica SSL
# Adicione ?sslmode=require na connection string
```

### Frontend não carrega

- Verifique CORS no backend
- Confirme VITE_API_URL está correto
- Cheque build logs no Railway

### Queries lentas

- Analise no Supabase Dashboard
- Adicione índices necessários
- Ajuste connection pool

---

**Deploy completo! 🎉**

