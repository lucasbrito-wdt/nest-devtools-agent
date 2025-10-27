# 🚀 Como Rodar Migration

## ✅ Em Produção (Railway)

**As migrations rodam automaticamente!** 🎉

Quando você faz deploy, o backend:

1. Inicializa
2. Executa migrations automaticamente
3. Inicia a aplicação

**Você não precisa fazer nada!**

---

## 🔧 Em Desenvolvimento Local

### Opção 1: Via Prisma CLI (Recomendado) ⭐

```bash
cd packages/backend

# 1. Definir URL do banco
export DATABASE_URL="postgresql://postgres:[senha]@db.[ref].supabase.co:5432/postgres"

# 2. Executar migrations
npx prisma migrate deploy

# 3. Gerar Prisma Client
npx prisma generate
```

### Opção 2: Via Supabase Dashboard

1. Acesse [https://supabase.com](https://supabase.com)
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo de `packages/backend/prisma/migrations/*/migration.sql`
5. Clique em **Run**

### Opção 3: Via npm scripts

```bash
cd packages/backend

# Deploy migrations
npm run prisma:deploy

# Ou criar nova migration (dev)
npm run prisma:migrate
```

---

## 🧪 Testar Migration

### Verificar Tabelas

```sql
-- No Supabase SQL Editor
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Deve retornar:

```
events
projects
users
```

### Verificar Índices

```sql
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## ⚠️ Troubleshooting

### Erro: "relation already exists"

```sql
-- Limpar e recriar
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Execute migration novamente
```

### Erro: "extension uuid-ossp does not exist"

```sql
-- Instalar extensão
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Migration já foi executada?

**Tudo bem!** Prisma controla automaticamente quais migrations já foram aplicadas (tabela `_prisma_migrations`).

---

## 📋 Checklist

- [ ] Criar projeto no Supabase
- [ ] Obter `DATABASE_URL`
- [ ] Executar migration
- [ ] Verificar tabelas criadas
- [ ] Configurar variável `DATABASE_URL` no Railway
- [ ] Deploy (migrations rodam automaticamente)

---

## 🎯 Resumo

- **Produção**: `prisma migrate deploy` automático ✅
- **Desenvolvimento**: `npx prisma migrate deploy` ✅
- **Criar nova migration**: `npm run prisma:migrate` ✅

## 📚 Documentação

- [docs/prisma-guide.md](docs/prisma-guide.md) - Guia completo do Prisma
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
