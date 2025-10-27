# 🚀 Supabase Quick Start

## 3 Passos para Começar

### 1️⃣ Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Aguarde provisionamento (~2 minutos)

### 2️⃣ Executar Migration

#### Via Dashboard (Mais Simples) ✅

1. Vá em **SQL Editor** → **New Query**
2. Cole o conteúdo de `supabase/migrations/001_initial_schema.sql`
3. Clique em **Run** (Ctrl/Cmd + Enter)

#### Via Script (Automático)

```bash
# Definir URL do banco
export DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# Executar
./scripts/run-migration.sh

# Ou no Windows
.\scripts\run-migration.ps1
```

### 3️⃣ Configurar Variáveis

#### Railway

```
Dashboard → Variables → Raw Editor

DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

#### Local

Crie `.env` na raiz:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
PORT=4000
NODE_ENV=development
```

## ✅ Pronto!

Agora o backend está conectado ao Supabase.

## 📚 Próximos Passos

- [docs/supabase-setup.md](docs/supabase-setup.md) - Setup completo
- [docs/supabase-migrations.md](docs/supabase-migrations.md) - Como rodar migrations
- [docs/supabase-auth.md](docs/supabase-auth.md) - Autenticação
- [docs/supabase-webhooks.md](docs/supabase-webhooks.md) - Webhooks
- [docs/supabase-realtime.md](docs/supabase-realtime.md) - Real-time
- [docs/supabase-monitoring.md](docs/supabase-monitoring.md) - Monitoramento

## 🆘 Ajuda

- Erro de conexão? Verifique `DATABASE_URL`
- Tabelas não criadas? Execute migration novamente
- Mais detalhes? Consulte docs/

