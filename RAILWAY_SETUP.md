# 🚂 Setup Railway via Dashboard

## 📋 Pré-requisitos

- Conta no Railway: https://railway.app
- Repositório no GitHub conectado
- Dockerfile na raiz do projeto ✅

---

## 🔧 Configuração no Railway Dashboard

### 1. Criar Projeto

1. Acesse: https://railway.app/dashboard
2. Clique em **New Project**
3. Selecione **Deploy from GitHub repo**
4. Escolha: `lucasbrito-wdt/nest-devtools-agent`

### 2. Configurar Build

Após criar o projeto, vá em **Settings**:

#### 🐳 Builder
- **Builder**: `Dockerfile`
- **Dockerfile Path**: `Dockerfile`
- **Build Context**: `.` (raiz do projeto)

#### 📦 Root Directory
- Deixe vazio (ou `/`)

---

## 🔐 Variáveis de Ambiente

Vá em **Variables** e adicione:

### Obrigatórias:

```bash
PORT=4000
NODE_ENV=production
```

### Database (Railway Postgres):

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### CORS (Frontend):

```bash
CORS_ORIGINS=https://seu-frontend.netlify.app
```

### DevTools:

```bash
DEVTOOLS_API_KEY=sua-chave-secreta-aqui
```

---

## 🚀 Deploy

### Deploy Automático (Recomendado):

1. Vá em **Settings** → **Service**
2. **Auto Deploy**: ✅ Ativado
3. Faça `git push` → Deploy automático!

### Deploy Manual:

1. Vá em **Deployments**
2. Clique em **Deploy**

---

## 📊 Monitorar Deploy

### Logs:
- **Deployments** → Clique no deploy → **View Logs**

### Status:
- ✅ **Building**: Buildando com Dockerfile
- ✅ **Deploying**: Subindo o container
- ✅ **Active**: Deploy completo!

---

## 🔍 Verificar Build

O Railway deve mostrar:

```
→ Building with Dockerfile
→ Using oven/bun:1-alpine
→ Installing dependencies with bun
→ Building packages/shared
→ Building packages/backend
→ Deploy successful!
```

---

## 🌐 Domínio

1. Vá em **Settings** → **Networking**
2. Clique em **Generate Domain**
3. Anote a URL: `https://seu-projeto.up.railway.app`

---

## 🐛 Troubleshooting

### Problema: Railway usa Railpack

**Solução:**
1. Delete o serviço atual
2. Crie um novo projeto
3. Configure **Builder: Dockerfile** ANTES do primeiro deploy

### Problema: Build falha

**Solução:**
1. Verifique os logs: **Deployments** → **View Logs**
2. Confirme que o Dockerfile está na raiz
3. Verifique se o `railway.toml` está commitado

### Problema: Variáveis de ambiente não funcionam

**Solução:**
1. Vá em **Variables**
2. Adicione as variáveis necessárias
3. Clique em **Redeploy**

---

## 📝 Checklist

- [ ] Projeto criado no Railway
- [ ] Repositório GitHub conectado
- [ ] **Builder: Dockerfile** configurado
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy automático ativado
- [ ] Domínio gerado
- [ ] Logs verificados

---

## 🔗 Links Úteis

- Dashboard: https://railway.app/dashboard
- Docs: https://docs.railway.app
- Config File: https://docs.railway.app/reference/config-file
- Dockerfile: https://docs.railway.app/reference/dockerfiles

---

## ✅ Pronto!

Agora todo `git push` vai fazer deploy automático no Railway usando o Dockerfile com Bun! 🚀

