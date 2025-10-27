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

### Opção 1: Via Supabase Dashboard (Mais Simples) ⭐

1. Acesse [https://supabase.com](https://supabase.com)
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
5. Clique em **Run**

**Pronto!** Tabelas criadas.

### Opção 2: Via Script Automatizado

```bash
# 1. Definir URL do banco Supabase
export DATABASE_URL="postgresql://postgres:[senha]@db.[ref].supabase.co:5432/postgres"

# 2. Executar
./scripts/run-migration.sh

# Windows PowerShell
.\scripts\run-migration.ps1
```

### Opção 3: Via psql Direto

```bash
# Execute o SQL diretamente
psql "$DATABASE_URL" -f supabase/migrations/001_initial_schema.sql
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

**Tudo bem!** A migration tem `IF NOT EXISTS`, então é idempotente (segura rodar múltiplas vezes).

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

- **Produção**: Migrations automáticas ✅
- **Desenvolvimento**: Usar Dashboard ou Script ✅
