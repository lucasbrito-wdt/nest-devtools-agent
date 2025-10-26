# 🔄 GitHub Actions Workflows

Pipelines de CI/CD para o monorepo Nest DevTools.

## 📋 Workflows Disponíveis

### 1. 🚀 Deploy Backend (`deploy-backend.yml`)

**Trigger:**
- Push para `main`, `master` ou `staging`
- Mudanças em:
  - `packages/backend/**`
  - `packages/shared/**`
  - `Dockerfile`
  - `railway.toml`

**Ações:**
- ✅ Build do shared package
- ✅ Build do backend
- ✅ Testes (se disponíveis)
- ✅ Type check
- ✅ Railway deploy automático via GitHub integration

### 2. 🎨 Deploy Frontend (`deploy-frontend.yml`)

**Trigger:**
- Push para `main`, `master` ou `staging`
- Mudanças em:
  - `packages/frontend/**`
  - `packages/shared/**`

**Ações:**
- ✅ Build do shared package
- ✅ Build do frontend
- ✅ Type check
- ✅ Deploy para Netlify

### 3. 🔍 CI - Testes e Linting (`ci.yml`)

**Trigger:**
- Pull requests para `main`, `master` ou `develop`
- Push para `develop`

**Jobs:**
- **Linting**: ESLint + Prettier
- **Type Check**: TypeScript em todos os pacotes
- **Testes Backend**: Jest com PostgreSQL
- **Build Check**: Verifica se todos os pacotes buildam

### 4. 📦 Release (`release.yml`)

**Trigger:**
- Push de tags (`v*`)
- Dispatch manual

**Ações:**
- ✅ Cria GitHub Release
- ✅ Publica pacotes no NPM
- ✅ Gera changelog automático

---

## 🔐 Secrets Necessários

Configure em: **Settings** → **Secrets and variables** → **Actions**

### Railway (Backend):
```
RAILWAY_TOKEN=<seu-token-railway>
```

### Netlify (Frontend):
```
NETLIFY_AUTH_TOKEN=<seu-token-netlify>
NETLIFY_SITE_ID=<seu-site-id>
```

### Variáveis de Build:
```
VITE_API_URL=https://seu-backend.railway.app
VITE_WS_URL=wss://seu-backend.railway.app
```

### NPM (Release):
```
NPM_TOKEN=<seu-token-npm>
```

---

## 📊 Status Badges

Adicione ao README principal:

```markdown
![Deploy Backend](https://github.com/lucasbrito-wdt/nest-devtools-agent/actions/workflows/deploy-backend.yml/badge.svg)
![Deploy Frontend](https://github.com/lucasbrito-wdt/nest-devtools-agent/actions/workflows/deploy-frontend.yml/badge.svg)
![CI](https://github.com/lucasbrito-wdt/nest-devtools-agent/actions/workflows/ci.yml/badge.svg)
```

---

## 🎯 Como Funciona

### Deploy Automático:

1. Faça mudanças no código
2. Commit e push para `main`/`master`
3. GitHub Actions roda automaticamente:
   - Se mudou `packages/backend/**` → Deploy Backend
   - Se mudou `packages/frontend/**` → Deploy Frontend
4. Deploy completo em ~5min

### CI em Pull Requests:

1. Crie um PR
2. GitHub Actions roda automaticamente:
   - Linting
   - Type Check
   - Testes
   - Build Check
3. Merge apenas se todos os checks passarem ✅

---

## 🔧 Manutenção

### Atualizar versão do Bun:

Edite o `env.BUN_VERSION` nos workflows:

```yaml
env:
  BUN_VERSION: '1.1.0'  # Nova versão
```

### Adicionar novo workflow:

1. Crie `.github/workflows/nome.yml`
2. Defina trigger e jobs
3. Commit e push

---

## 🐛 Troubleshooting

### Workflow não roda:

- ✅ Verifique se o branch está correto
- ✅ Verifique os paths no trigger
- ✅ Verifique permissões do GitHub Actions

### Deploy falha:

- ✅ Verifique secrets no GitHub
- ✅ Verifique logs do workflow
- ✅ Teste o build localmente: `bun run build`

### Testes falham:

- ✅ Verifique se o PostgreSQL está rodando
- ✅ Verifique variáveis de ambiente
- ✅ Teste localmente: `bun test`

---

## 📚 Docs Úteis

- [GitHub Actions](https://docs.github.com/actions)
- [Bun CI](https://bun.sh/docs/test/ci)
- [Railway Deploy](https://docs.railway.app/deploy/github-actions)
- [Netlify Deploy](https://docs.netlify.com/site-deploys/create-deploys/)

