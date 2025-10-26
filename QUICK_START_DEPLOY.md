# 🚀 Quick Start - Deploy e Publicação

> Guia rápido para configurar CI/CD e publicar o pacote agent

---

## ⚡ Checklist Rápido

### 1️⃣ Configurar GitHub Repository

```bash
# Se ainda não iniciou o repositório
git init
git add .
git commit -m "Initial commit"

# Criar repositório no GitHub
gh repo create nest-devtools-agent --public --source=. --remote=origin

# Push inicial
git push -u origin main
```

---

### 2️⃣ Configurar Secrets no GitHub

**Opção A: Script Automático (Linux/Mac)**
```bash
./scripts/setup-github-secrets.sh
```

**Opção B: Manual**

Acesse: `https://github.com/SEU-USUARIO/nest-devtools-agent/settings/secrets/actions`

Adicione os seguintes secrets:

| Secret | Onde Obter |
|--------|------------|
| `NETLIFY_AUTH_TOKEN` | https://app.netlify.com/user/applications |
| `NETLIFY_SITE_ID` | Netlify Dashboard → Settings → General |
| `RAILWAY_TOKEN` | https://railway.app/account/tokens |
| `RAILWAY_SERVICE_NAME` | Railway Dashboard → Settings |
| `SUPABASE_ACCESS_TOKEN` | https://app.supabase.com/account/tokens |
| `SUPABASE_PROJECT_REF` | Supabase Dashboard → Settings |
| `NPM_TOKEN` | https://www.npmjs.com/settings/~/tokens |
| `VITE_API_URL` | `https://seu-site.netlify.app/api` |
| `VITE_WS_URL` | `https://seu-site.netlify.app` |

---

### 3️⃣ Criar Projetos nos Serviços

#### Supabase
```bash
# 1. Criar projeto em https://supabase.com
# 2. Copiar Database URL e Project Ref
# 3. Instalar CLI
npm install -g supabase

# 4. Link projeto
supabase link --project-ref seu-project-ref

# 5. Push migrations
supabase db push
```

#### Netlify
```bash
# 1. Instalar CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Criar site
netlify sites:create

# 4. Copiar Site ID

# 5. Configurar env vars no dashboard
# DATABASE_URL
# DEVTOOLS_API_KEY
# CORS_ORIGINS
```

#### Railway
```bash
# 1. Criar projeto em https://railway.app
# 2. New Project → Deploy from GitHub
# 3. Selecionar repositório
# 4. Copiar Service Name
# 5. Configurar env vars:
#    VITE_API_URL
#    VITE_WS_URL
```

---

### 4️⃣ Atualizar URLs nos Package.json

Edite os seguintes arquivos:

**`packages/agent/package.json`**
```json
{
  "repository": {
    "url": "https://github.com/SEU-USUARIO/nest-devtools-agent.git"
  },
  "bugs": {
    "url": "https://github.com/SEU-USUARIO/nest-devtools-agent/issues"
  },
  "homepage": "https://github.com/SEU-USUARIO/nest-devtools-agent#readme"
}
```

**`packages/shared/package.json`**
```json
{
  "repository": {
    "url": "https://github.com/SEU-USUARIO/nest-devtools-agent.git"
  },
  "bugs": {
    "url": "https://github.com/SEU-USUARIO/nest-devtools-agent/issues"
  },
  "homepage": "https://github.com/SEU-USUARIO/nest-devtools-agent#readme"
}
```

---

### 5️⃣ Verificar Configuração

```bash
# Instalar dependências
pnpm install

# Verificar build
pnpm build

# Verificar testes
pnpm test

# Verificar types
pnpm typecheck

# Verificar lint
pnpm lint
```

**Ou usar script automatizado:**
```bash
./scripts/check-setup.sh
```

---

### 6️⃣ Primeiro Deploy

```bash
# Commit configurações
git add .
git commit -m "ci: configure GitHub Actions and deployment"
git push origin main
```

Monitore em: `https://github.com/SEU-USUARIO/nest-devtools-agent/actions`

Os workflows executarão:
- ✅ CI (testes, lint, build)
- ✅ Deploy Backend (Netlify)
- ✅ Deploy Frontend (Railway)
- ✅ Deploy Supabase (migrations)

---

### 7️⃣ Publicar Pacote no npm

#### Primeira Publicação

**Via GitHub Actions (Recomendado):**

1. Acesse: `Actions → Publish Agent Package`
2. Click em `Run workflow`
3. Preencha:
   - Version: `0.1.0`
   - Tag: `latest`
4. Click em `Run workflow`

**Via CLI (Alternativa):**
```bash
# Atualizar versão
cd packages/shared
npm version 0.1.0
cd ../agent
npm version 0.1.0
cd ../..

# Build
pnpm build

# Login npm
npm login

# Publicar
cd packages/shared
npm publish --access public
cd ../agent
npm publish --access public
cd ../..

# Tag no git
git add .
git commit -m "chore: release v0.1.0"
git tag v0.1.0
git push origin main --tags
```

---

## 📋 Comandos Úteis

### Desenvolvimento
```bash
# Dev mode (todos os pacotes)
pnpm dev

# Dev mode (específico)
pnpm dev:backend
pnpm dev:frontend
pnpm dev:agent

# Build tudo
pnpm build

# Testes
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

### Docker (Local)
```bash
# Subir infraestrutura
pnpm docker:up

# Ver logs
pnpm docker:logs

# Parar
pnpm docker:down
```

### Git & Deploy
```bash
# Status dos workflows
gh run list

# Ver logs de um workflow
gh run view RUN_ID

# Re-executar workflow falhado
gh run rerun RUN_ID

# Executar workflow manualmente
gh workflow run publish-agent.yml
```

### npm
```bash
# Ver versões publicadas
npm view @nest-devtools/agent versions

# Ver informações
npm view @nest-devtools/agent

# Testar instalação
npm install @nest-devtools/agent
```

---

## 🎯 Fluxo de Trabalho Típico

### Desenvolver Feature

```bash
# 1. Criar branch
git checkout -b feature/minha-feature

# 2. Desenvolver
# ... codificar ...
pnpm dev:agent

# 3. Testar
pnpm test
pnpm lint
pnpm build

# 4. Commit
git add .
git commit -m "feat: adiciona minha feature"

# 5. Push
git push origin feature/minha-feature

# 6. Abrir PR
gh pr create
```

### Merge e Deploy

```bash
# 7. Merge PR (após review)
gh pr merge --squash

# ➡️ Workflows executam automaticamente

# 8. Verificar deploys
# Backend: https://seu-site.netlify.app
# Frontend: https://seu-projeto.up.railway.app
```

### Release Nova Versão

```bash
# 9. Criar release
gh release create v0.2.0 --generate-notes

# ➡️ Pacote publicado automaticamente no npm
```

---

## 🐛 Troubleshooting

### Workflow falha com "secret not found"
➡️ Verifique se o secret foi criado: Settings → Secrets → Actions

### Deploy falha no Netlify
➡️ Verifique env vars no dashboard do Netlify

### Deploy falha no Railway
➡️ Verifique logs no dashboard do Railway

### Migrations falham no Supabase
➡️ Execute localmente:
```bash
supabase link --project-ref seu-ref
supabase db diff
supabase db push
```

### npm publish falha com 403
➡️ Verifique:
1. Token npm válido
2. Permissões no escopo
3. Versão não duplicada

---

## 📚 Documentação Completa

- 📖 [Configuração GitHub](docs/github-setup.md)
- 🚀 [Deploy Production](docs/deployment.md)
- 🔄 [CI/CD](docs/ci-cd.md)
- 📦 [Publicação npm](PUBLISHING.md)

---

## ✅ Checklist Final

Antes de marcar como completo:

- [ ] Repository criado no GitHub
- [ ] Todos os secrets configurados
- [ ] Projetos criados (Supabase, Netlify, Railway)
- [ ] URLs atualizadas nos package.json
- [ ] Primeiro push executado com sucesso
- [ ] Workflows rodando sem erros
- [ ] Backend acessível
- [ ] Frontend acessível
- [ ] Database com migrations aplicadas
- [ ] Pacote publicado no npm (opcional)
- [ ] README atualizado com badges
- [ ] Documentação revisada

---

**🎉 Setup completo! Agora você tem CI/CD totalmente automatizado!**

### Próximos Passos

1. ⭐ Star no repositório
2. 📝 Escrever documentação de uso
3. 🧪 Adicionar mais testes
4. 🎨 Melhorar UI do frontend
5. 📢 Divulgar o projeto!

