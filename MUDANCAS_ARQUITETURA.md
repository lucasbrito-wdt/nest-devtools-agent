# 🔄 Mudanças na Arquitetura - Resumo

> Resumo das alterações: **Backend** → Railway | **Frontend** → Netlify

---

## ✅ Arquivos Modificados

### 1. Workflows GitHub Actions

| Arquivo | Mudança |
|---------|---------|
| `.github/workflows/deploy-backend.yml` | ❌ Netlify → ✅ **Railway** |
| `.github/workflows/deploy-frontend.yml` | ❌ Railway → ✅ **Netlify** |

### 2. Configurações de Deploy

| Arquivo | Mudança |
|---------|---------|
| `railway.json` | Ajustado para backend (build command e start command) |
| `netlify.toml` | Ajustado para frontend (SPA + redirects + headers) |
| `packages/frontend/netlify.toml` | Criado (config específica do frontend) |

### 3. Documentação

| Arquivo | Mudança |
|---------|---------|
| `docs/deployment.md` | Arquitetura atualizada (Railway + Netlify + Supabase) |
| `docs/github-setup.md` | Instruções atualizadas para ambos serviços |

---

## 🎯 Nova Arquitetura

### Antes
```
Frontend (Railway) → Backend (Netlify) → Database (Supabase)
```

### Depois
```
Frontend (Netlify CDN) → Backend (Railway NestJS) → Database (Supabase)
```

---

## 🔑 Secrets GitHub - Atualização Necessária

### ✅ Manter (sem mudança)
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `NPM_TOKEN`
- `VITE_API_URL` (valor a atualizar)
- `VITE_WS_URL` (valor a atualizar)

### ➕ Adicionar Novos
```bash
# Para Backend (Railway)
RAILWAY_TOKEN                  # Seu token Railway
RAILWAY_BACKEND_SERVICE       # Nome do serviço backend (ex: nest-devtools-backend)
RAILWAY_BACKEND_URL          # URL do backend (ex: https://seu-backend.up.railway.app)

# Para Frontend (Netlify)
NETLIFY_AUTH_TOKEN            # Seu token Netlify
NETLIFY_SITE_ID               # ID do site Netlify
```

### 🔄 Renomear/Remover
```bash
# Remover (não mais necessários)
RAILWAY_SERVICE_NAME          # ❌ Remover (não usado mais)
RAILWAY_URL                   # ❌ Remover (não usado mais)

# Adicionar (novos)
RAILWAY_BACKEND_SERVICE       # ✅ Adicionar
RAILWAY_BACKEND_URL          # ✅ Adicionar
```

---

## 📝 Ação Necessária

### 1. Atualizar Secrets no GitHub

Execute no terminal:

```bash
# Configurar novos secrets
gh secret set RAILWAY_BACKEND_SERVICE
# Valor: nome-do-seu-servico-backend (ex: nest-devtools-backend)

gh secret set RAILWAY_BACKEND_URL
# Valor: https://seu-backend.up.railway.app

# Atualizar valores existentes
gh secret set VITE_API_URL
# Valor: https://seu-backend.up.railway.app/api

gh secret set VITE_WS_URL
# Valor: https://seu-backend.up.railway.app

# Remover secrets antigos
gh secret delete RAILWAY_SERVICE_NAME
gh secret delete RAILWAY_URL
```

### 2. Criar Projeto no Railway (Backend)

1. Acesse: https://railway.app
2. New Project → Deploy from GitHub
3. Selecione o repositório
4. Configure:
   - **Name:** `nest-devtools-backend`
   - **Root Directory:** `/`
   - **Build Command:** (automático via railway.json)
   - **Start Command:** (automático via railway.json)
5. Configure env vars:
   ```env
   PORT=4000
   NODE_ENV=production
   DATABASE_URL=postgresql://...@supabase...
   DEVTOOLS_API_KEY=sua-chave
   CORS_ORIGINS=https://seu-frontend.netlify.app
   RETENTION_DAYS=30
   RATE_LIMIT=100
   ENABLE_WEBSOCKET=true
   ```

### 3. Criar Site no Netlify (Frontend)

1. Acesse: https://app.netlify.com
2. New site → Deploy from GitHub
3. Selecione o repositório
4. Configure:
   - **Base directory:** `/`
   - **Build command:** `pnpm install && pnpm --filter @nest-devtools/shared build && pnpm --filter @nest-devtools/frontend build`
   - **Publish directory:** `packages/frontend/dist`
5. Configure env vars:
   ```env
   VITE_API_URL=https://seu-backend.up.railway.app/api
   VITE_WS_URL=https://seu-backend.up.railway.app
   ```

---

## ✅ Checklist

- [x] Workflows atualizados
- [x] railway.json ajustado
- [x] netlify.toml ajustado
- [x] Documentação atualizada
- [ ] **Secrets configurados no GitHub**
- [ ] **Projeto criado no Railway**
- [ ] **Site criado no Netlify**
- [ ] **Variáveis de ambiente configuradas**
- [ ] **Primeiro deploy testado**

---

## 🚀 Próximos Passos

1. **Commit as mudanças:**
   ```bash
   git add .
   git commit -m "refactor: move backend to Railway and frontend to Netlify"
   git push origin main
   ```

2. **Configurar secrets:**
   ```bash
   gh secret set RAILWAY_BACKEND_SERVICE
   gh secret set RAILWAY_BACKEND_URL
   gh secret set VITE_API_URL
   gh secret set VITE_WS_URL
   ```

3. **Criar projetos:**
   - Railway (backend)
   - Netlify (frontend)

4. **Monitorar primeiro deploy:**
   - GitHub → Actions

---

## 💡 Vantagens da Nova Arquitetura

### 🚂 Backend no Railway
- ✅ Melhor para NestJS/Node.js
- ✅ WebSocket nativo
- ✅ Deploy mais rápido
- ✅ Scaling automático
- ✅ Logs em tempo real

### 🌐 Frontend no Netlify
- ✅ CDN global automático
- ✅ Otimizado para SPAs/React
- ✅ HTTPS automático
- ✅ Preview deploys em PRs
- ✅ Redirects/Headers configuráveis

---

**Mudanças concluídas! Agora siga os próximos passos acima para finalizar a configuração.** 🎉

