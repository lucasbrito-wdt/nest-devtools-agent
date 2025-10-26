# 🔐 Configuração GitHub - Secrets e CI/CD

> Guia completo para configurar GitHub Actions, secrets e deploy automático

---

## 📋 Índice

1. [Secrets Necessários](#secrets-necessários)
2. [Configuração do Netlify](#configuração-do-netlify)
3. [Configuração do Railway](#configuração-do-railway)
4. [Configuração do Supabase](#configuração-do-supabase)
5. [Configuração do npm](#configuração-do-npm)
6. [Testando os Workflows](#testando-os-workflows)
7. [Troubleshooting](#troubleshooting)

---

## 🔑 Secrets Necessários

Acesse seu repositório no GitHub:
```
Settings → Secrets and variables → Actions → New repository secret
```

### Lista Completa de Secrets

| Secret | Descrição | Onde Obter |
|--------|-----------|------------|
| `NETLIFY_AUTH_TOKEN` | Token de autenticação Netlify | [netlify.app/user/applications](https://app.netlify.com/user/applications) |
| `NETLIFY_SITE_ID` | ID do site no Netlify | Dashboard do site → Site settings → General |
| `RAILWAY_TOKEN` | Token de API do Railway | [railway.app/account/tokens](https://railway.app/account/tokens) |
| `RAILWAY_SERVICE_NAME` | Nome do serviço no Railway | Dashboard do projeto |
| `RAILWAY_URL` | URL do frontend no Railway | Disponível após primeiro deploy |
| `SUPABASE_ACCESS_TOKEN` | Token de acesso Supabase | [app.supabase.com/account/tokens](https://app.supabase.com/account/tokens) |
| `SUPABASE_PROJECT_REF` | Referência do projeto Supabase | Dashboard → Settings → General |
| `NPM_TOKEN` | Token de autenticação npm | [npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens) |
| `VITE_API_URL` | URL da API do backend | `https://seu-site.netlify.app/api` |
| `VITE_WS_URL` | URL do WebSocket | `https://seu-site.netlify.app` |

---

## 🌐 Configuração do Netlify

### 1️⃣ Criar Token de Autenticação (Netlify)

**Para Frontend no Netlify:**
1. Acesse: https://app.netlify.com/user/applications
2. Clique em **New access token**
3. Nome: `GitHub Actions - Frontend Deploy`
4. Copie o token gerado

### 2️⃣ Criar Token Railway (Backend)

**Para Backend no Railway:**
1. Acesse: https://railway.app/account/tokens
2. Clique em **Create Token**
3. Nome: `GitHub Actions - Backend Deploy`
4. Copie o token gerado

### 2️⃣ Obter Site ID

**Opção A: Via CLI**
```bash
netlify sites:list
# Copie o "Site ID" do seu projeto
```

**Opção B: Via Dashboard**
1. Acesse seu site no Netlify
2. Settings → General → Site details
3. Copie o **Site ID**

### 3️⃣ Adicionar Secrets no GitHub

```
NETLIFY_AUTH_TOKEN=seu-token-aqui
NETLIFY_SITE_ID=seu-site-id-aqui
```

### 4️⃣ Configurar Variáveis de Ambiente no Netlify

No dashboard do Netlify:
```
Site settings → Environment variables → Add variable
```

Adicione:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
DEVTOOLS_API_KEY=sua-chave-secreta-forte-32-caracteres
CORS_ORIGINS=https://seu-frontend.up.railway.app,http://localhost:3000
RETENTION_DAYS=30
RATE_LIMIT=100
NODE_ENV=production
```

---

## 🚂 Configuração do Railway

### 1️⃣ Criar Token de API

1. Acesse: https://railway.app/account/tokens
2. Clique em **Create Token**
3. Nome: `GitHub Actions Deploy`
4. Copie o token

### 2️⃣ Criar Projeto no Railway

**Via Dashboard:**
1. New Project → Deploy from GitHub repo
2. Selecione seu repositório
3. Configure:
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `cd packages/frontend && pnpm preview`
   - **Root Directory**: `/`

**Via CLI (alternativa):**
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### 3️⃣ Obter Nome do Serviço

```bash
railway status
# Ou veja no dashboard: Settings → Service Name
```

### 4️⃣ Adicionar Secrets no GitHub

```
RAILWAY_TOKEN=seu-token-aqui
RAILWAY_SERVICE_NAME=nome-do-servico
RAILWAY_URL=https://seu-projeto.up.railway.app
```

### 5️⃣ Configurar Variáveis no Railway

No dashboard do Railway:
```
Variables → New Variable
```

Adicione:
```env
VITE_API_URL=https://seu-backend.netlify.app/api
VITE_WS_URL=https://seu-backend.netlify.app
NODE_ENV=production
```

---

## 🗄️ Configuração do Supabase

### 1️⃣ Criar Token de Acesso

1. Acesse: https://app.supabase.com/account/tokens
2. Clique em **Generate new token**
3. Nome: `GitHub Actions CI/CD`
4. Copie o token

### 2️⃣ Obter Project Reference

**Via Dashboard:**
1. Acesse seu projeto no Supabase
2. Settings → General
3. Copie o **Reference ID**

**Via CLI:**
```bash
supabase projects list
```

### 3️⃣ Adicionar Secrets no GitHub

```
SUPABASE_ACCESS_TOKEN=seu-token-aqui
SUPABASE_PROJECT_REF=seu-project-ref
```

### 4️⃣ Inicializar Supabase no Projeto

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref seu-project-ref

# Criar migration inicial (se necessário)
supabase db diff --use-migra -f initial_schema

# Push migrations
supabase db push
```

---

## 📦 Configuração do npm

### 1️⃣ Criar Conta no npm

Se ainda não tem:
```bash
npm adduser
```

### 2️⃣ Criar Token de Autenticação

**Via CLI:**
```bash
npm token create --read-and-publish
```

**Via Web:**
1. Acesse: https://www.npmjs.com/settings/~/tokens
2. **Generate New Token** → **Classic Token**
3. Tipo: **Automation**
4. Copie o token

### 3️⃣ Adicionar Secret no GitHub

```
NPM_TOKEN=npm_seu-token-aqui
```

### 4️⃣ Verificar Escopo do Pacote

Certifique-se de que você tem permissão para publicar no escopo `@nest-devtools`:

**Opção A: Usar seu próprio escopo**
```bash
# Trocar de @nest-devtools para @seu-usuario
# Atualizar em todos os package.json
```

**Opção B: Criar organização npm**
```bash
npm org create nest-devtools
npm org set nest-devtools developers YourUsername
```

---

## 🧪 Testando os Workflows

### 1️⃣ Validar Arquivos YAML

```bash
# Instalar actionlint
brew install actionlint  # macOS
# ou baixe: https://github.com/rhysd/actionlint

# Validar workflows
actionlint
```

### 2️⃣ Testar Localmente com Act

```bash
# Instalar act
brew install act  # macOS

# Listar workflows
act -l

# Executar workflow de CI
act pull_request

# Executar workflow específico
act -W .github/workflows/ci.yml
```

### 3️⃣ Executar Workflows Manualmente

1. Acesse: **Actions** no GitHub
2. Selecione o workflow
3. Clique em **Run workflow**
4. Escolha a branch
5. Clique em **Run workflow**

### 4️⃣ Monitorar Execução

```bash
# Via CLI do GitHub
gh run list
gh run view [RUN_ID]
gh run watch [RUN_ID]
```

---

## 🐛 Troubleshooting

### ❌ Erro: "NETLIFY_AUTH_TOKEN not found"

**Solução:**
1. Verifique que o secret foi criado corretamente
2. Certifique-se de que o nome está exato (case-sensitive)
3. Re-crie o secret se necessário

### ❌ Erro: "npm publish failed - 403"

**Possíveis causas:**
1. Token npm inválido ou expirado
2. Sem permissão para publicar no escopo
3. Versão já publicada

**Solução:**
```bash
# Re-criar token
npm token create --read-and-publish

# Verificar permissões
npm access ls-packages

# Atualizar versão
npm version patch  # ou minor/major
```

### ❌ Erro: "Supabase connection failed"

**Solução:**
1. Verificar `SUPABASE_ACCESS_TOKEN`
2. Verificar `SUPABASE_PROJECT_REF`
3. Testar localmente:
```bash
supabase link --project-ref $SUPABASE_PROJECT_REF
supabase db diff
```

### ❌ Erro: "Railway deployment timeout"

**Solução:**
1. Aumentar timeout no workflow (default: 15min)
2. Verificar logs no Railway dashboard
3. Otimizar build (cache de dependências)

### ❌ Build falha no GitHub Actions

**Debug:**
```yaml
# Adicionar step de debug no workflow
- name: 🐛 Debug
  run: |
    echo "Node version: $(node -v)"
    echo "pnpm version: $(pnpm -v)"
    ls -la
    env | sort
```

---

## 📊 Workflows Disponíveis

### 1. CI - Testes e Validação
- **Trigger**: Push e Pull Request
- **Ações**: Lint, Type Check, Tests, Build
- **Arquivo**: `.github/workflows/ci.yml`

### 2. Deploy Backend (Netlify)
- **Trigger**: Push em `main/staging` (path: `packages/backend/**`)
- **Ações**: Build, Test, Deploy
- **Arquivo**: `.github/workflows/deploy-backend.yml`

### 3. Deploy Frontend (Railway)
- **Trigger**: Push em `main/staging` (path: `packages/frontend/**`)
- **Ações**: Build, Deploy
- **Arquivo**: `.github/workflows/deploy-frontend.yml`

### 4. Deploy Supabase (Migrations)
- **Trigger**: Push em `main` (path: `supabase/migrations/**`)
- **Ações**: Link, Diff, Push migrations
- **Arquivo**: `.github/workflows/deploy-supabase.yml`

### 5. Publish Agent Package
- **Trigger**: Release, Workflow Dispatch
- **Ações**: Build, Test, Publish npm
- **Arquivo**: `.github/workflows/publish-agent.yml`

---

## 🎯 Checklist Final

Antes de fazer push:

- [ ] ✅ Todos os secrets configurados no GitHub
- [ ] ✅ Variáveis de ambiente configuradas no Netlify
- [ ] ✅ Variáveis de ambiente configuradas no Railway
- [ ] ✅ Supabase CLI configurado e testado
- [ ] ✅ Token npm criado e testado
- [ ] ✅ Workflows validados (actionlint)
- [ ] ✅ URLs atualizadas nos secrets (VITE_API_URL, etc)
- [ ] ✅ Repository URLs atualizadas nos package.json
- [ ] ✅ Dependabot configurado
- [ ] ✅ Branch protection rules configuradas (opcional)

---

## 🚀 Primeira Execução

1. **Commit e Push:**
```bash
git add .
git commit -m "ci: configure GitHub Actions workflows"
git push origin main
```

2. **Monitorar no GitHub:**
```
Actions → All workflows → CI
```

3. **Verificar Deploy:**
- Backend: https://seu-site.netlify.app
- Frontend: https://seu-projeto.up.railway.app

4. **Publicar Pacote (manual):**
```bash
# Via workflow
Actions → Publish Agent Package → Run workflow
# Preencha versão (ex: 0.1.0) e tag (latest)
```

---

## 📚 Recursos Adicionais

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Netlify CLI Docs](https://docs.netlify.com/cli/get-started/)
- [Railway CLI Docs](https://docs.railway.app/develop/cli)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [npm Publishing](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

---

**Configuração completa! 🎉**

Agora você tem CI/CD totalmente automatizado para Backend, Frontend, Database e npm package!

