# 🚀 Publicação e Deploy Automáticos

Este documento explica como configurar e usar a publicação e deploys automáticos via GitHub Actions.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Configuração Inicial](#configuração-inicial)
- [Publicação no npm](#publicação-no-npm)
- [Deploy Automático](#deploy-automático)
- [Como Usar](#como-usar)

---

## 🎯 Visão Geral

O projeto possui **3 workflows automáticos** via GitHub Actions:

1. **📦 Publicação no npm** - Publica pacotes `@nest-devtools/shared` e `@nest-devtools/agent`
2. **🌐 Deploy Frontend** - Deploy automático no Netlify
3. **⚙️ Deploy Backend** - Deploy automático no Railway

---

## ⚙️ Configuração Inicial

### 1. Configurar Secrets no GitHub

Acesse: **Settings → Secrets and variables → Actions**

Adicione os seguintes secrets:

#### Para publicação no npm:

```
NPM_TOKEN
```

**Como obter:**

1. Crie uma conta em https://www.npmjs.com/
2. Vá em **Access Tokens**
3. Crie um **Classic Token** com permissão `Automation`
4. Copie o token e adicione como secret no GitHub

#### Para deploy no Netlify:

```
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

**Como obter:**

1. Acesse https://app.netlify.com/
2. Vá em **User settings → Applications → New access token**
3. Crie um token e adicione como `NETLIFY_AUTH_TOKEN`
4. Para `NETLIFY_SITE_ID`: Site settings → General → Site information

#### Para deploy no Railway:

```
RAILWAY_TOKEN
```

**Como obter:**

1. Instale o Railway CLI: `npm i -g @railway/cli`
2. Execute: `railway login`
3. Execute: `railway whoami`
4. O token estará em `~/.railway/`

---

## 📦 Publicação no npm

### Workflow: `.github/workflows/publish-npm.yml`

### Quando é executado:

1. **Automático**: Quando você cria uma **Release** no GitHub
2. **Manual**: Via GitHub Actions UI

### Como publicar:

#### Método 1: Via Release GitHub (Recomendado)

```bash
# 1. Atualizar versões nos packages
cd packages/shared
npm version patch  # ou minor/major
cd ../agent
npm version patch
cd ../..

# 2. Commit e push
git add .
git commit -m "chore: release v0.1.0"
git push origin master

# 3. Criar Release no GitHub
# - Vá para Releases → Draft a new release
# - Tag: v0.1.0
# - Title: v0.1.0
# - Description: Changelog
# - Publish release
```

**✅ Automaticamente:**

- Build dos pacotes
- Publicação no npm
- Git tag criada

#### Método 2: Manual via Actions

1. Vá para **Actions** no GitHub
2. Selecione **🚀 Publish to npm**
3. Click em **Run workflow**
4. Escolha a branch (master/main)
5. Execute

### O que é publicado:

- ✅ `@nest-devtools/shared` → npm
- ✅ `@nest-devtools/agent` → npm

---

## 🌐 Deploy Automático

### Workflow: `.github/workflows/deploy.yml`

### Quando é executado:

**Automaticamente** em cada push para:

- `master` ou `main`
- Pull Requests para `master` ou `main`

### O que faz:

1. **Frontend**: Builda e deploya no Netlify
2. **Backend**: Deploya no Railway

---

## 🔄 Fluxo Completo

### Cenário: Nova feature

```bash
# 1. Criar branch de feature
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver
# ... código ...

# 3. Commit
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 4. Push
git push origin feature/nova-funcionalidade

# 5. Criar Pull Request
# → GitHub automaticamente faz deploy de preview
# → Netlify e Railway recebem preview

# 6. Após merge para master
# → Deploy automático de produção
```

### Cenário: Nova versão

```bash
# 1. Atualizar versão
cd packages/shared && npm version patch && cd ../agent && npm version patch && cd ../..

# 2. Commit versão
git add . && git commit -m "chore: release v0.1.1" && git push

# 3. Criar Release no GitHub
# → Automaticamente publica no npm
```

---

## 📊 Monitoramento

### Verificar Status

**GitHub Actions:**

- https://github.com/lucasbrito-wdt/nest-devtools-agent/actions

**npm:**

- https://www.npmjs.com/package/@nest-devtools/shared
- https://www.npmjs.com/package/@nest-devtools/agent

**Netlify:**

- https://app.netlify.com/

**Railway:**

- https://railway.app/

---

## 🔧 Troubleshooting

### Erro: "Invalid npm token"

```bash
# Verificar se NPM_TOKEN está configurado
# Settings → Secrets → Actions → NPM_TOKEN
```

### Erro: "Deploy failed"

Verificar se os secrets estão configurados:

- ✅ `NETLIFY_AUTH_TOKEN`
- ✅ `NETLIFY_SITE_ID`
- ✅ `RAILWAY_TOKEN`

### Não está publicando automaticamente

1. Verificar se a Release foi publicada (não draft)
2. Verificar se o tag começa com `v` (ex: `v0.1.0`)
3. Verificar os logs em **Actions**

---

## 🎓 Exemplos

### Example 1: Publicar versão patch

```bash
# Atualizar versões
cd packages/shared && npm version patch && cd ../agent && npm version patch && cd ../..

# Commit
git add .
git commit -m "chore: release v0.1.1"
git push

# Criar Release no GitHub
# Tag: v0.1.1
# → Automaticamente publica no npm
```

### Example 2: Publicar versão minor

```bash
cd packages/shared && npm version minor && cd ../agent && npm version minor && cd ../..
git add .
git commit -m "chore: release v0.2.0"
git push

# Criar Release no GitHub
# Tag: v0.2.0
```

### Example 3: Rollback

```bash
# Despublicar versão
npm unpublish @nest-devtools/agent@0.1.0 --force

# Deprecar versão
npm deprecate @nest-devtools/agent@0.1.0 "Use 0.1.1 instead"
```

---

## 📚 Recursos

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [npm Publishing](https://docs.npmjs.com/packages-and-modules/publishing-packages)
- [Netlify CLI](https://docs.netlify.com/cli/get-started/)
- [Railway Docs](https://docs.railway.app/)

---

## ✅ Checklist Final

Antes de publicar, verifique:

- [ ] Todos os testes passando
- [ ] Build sem erros
- [ ] Versão atualizada nos `package.json`
- [ ] CHANGELOG atualizado
- [ ] README atualizado
- [ ] Secrets configurados no GitHub
- [ ] Código revisado e aprovado

---

**🎉 Pronto para publicar automaticamente!**
