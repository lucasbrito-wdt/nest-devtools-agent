# 🎯 Resumo de Deployment - npm vs SaaS

## 📊 Arquitetura Final

### 📦 Pacote npm (Público)

**O que:** `@nest-devtools/agent`  
**Onde:** npm registry  
**Como publicar:** Via GitHub Release  
**Quem usa:** Desenvolvedores instalam no projeto

```bash
npm install @nest-devtools/agent
```

### 🌐 SaaS (Hospedado)

**O que:** Frontend + Backend  
**Onde:**

- Frontend → Netlify
- Backend → Railway
  **Como publicar:** Automático em push  
  **Quem usa:** Você (admin/dashboard)

---

## 🔄 Workflows

### 1. Publicação npm

**Arquivo:** `.github/workflows/publish-npm.yml`  
**Trigger:** Criar GitHub Release  
**Ação:** Publica `@nest-devtools/agent` no npm

```bash
# 1. Atualizar versão
cd packages/agent && npm version patch

# 2. Commit
git commit -m "chore: release v0.1.0" && git push

# 3. Criar Release no GitHub
# → Publica no npm automaticamente
```

### 2. Deploy SaaS

**Arquivo:** `.github/workflows/deploy.yml`  
**Trigger:** Push para master/main  
**Ação:**

- Frontend → Netlify
- Backend → Railway

```bash
git push origin master
# → Deploy automático de frontend e backend
```

---

## ⚙️ Secrets Necessários

Configure em: Settings → Secrets → Actions

| Secret               | Para            |
| -------------------- | --------------- |
| `NPM_TOKEN`          | Publicar npm    |
| `NETLIFY_AUTH_TOKEN` | Deploy frontend |
| `NETLIFY_SITE_ID`    | Deploy frontend |
| `RAILWAY_TOKEN`      | Deploy backend  |

---

## 🎯 Como Usar

### Para Desenvolvedores (npm):

```bash
# Instalar pacote
npm install @nest-devtools/agent

# Usar no projeto
import { DevToolsModule } from '@nest-devtools/agent';
```

### Para Você (SaaS):

1. Faça push no código
2. Automaticamente deploy no Netlify + Railway
3. Acesse o dashboard em https://seu-site.netlify.app

---

## 📚 Documentação Completa

- [Arquitetura](./docs/architecture-deployment.md)
- [Publicação Automática](./docs/automated-publishing.md)
- [Setup Inicial](./docs/first-time-setup-automation.md)
- [SETUP_AUTOMATION](./SETUP_AUTOMATION.md)

---

**✅ Configurado: npm como pacote público + SaaS hospedado**
