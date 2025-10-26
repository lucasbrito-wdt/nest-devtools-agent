# 🚀 Getting Started — Primeiros Passos

> Do zero ao funcionamento em **5 comandos**!

---

## 🎯 Comandos Rápidos

```bash
# 1. Instalar dependências
pnpm install

# 2. Subir infraestrutura (PostgreSQL + Redis)
pnpm docker:up

# 3. Iniciar backend (novo terminal)
cd packages/backend && pnpm dev

# 4. Iniciar frontend (novo terminal)
cd packages/frontend && pnpm dev

# 5. Acessar no navegador
# http://localhost:3000 (Frontend)
# http://localhost:4000/api/health (Backend health check)
```

---

## 📦 O Que Você Tem Agora

✅ **Backend API rodando** em `http://localhost:4000`
- Endpoints de ingestão e consulta
- PostgreSQL conectado
- WebSocket preparado

✅ **Frontend UI rodando** em `http://localhost:3000`
- Dashboard com estatísticas
- Páginas de Requests, Exceptions e Logs
- Dark mode funcionando

✅ **Infraestrutura**
- PostgreSQL (porta 5432)
- Redis (porta 6379)
- Schema do banco criado

---

## 🔧 Próximo Passo: Integrar na Sua App

### 1. Instalar o Agent na sua aplicação NestJS

```bash
cd /caminho/para/sua/app
pnpm add @nest-devtools/agent
```

### 2. Configurar no AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { DevtoolsModule } from '@nest-devtools/agent';

@Module({
  imports: [
    // ... seus outros imports

    DevtoolsModule.forRoot({
      enabled: process.env.NODE_ENV !== 'production',
      backendUrl: 'http://localhost:4000',
      apiKey: 'changeme-secret-key', // Use a mesma do backend!
    }),
  ],
})
export class AppModule {}
```

### 3. Rodar sua aplicação

```bash
npm run start:dev
```

### 4. Fazer requisições

```bash
# Qualquer requisição na sua app será capturada
curl http://localhost:3000/api/users
curl http://localhost:3000/api/posts
```

### 5. Ver no DevTools

Abra http://localhost:3000 (Frontend DevTools) e veja as requisições aparecerem!

---

## 📚 Documentação Completa

- **[Quick Start](./docs/quick-start.md)** — Guia detalhado de 5 minutos
- **[Arquitetura](./docs/architecture.md)** — Como funciona internamente
- **[Segurança](./docs/security.md)** — **CRÍTICO: Leia antes de produção!**
- **[API Reference](./docs/api.md)** — Endpoints e tipos
- **[Configuração](./docs/configuration.md)** — Customizações avançadas

---

## 🎬 Demo Rápido

### Teste 1: Requisição HTTP

```bash
# Faça uma requisição na sua app
curl http://localhost:3000/api/users

# Veja no DevTools:
# 1. Abra http://localhost:3000
# 2. Clique em "Requests"
# 3. Veja GET /api/users com status, timing, etc
```

### Teste 2: Exceção

```typescript
// Adicione na sua app
@Get('/test-error')
testError() {
  throw new Error('Erro de teste para DevTools');
}
```

```bash
# Chame a rota
curl http://localhost:3000/api/test-error

# Veja no DevTools:
# Aba "Exceptions" → Stacktrace completo
```

---

## 🔒 Segurança Importante

⚠️ **Configure a API Key corretamente:**

**Backend (.env):**
```env
DEVTOOLS_API_KEY=sua-chave-secreta-forte-aqui
```

**Agent (AppModule):**
```typescript
DevtoolsModule.forRoot({
  apiKey: process.env.DEVTOOLS_API_KEY, // Mesma chave!
})
```

⚠️ **NUNCA habilite em produção sem autenticação:**

```typescript
DevtoolsModule.forRoot({
  enabled: process.env.NODE_ENV !== 'production', // ← CRÍTICO!
})
```

---

## 🐛 Problemas Comuns

### "Connection refused" no agent

**Causa:** Backend não está rodando

**Solução:**
```bash
cd packages/backend
pnpm dev
```

### "API Key inválida"

**Causa:** API keys diferentes no agent e backend

**Solução:** Use a MESMA chave em ambos

### "Porta 4000 já em uso"

**Solução:** Altere a porta no backend:
```env
PORT=4001
```

E no agent:
```typescript
backendUrl: 'http://localhost:4001'
```

---

## 🎯 Checklist de Sucesso

- [ ] Backend rodando (`http://localhost:4000/api/health` retorna ok)
- [ ] Frontend rodando (`http://localhost:3000` abre o Dashboard)
- [ ] PostgreSQL conectado (sem erros no backend)
- [ ] Agent instalado na sua app
- [ ] API Key configurada corretamente
- [ ] Primeira requisição capturada ✨

---

## 💡 Dicas

1. **Use o Makefile para comandos rápidos:**
   ```bash
   make docker-up   # Sobe infra
   make dev         # Inicia tudo
   make clean       # Limpa builds
   ```

2. **Monitore logs:**
   ```bash
   make docker-logs  # Logs do Docker
   ```

3. **Development workflow:**
   - Terminal 1: Backend (`pnpm dev`)
   - Terminal 2: Frontend (`pnpm dev`)
   - Terminal 3: Sua app com o agent

---

## 🎉 Próximos Passos

1. ✅ Entenda a [arquitetura](./docs/architecture.md)
2. ✅ Configure [segurança](./docs/security.md) adequadamente
3. ✅ Explore [configurações avançadas](./docs/configuration.md)
4. ✅ Contribua! Veja [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📞 Suporte

- **Documentação:** [docs/](./docs/)
- **Issues:** GitHub Issues
- **Discussões:** GitHub Discussions
- **Email:** lucasbrito.wdt@gmail.com

---

**Divirta-se explorando sua aplicação NestJS! 🔭✨**

