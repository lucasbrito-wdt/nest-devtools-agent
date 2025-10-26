# 🔄 CI/CD - Integração e Deploy Contínuo

> Documentação completa dos workflows GitHub Actions configurados no projeto

---

## 📋 Visão Geral

O projeto possui 5 workflows principais para automação completa:

```
┌─────────────────────────────────────────────────────┐
│  Push/PR → GitHub                                   │
└──────────────────┬──────────────────────────────────┘
                   │
     ┌─────────────┼─────────────┬──────────────┐
     │             │             │              │
     ▼             ▼             ▼              ▼
   CI Tests    Deploy Back   Deploy Front   Supabase
  (lint/test)   (Netlify)    (Railway)    (Migrations)
     │             │             │              │
     └─────────────┴─────────────┴──────────────┘
                   │
                   ▼
            ✅ Deploy Completo
```

---

## 🔍 Workflow 1: CI - Testes e Validação

**Arquivo:** `.github/workflows/ci.yml`

### Quando é executado?
- ✅ Push em branches: `main`, `develop`, `staging`
- ✅ Pull Requests para essas branches

### O que faz?

#### Job 1: Code Quality
```yaml
- Lint (ESLint)
- Type Check (TypeScript)
- Format Check (Prettier)
```

#### Job 2: Unit Tests
```yaml
- Testes dos 3 pacotes (agent, backend, frontend)
- Coverage report
- Upload para Codecov
```

#### Job 3: Build
```yaml
- Build de todos os pacotes
- Verificação de artifacts
```

### Duração Média
~5-8 minutos

### Como Testar Localmente
```bash
# Executar todos os checks
pnpm lint
pnpm typecheck
pnpm test
pnpm build

# Ou usar act
act pull_request -W .github/workflows/ci.yml
```

---

## 🌐 Workflow 2: Deploy Backend (Netlify)

**Arquivo:** `.github/workflows/deploy-backend.yml`

### Quando é executado?
- ✅ Push em `main` ou `staging`
- ✅ Mudanças em:
  - `packages/backend/**`
  - `packages/shared/**`
  - `package.json`
  - `pnpm-lock.yaml`
- ✅ Manual (workflow_dispatch)

### O que faz?

```yaml
1. Checkout do código
2. Setup pnpm + Node.js
3. Instalar dependências
4. Build shared package
5. Build backend
6. Executar testes (opcional)
7. Type check
8. Deploy para Netlify
9. Notificar resultado
```

### Secrets Necessários
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

### Variáveis de Ambiente (Netlify Dashboard)
```env
DATABASE_URL=postgresql://...
DEVTOOLS_API_KEY=...
CORS_ORIGINS=...
RETENTION_DAYS=30
RATE_LIMIT=100
```

### Duração Média
~6-10 minutos

### URL do Deploy
`https://[NETLIFY_SITE_ID].netlify.app`

---

## 🎨 Workflow 3: Deploy Frontend (Railway)

**Arquivo:** `.github/workflows/deploy-frontend.yml`

### Quando é executado?
- ✅ Push em `main` ou `staging`
- ✅ Mudanças em:
  - `packages/frontend/**`
  - `packages/shared/**`
  - `package.json`
  - `pnpm-lock.yaml`
- ✅ Manual (workflow_dispatch)

### O que faz?

```yaml
1. Checkout do código
2. Setup pnpm + Node.js
3. Instalar dependências
4. Build shared package
5. Build frontend (com env vars)
6. Type check
7. Análise de bundle
8. Deploy para Railway
9. Notificar resultado
```

### Secrets Necessários
- `RAILWAY_TOKEN`
- `RAILWAY_SERVICE_NAME`
- `VITE_API_URL`
- `VITE_WS_URL`

### Duração Média
~8-15 minutos

### URL do Deploy
`https://[seu-projeto].up.railway.app`

---

## 🗄️ Workflow 4: Deploy Supabase (Migrations)

**Arquivo:** `.github/workflows/deploy-supabase.yml`

### Quando é executado?
- ✅ Push em `main`
- ✅ Mudanças em:
  - `supabase/migrations/**`
  - `init.sql`
- ✅ Manual (workflow_dispatch)

### O que faz?

```yaml
1. Checkout do código
2. Setup Supabase CLI
3. Link ao projeto Supabase
4. Verificar status do banco (diff)
5. Aplicar migrations
6. Gerar types TypeScript
7. Commit types gerados (auto)
```

### Secrets Necessários
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`

### Duração Média
~2-4 minutos

### Tipos Gerados
`packages/shared/src/types/database.types.ts`

---

## 📦 Workflow 5: Publish Agent Package

**Arquivo:** `.github/workflows/publish-agent.yml`

### Quando é executado?
- ✅ Push em `main` (path: `packages/agent/**`)
- ✅ GitHub Release publicada
- ✅ Manual (workflow_dispatch)

### O que faz?

#### Job 1: Build & Test
```yaml
1. Build packages
2. Executar testes
3. Type check
4. Lint
5. Salvar artifacts
```

#### Job 2: Publish npm
```yaml
1. Atualizar versão (se especificada)
2. Publicar @nest-devtools/shared
3. Publicar @nest-devtools/agent
4. Comentar no PR
```

#### Job 3: GitHub Release
```yaml
1. Gerar changelog
2. Criar GitHub Release
3. Anexar artifacts
```

### Secrets Necessários
- `NPM_TOKEN`

### Parâmetros de Input (Manual)
```yaml
version: "0.1.0"  # Versão a publicar
tag: "latest"     # Tag npm (latest, beta, next, alpha)
```

### Duração Média
~5-8 minutos

### Resultado
- 📦 Pacote publicado no npm
- 🏷️ GitHub Release criado
- 📝 Changelog gerado

---

## 🔐 Branch Protection Rules (Recomendado)

### Configurar em: Settings → Branches → Add rule

**Para branch `main`:**

```yaml
✅ Require pull request reviews before merging
   - Required approvals: 1

✅ Require status checks to pass before merging
   - Require branches to be up to date
   - Status checks required:
     - Code Quality
     - Unit Tests (agent)
     - Unit Tests (backend)
     - Unit Tests (frontend)
     - Build All Packages

✅ Require conversation resolution before merging

✅ Do not allow bypassing the above settings
```

---

## 📊 Status Badges

Adicione ao README.md:

```markdown
[![CI](https://github.com/SEU-USUARIO/nest-devtools-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/SEU-USUARIO/nest-devtools-agent/actions/workflows/ci.yml)
[![Deploy Backend](https://github.com/SEU-USUARIO/nest-devtools-agent/actions/workflows/deploy-backend.yml/badge.svg)](https://github.com/SEU-USUARIO/nest-devtools-agent/actions/workflows/deploy-backend.yml)
[![Deploy Frontend](https://github.com/SEU-USUARIO/nest-devtools-agent/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/SEU-USUARIO/nest-devtools-agent/actions/workflows/deploy-frontend.yml)
[![npm version](https://badge.fury.io/js/%40nest-devtools%2Fagent.svg)](https://www.npmjs.com/package/@nest-devtools/agent)
```

---

## 🚀 Workflow de Desenvolvimento

### Feature Branch
```bash
# 1. Criar branch
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver
# ... codificar ...

# 3. Commit
git commit -m "feat: adiciona nova funcionalidade"

# 4. Push
git push origin feature/nova-funcionalidade

# 5. Abrir PR
gh pr create --title "feat: adiciona nova funcionalidade"

# ➡️ CI executa automaticamente
#    - Lint
#    - Type check
#    - Tests
#    - Build
```

### Merge para Main
```bash
# 6. Merge PR
gh pr merge --squash

# ➡️ Workflows executam:
#    - CI (novamente)
#    - Deploy Backend (se mudou backend)
#    - Deploy Frontend (se mudou frontend)
#    - Deploy Supabase (se mudou migrations)
```

### Release e Publish
```bash
# 7. Criar release (via GitHub ou CLI)
gh release create v0.1.0 --generate-notes

# ➡️ Workflow executa:
#    - Build & Test
#    - Publish npm
#    - Create GitHub Release
```

---

## 🐛 Debugging Workflows

### Ver Logs
```bash
# Listar execuções
gh run list

# Ver detalhes de uma execução
gh run view RUN_ID

# Ver logs em tempo real
gh run watch RUN_ID

# Download logs
gh run download RUN_ID
```

### Re-executar Workflow Falhado
```bash
gh run rerun RUN_ID
```

### Executar Workflow Manualmente
```bash
gh workflow run publish-agent.yml \
  -f version=0.1.0 \
  -f tag=latest
```

### Debug com act (local)
```bash
# Listar workflows
act -l

# Executar workflow
act -W .github/workflows/ci.yml

# Com secrets
act -s NETLIFY_AUTH_TOKEN=xxx -W .github/workflows/deploy-backend.yml

# Dry run
act --dryrun
```

---

## 📈 Métricas e Monitoramento

### GitHub Actions Insights
```
Repository → Insights → Actions
```

Monitore:
- ⏱️ Tempo médio de execução
- 💰 Minutos consumidos
- ✅ Taxa de sucesso
- 📊 Workflow mais usado

### Otimizações

#### Cache de Dependências
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'pnpm'  # ✅ Já configurado
```

#### Paralelização
```yaml
strategy:
  matrix:
    package: [agent, backend, frontend]
# ✅ Já configurado em ci.yml
```

#### Skip CI
```bash
git commit -m "docs: update README [skip ci]"
```

---

## 🔄 Rollback

### Backend (Netlify)
```bash
# Via CLI
netlify rollback

# Via dashboard
Site → Deploys → Deploy X → Publish deploy
```

### Frontend (Railway)
```bash
# Via dashboard
Project → Deployments → Deploy X → Redeploy
```

### Database (Supabase)
```bash
# Reverter última migration
supabase db reset --local
supabase db push
```

### npm Package
```bash
# Deprecar versão
npm deprecate @nest-devtools/agent@0.1.0 "Versão com bug, use 0.1.1"

# Despublicar (apenas primeiras 72h)
npm unpublish @nest-devtools/agent@0.1.0
```

---

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Netlify Deploy Contexts](https://docs.netlify.com/site-deploys/overview/)
- [Railway Deployments](https://docs.railway.app/deploy/deployments)
- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development)

---

**CI/CD configurado e documentado! 🎉**

