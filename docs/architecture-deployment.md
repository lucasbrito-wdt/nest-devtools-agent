# 🏗️ Arquitetura de Deployment

## 📊 Visão Geral

Este projeto tem **duas partes distintas**:

### 1. 📦 Pacote npm (`@nest-devtools/agent`)

**O que é:** Biblioteca instalável por desenvolvedores  
**Onde fica:** npm registry (https://npmjs.com)  
**Quem usa:** Desenvolvedores que querem adicionar DevTools aos seus projetos NestJS

```bash
npm install @nest-devtools/agent
```

### 2. 🌐 SaaS (Frontend + Backend)

**O que é:** Aplicação hospedada que gerencia os DevTools  
**Onde fica:**

- Frontend: Netlify
- Backend: Railway
  **Quem usa:** Você (admin) para ver os dados coletados

---

## 📦 Pacote npm - `@nest-devtools/agent`

### O que é publicado:

- ✅ `@nest-devtools/agent` - Biblioteca principal
- ✅ `@nest-devtools/shared` - Dependência (tipos compartilhados)

### Como funciona:

```mermaid
Developer
  ↓ installs
@nest-devtools/agent (npm)
  ↓ sends data to
Backend SaaS (Railway)
  ↓ displays in
Frontend SaaS (Netlify)
```

### Workflow de publicação:

**Trigger:** Criar Release no GitHub

```bash
# 1. Atualizar versão
cd packages/agent && npm version patch

# 2. Commit
git commit -m "chore: release v0.1.1"
git push

# 3. Criar Release no GitHub
# → Automaticamente publica no npm
```

### Arquivo:

`.github/workflows/publish-npm.yml`

---

## 🌐 SaaS - Frontend e Backend

### Como funciona:

```mermaid
Developer Installs Agent
  ↓
Agent sends events to Backend
  ↓
Backend stores in database
  ↓
Frontend reads from Backend
  ↓
Admin sees dashboard
```

### Workflow de deploy:

**Trigger:** Push para `master` ou `main`

```bash
git push origin master
# → Automaticamente deploy:
#   - Frontend → Netlify
#   - Backend → Railway
```

### Arquivo:

`.github/workflows/deploy.yml`

---

## 📋 Comparação

| Aspecto        | npm Package             | SaaS                    |
| -------------- | ----------------------- | ----------------------- |
| **Público**    | ✅ Sim                  | ✅ Sim (mas sem código) |
| **Acesso**     | npm registry            | URLs hospedadas         |
| **Deployment** | Manual via Release      | Automático em push      |
| **Usuários**   | Desenvolvedores         | Você (admin)            |
| **Versão**     | Controlada via releases | Sempre latest           |
| **Objetivo**   | Biblioteca instalável   | Aplicação em produção   |

---

## 🔄 Fluxo Completo

### 1. Developer instala o pacote

```bash
npm install @nest-devtools/agent
```

### 2. Developer adiciona ao projeto

```typescript
import { DevToolsModule } from '@nest-devtools/agent';

@Module({
  imports: [
    DevToolsModule.register({
      apiUrl: 'https://seu-backend.up.railway.app',
    }),
  ],
})
export class AppModule {}
```

### 3. Developer faz deploy do seu app

```bash
npm run build
npm run deploy
```

### 4. Você (admin) vê os dados

Acessa: https://seu-frontend.netlify.app

---

## 🎯 Objetivos

### Pacote npm:

- ✅ Ser instalável via npm
- ✅ Ser open source e público
- ✅ Ser versionado (SemVer)
- ✅ Permitir que qualquer dev use

### SaaS:

- ✅ Rodar 24/7
- ✅ Ser escalável
- ✅ Ser confiável
- ✅ Ser seu ambiente de produção

---

## 📚 Documentação Adicional

- [Publishing](./automated-publishing.md)
- [Quick Start](./first-time-setup-automation.md)
- [SETUP_AUTOMATION](../SETUP_AUTOMATION.md)

---

**✅ Arquitetura separada entre produto (npm) e infraestrutura (SaaS)**
