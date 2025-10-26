# 🔄 Configuração GitHub Actions - Guia Completo

Este guia mostra como configurar as pipelines de CI/CD para o monorepo.

---

## 📋 Índice

1. [Secrets Necessários](#secrets-necessários)
2. [Configuração Railway](#configuração-railway)
3. [Configuração Netlify](#configuração-netlify)
4. [Workflows Disponíveis](#workflows-disponíveis)
5. [Como Usar](#como-usar)
6. [Troubleshooting](#troubleshooting)

---

## 🔐 Secrets Necessários

### Como Adicionar Secrets:

1. Acesse: `https://github.com/lucasbrito-wdt/nest-devtools-agent/settings/secrets/actions`
2. Clique em **New repository secret**
3. Adicione cada secret abaixo

---

## 🚂 Configuração Railway

### 1. Obter Railway Token

1. Acesse: https://railway.app/account/tokens
2. Clique em **Create Token**
3. Nome: `GitHub Actions`
4. Copie o token

### 2. Adicionar Secret no GitHub

```
Nome: RAILWAY_TOKEN
Valor: <seu-token-railway>
```

### 3. Conectar Railway ao GitHub

1. Acesse: https://railway.app/dashboard
2. Selecione o projeto
3. **Settings** → **Source**
4. Clique em **Connect Repo**
5. Selecione: `lucasbrito-wdt/nest-devtools-agent`

✅ Pronto! Railway vai fazer deploy automático a cada push.

---

## 🎨 Configuração Netlify

### 1. Obter Netlify Auth Token

1. Acesse: https://app.netlify.com/user/applications#personal-access-tokens
2. Clique em **New access token**
3. Nome: `GitHub Actions`
4. Copie o token

### 2. Obter Netlify Site ID

1. Acesse: https://app.netlify.com/sites
2. Selecione seu site
3. **Site settings** → **General**
4. Copie o **Site ID** (API ID)

### 3. Adicionar Secrets no GitHub

```
Nome: NETLIFY_AUTH_TOKEN
Valor: <seu-token-netlify>

Nome: NETLIFY_SITE_ID
Valor: <seu-site-id>
```

### 4. Variáveis de Build do Frontend

```
Nome: VITE_API_URL
Valor: https://seu-backend.up.railway.app

Nome: VITE_WS_URL
Valor: wss://seu-backend.up.railway.app
```

---

## 📦 Configuração NPM (Opcional - Para Releases)

### 1. Criar NPM Token

1. Acesse: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Clique em **Generate New Token**
3. Tipo: **Automation**
4. Copie o token

### 2. Adicionar Secret no GitHub

```
Nome: NPM_TOKEN
Valor: <seu-token-npm>
```

---

## 🎯 Workflows Disponíveis

### 1. Deploy Backend (`deploy-backend.yml`)

**Quando roda:**
- Push para `main`, `master` ou `staging`
- Mudanças em `packages/backend/**` ou `packages/shared/**`

**O que faz:**
- ✅ Instala dependências com Bun
- ✅ Build do shared
- ✅ Build do backend
- ✅ Testes
- ✅ Type check
- ✅ Railway deploy automático

### 2. Deploy Frontend (`deploy-frontend.yml`)

**Quando roda:**
- Push para `main`, `master` ou `staging`
- Mudanças em `packages/frontend/**` ou `packages/shared/**`

**O que faz:**
- ✅ Instala dependências com Bun
- ✅ Build do shared
- ✅ Build do frontend
- ✅ Type check
- ✅ Deploy para Netlify

### 3. CI - Testes e Linting (`ci.yml`)

**Quando roda:**
- Pull requests para `main`, `master` ou `develop`
- Push para `develop`

**O que faz:**
- ✅ Linting (ESLint + Prettier)
- ✅ Type check (todos os pacotes)
- ✅ Testes backend (com PostgreSQL)
- ✅ Build check (todos os pacotes)

### 4. Release (`release.yml`)

**Quando roda:**
- Push de tags `v*` (ex: `v1.0.0`)
- Dispatch manual

**O que faz:**
- ✅ Cria GitHub Release
- ✅ Gera changelog
- ✅ Publica no NPM

---

## 🚀 Como Usar

### Deploy Automático:

```bash
# Faça mudanças no código
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

GitHub Actions vai:
1. Detectar mudanças
2. Rodar build e testes
3. Deploy automático ✅

### Pull Request:

```bash
# Crie uma branch
git checkout -b feature/nova-feature

# Faça mudanças
git add .
git commit -m "feat: adicionar nova feature"
git push origin feature/nova-feature
```

Depois crie o PR no GitHub. CI vai rodar automaticamente!

### Release:

```bash
# Criar tag
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions vai:
1. Criar release no GitHub
2. Publicar pacotes no NPM

---

## 📊 Monitorar Workflows

### Ver Status:

1. Acesse: `https://github.com/lucasbrito-wdt/nest-devtools-agent/actions`
2. Clique no workflow
3. Ver logs detalhados

### Badges no README:

```markdown
![Deploy Backend](https://github.com/lucasbrito-wdt/nest-devtools-agent/actions/workflows/deploy-backend.yml/badge.svg)
![Deploy Frontend](https://github.com/lucasbrito-wdt/nest-devtools-agent/actions/workflows/deploy-frontend.yml/badge.svg)
![CI](https://github.com/lucasbrito-wdt/nest-devtools-agent/actions/workflows/ci.yml/badge.svg)
```

---

## 🐛 Troubleshooting

### Workflow não executa:

**Problema:** Push não triggou o workflow

**Soluções:**
1. ✅ Verifique o nome do branch (`main` vs `master`)
2. ✅ Verifique os paths modificados
3. ✅ Verifique permissões: Settings → Actions → General → Workflow permissions

### Deploy falha:

**Problema:** Deploy do backend/frontend falha

**Soluções:**
1. ✅ Verifique se os secrets estão configurados
2. ✅ Teste o build localmente: `bun run build`
3. ✅ Verifique logs do workflow
4. ✅ Railway/Netlify: verifique dashboard

### Testes falham:

**Problema:** CI falha nos testes

**Soluções:**
1. ✅ Rode localmente: `bun test`
2. ✅ Verifique PostgreSQL no workflow
3. ✅ Verifique variáveis de ambiente

### Secret não encontrado:

**Problema:** `Error: Secret XXX not found`

**Soluções:**
1. ✅ Verifique o nome do secret (case-sensitive)
2. ✅ Adicione o secret: Settings → Secrets → Actions
3. ✅ Verifique se está no repositório correto

---

## 📝 Checklist de Configuração

- [ ] Railway Token adicionado
- [ ] Netlify Auth Token adicionado
- [ ] Netlify Site ID adicionado
- [ ] Variáveis VITE configuradas
- [ ] Railway conectado ao GitHub
- [ ] Workflows testados com push
- [ ] PR testado com CI
- [ ] Badges adicionados ao README

---

## 🔗 Links Úteis

- **GitHub Actions**: https://github.com/lucasbrito-wdt/nest-devtools-agent/actions
- **Railway Dashboard**: https://railway.app/dashboard
- **Netlify Dashboard**: https://app.netlify.com
- **NPM Tokens**: https://www.npmjs.com/settings/tokens

---

## ✅ Pronto!

Agora seu monorepo tem CI/CD completo:
- ✅ Deploy automático no Railway e Netlify
- ✅ Testes em PRs
- ✅ Type checking
- ✅ Linting
- ✅ Releases automáticas

**Faça um push e veja a mágica acontecer!** 🚀

