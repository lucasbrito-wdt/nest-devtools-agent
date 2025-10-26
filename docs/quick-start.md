# 🚀 Quick Start — Nest DevTools Telescope

> Comece a usar em **5 minutos**!

---

## 1️⃣ Instalar Dependências

```bash
# Clone o repositório
git clone https://github.com/yourorg/nest-devtools-agent.git
cd nest-devtools-agent

# Instale dependências
pnpm install
```

---

## 2️⃣ Subir Infraestrutura

```bash
# Sobe PostgreSQL + Redis via Docker Compose
pnpm docker:up

# Aguarde ~10s para o banco inicializar
```

**Verificar se está rodando:**

```bash
docker ps

# Deve mostrar:
# - devtools-postgres (porta 5432)
# - devtools-redis (porta 6379)
```

---

## 3️⃣ Configurar Backend

```bash
cd packages/backend

# Copia .env.example
cp .env.example .env

# Edite .env e configure sua API key
# DEVTOOLS_API_KEY=sua-chave-secreta-aqui
```

**Rodar migrações (opcional, já roda no init.sql):**

```bash
pnpm migration:run
```

---

## 4️⃣ Iniciar Backend

```bash
# Ainda em packages/backend
pnpm dev

# Deve exibir:
# 🔭 DevTools Backend running on http://localhost:4000
```

**Teste o health check:**

```bash
curl http://localhost:4000/api/health

# Resposta esperada:
# {"status":"ok","timestamp":"...","uptime":123}
```

---

## 5️⃣ Iniciar Frontend

```bash
# Novo terminal
cd packages/frontend
pnpm dev

# Deve exibir:
# ➜  Local:   http://localhost:3000/
```

**Abra no navegador:** http://localhost:3000

Você verá o Dashboard vazio (normal, ainda não há eventos).

---

## 6️⃣ Integrar na Sua App NestJS

### Instalar o Agent

```bash
cd /caminho/para/sua/app
pnpm add @nest-devtools/agent
```

### Configurar no AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { DevtoolsModule } from '@nest-devtools/agent';

@Module({
  imports: [
    // ... outros imports

    DevtoolsModule.forRoot({
      enabled: process.env.NODE_ENV !== 'production',
      backendUrl: 'http://localhost:4000',
      apiKey: process.env.DEVTOOLS_API_KEY!,
    }),
  ],
})
export class AppModule {}
```

### Configurar .env

```env
# .env
DEVTOOLS_API_KEY=a-mesma-chave-do-backend
NODE_ENV=development
```

### Rodar Sua App

```bash
npm run start:dev
# ou
pnpm dev
```

---

## 7️⃣ Testar

### Fazer Requisição na Sua App

```bash
curl http://localhost:3000/api/users
```

### Ver no Painel DevTools

1. Abra http://localhost:3000 (DevTools UI)
2. Clique em "Requests"
3. Você verá a requisição `GET /api/users` aparecer!

🎉 **Funcionou!**

---

## 8️⃣ Próximos Passos

### Gerar Exceção de Propósito

```typescript
// Adicione na sua app
@Get('/test-error')
throwError() {
  throw new Error('Erro de teste para DevTools');
}
```

**Acesse:** http://localhost:3000/api/test-error

**Veja no DevTools:** Aba "Exceptions"

---

### Capturar Logs

```typescript
// Sua app
@Get('/test-log')
testLog() {
  this.logger.log('Log de teste');
  this.logger.warn('Warning de teste');
  return { ok: true };
}
```

**Veja no DevTools:** Aba "Logs"

---

## 🛠️ Comandos Úteis

```bash
# Parar containers
pnpm docker:down

# Ver logs dos containers
pnpm docker:logs

# Rebuild tudo
pnpm build

# Rodar testes
pnpm test

# Formatar código
pnpm format
```

---

## 🐛 Troubleshooting

### Backend não conecta no banco

```bash
# Verificar se Postgres está rodando
docker ps | grep postgres

# Se não estiver, suba novamente
pnpm docker:up
```

### Agent não envia eventos

**Checklist:**

1. `enabled: true` no DevtoolsModule?
2. `DEVTOOLS_API_KEY` igual no agent e backend?
3. Backend rodando em http://localhost:4000?
4. Fazer request na sua app?

**Debug:**

```typescript
// No agent, temporariamente:
DevtoolsModule.forRoot({
  enabled: true,
  backendUrl: 'http://localhost:4000',
  apiKey: 'SUA_KEY',
  timeout: 10000, // ← Aumenta timeout
})
```

**Checar logs do backend:**

```bash
cd packages/backend
pnpm dev

# Deve mostrar:
# [IngestService] Event ingested: uuid-here (request)
```

### Porta já em uso

**Backend (4000):**

```env
# .env
PORT=4001
```

**Frontend (3000):**

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3001,
  },
});
```

---

## 📚 Próxima Leitura

- [Arquitetura](./architecture.md) — Entenda como funciona
- [Segurança](./security.md) — **LEIA ANTES DE PRODUÇÃO**
- [API Reference](./api.md) — Endpoints e tipos
- [Configuração Avançada](./configuration.md) — Customizações

---

## 🎓 Video Tutorial (futuro)

_Em breve: vídeo passo a passo no YouTube_

---

## 💬 Precisa de Ajuda?

- GitHub Issues: [Link]
- Discord: [Link]
- Email: support@yourcompany.com

---

**Pronto para usar! 🚀 Divirta-se explorando sua aplicação NestJS!**

