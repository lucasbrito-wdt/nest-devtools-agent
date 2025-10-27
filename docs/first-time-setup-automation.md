# 🚀 Configuração Inicial - Deploy Automático

Guia rápido para configurar publicação e deploys automáticos.

## ⚡ Quick Start

### 1️⃣ Configurar Secrets no GitHub

Vá para: https://github.com/lucasbrito-wdt/nest-devtools-agent/settings/secrets/actions

Adicione:

| Secret               | Como obter                                  | Obrigatório para   |
| -------------------- | ------------------------------------------- | ------------------ |
| `NPM_TOKEN`          | https://www.npmjs.com/ → Access Tokens      | 📦 npm publish     |
| `NETLIFY_AUTH_TOKEN` | https://app.netlify.com/ → New access token | 🌐 Frontend deploy |
| `NETLIFY_SITE_ID`    | Site settings → General                     | 🌐 Frontend deploy |
| `RAILWAY_TOKEN`      | `railway login` → `cat ~/.railway/token`    | ⚙️ Backend deploy  |

### 2️⃣ Configurar Escopo npm

```bash
# Criar conta no npm se ainda não tiver
# Vá para https://www.npmjs.com/signup

# Verificar se você tem permissão no escopo @nest-devtools
npm whoami

# Se não tiver, criar organização
# Ou usar seu username pessoal
```

**Importante:** Atualize os `package.json` dos pacotes com seu username npm:

```json
{
  "name": "@seu-usuario/nest-devtools-agent"
}
```

### 3️⃣ Primeira Publicação

#### Opção A: Via GitHub (Automático)

```bash
# 1. Update version
cd packages/shared
npm version patch
cd ../agent
npm version patch
cd ../..

# 2. Commit
git add .
git commit -m "chore: release v0.1.0"
git push origin master

# 3. Criar Release no GitHub
# Vá para: https://github.com/lucasbrito-wdt/nest-devtools-agent/releases/new
# Tag: v0.1.0
# Title: v0.1.0
# Publish release

# ✅ Automaticamente publica no npm
```

#### Opção B: Manual Local (Teste)

```bash
# Build
cd packages/shared && npm run build && cd ../agent && npm run build && cd ../..

# Login
npm login

# Publish
cd packages/shared && npm publish --access public && cd ../agent && npm publish --access public
```

### 4️⃣ Verificar

```bash
# Ver no npm
npm view @nest-devtools/shared
npm view @nest-devtools/agent
```

---

## 🔄 Fluxo de Trabalho

### Desenvolvimento Normal

```bash
git checkout -b feature/nova-feature
# ... desenvolver ...
git commit -m "feat: adiciona feature"
git push
# Criar PR

# Após merge, automaticamente:
# ✅ Deploy frontend no Netlify
# ✅ Deploy backend no Railway
```

### Nova Versão

```bash
# Update version
cd packages/shared && npm version patch && cd ../agent && npm version patch && cd ../..

# Commit
git add .
git commit -m "chore: release v0.1.1"
git push

# Criar Release no GitHub
# ✅ Automaticamente publica no npm
```

---

## 🛠️ Troubleshooting

### Erro: "need auth" no npm

```bash
# Verificar token
echo $NPM_TOKEN # deve mostrar o token

# Verificar se secret está configurado
# GitHub → Settings → Secrets → Actions
```

### Deploy não está funcionando

```bash
# Verificar logs
# GitHub → Actions → [workflow] → [run]

# Verificar secrets
# NETLIFY_AUTH_TOKEN configurado?
# NETLIFY_SITE_ID configurado?
# RAILWAY_TOKEN configurado?
```

### Pacote não está no npm

```bash
# Verificar se Release foi criada
# GitHub → Releases → Ver se tem release publicada (não draft)

# Verificar se tag começa com 'v'
# Tag deve ser: v0.1.0 (não 0.1.0)
```

---

## 📝 Checklist Pré-Publicação

Antes de fazer release:

- [ ] Código funcionando
- [ ] Build sem erros
- [ ] Testes passando (se houver)
- [ ] README atualizado
- [ ] Versão atualizada
- [ ] Secrets configurados no GitHub
- [ ] Per missões npm configuradas

---

## 📚 Documentação Completa

Ver: [`docs/automated-publishing.md`](./automated-publishing.md)

---

**🚀 Tudo configurado? Vamos publicar!**
