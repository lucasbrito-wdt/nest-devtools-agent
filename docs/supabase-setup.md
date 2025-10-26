# Configuração do Supabase no Backend

## 📋 Visão Geral

Este guia explica como configurar o backend para usar o Supabase como banco de dados PostgreSQL gerenciado.

## 🎯 Objetivos

1. Criar projeto no Supabase
2. Configurar variáveis de ambiente
3. Ajustar migrações do TypeORM
4. Conectar o backend ao Supabase

## 1. Criar Projeto no Supabase

### 1.1 Acesse o Supabase

1. Vá para [https://supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"

### 1.2 Configurações do Projeto

- **Name**: `nest-devtools`
- **Database Password**: Gere uma senha forte e salve em local seguro
- **Region**: Escolha a região mais próxima
- **Plan**: Free tier é suficiente para começar

Clique em "Create new project"

## 2. Obter Credenciais

### 2.1 Database URL

1. No dashboard do Supabase, vá em **Settings** → **Database**
2. Role até "Connection string"
3. Selecione "Connection pooling" (modo Transaction)
4. Copie a URL que começa com `postgresql://`

Exemplo:
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 2.2 Anon Key e Service Role Key

1. Vá em **Settings** → **API**
2. Copie:
   - **anon public** key
   - **service_role** key (⚠️ Nunca exponha em client-side)

## 3. Configurar Variáveis de Ambiente

### 3.1 Arquivo `.env` (Desenvolvimento Local)

Crie um arquivo `.env` na raiz do projeto:

```env
# Database - Supabase
DATABASE_URL=postgresql://postgres:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Supabase API
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[anon-public-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Application
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT=100
```

### 3.2 Railway (Produção)

1. Acesse o dashboard do Railway
2. Vá em **Variables** → **Raw Editor**
3. Adicione as variáveis:

```env
DATABASE_URL=postgresql://postgres:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[anon-public-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
PORT=4000
NODE_ENV=production
CORS_ORIGINS=https://seu-frontend.netlify.app
RATE_LIMIT=100
```

## 4. Ajustar Configuração do TypeORM

### 4.1 Atualizar `typeorm.config.ts`

O arquivo já está configurado para usar `DATABASE_URL`:

```typescript:packages/backend/src/config/typeorm.config.ts
// ... existing code ...
```

✅ Está correto! A configuração já usa:
- `url`: `DATABASE_URL` da variável de ambiente
- `synchronize`: false em produção
- `migrations`: prontas para uso

### 4.2 Executar Migrações

Execute as migrações do Supabase no seu projeto:

```bash
# Via Supabase Dashboard
# Settings → Database → SQL Editor
```

Execute o conteúdo de `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    api_key TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    retention_days INT DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'viewer',
    project_id UUID REFERENCES projects(id),
    active BOOLEAN DEFAULT true,
    oauth_provider TEXT,
    oauth_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id),
    type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    route VARCHAR(500),
    status INT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_project_id ON events(project_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_route ON events(route);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_events_payload_gin ON events USING GIN(payload);

-- RLS (Row Level Security) - Opcional
-- Descomente se quiser usar RLS do Supabase
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

## 5. Ajustar Entidades TypeORM

### 5.1 Verificar Mapeamento

As entidades já estão corretamente configuradas:

✅ `User` entity → `users` table
✅ `Event` entity → `events` table  
✅ `Project` entity → `projects` table

### 5.2 Adicionar Referência de Project em Event

A entidade `Event` precisa incluir `projectId`. Vamos adicionar:

```typescript:packages/backend/src/modules/events/entities/event.entity.ts
// ... existing code ...

export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'project_id', nullable: true })
  projectId?: string;

  @Column({
    type: 'enum',
    enum: EventType,
  })
  type!: EventType;

  // ... existing code ...
}
```

## 6. Testar Conexão

### 6.1 Teste Local

```bash
cd packages/backend
npm run dev
```

Deve conectar ao Supabase sem erros.

### 6.2 Deploy no Railway

1. Commit e push das mudanças
2. Railway vai fazer deploy automaticamente
3. Verifique os logs para confirmar conexão

## 7. Configurar Row Level Security (RLS)

### 7.1 Habilitar RLS (Opcional)

Se quiser usar autenticação nativa do Supabase:

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem eventos do seu projeto
CREATE POLICY "Users can view their project events"
  ON events FOR SELECT
  USING (project_id IN (
    SELECT project_id FROM users WHERE id = auth.uid()
  ));

-- Policy: Admins veem tudo
CREATE POLICY "Admins can view all events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## 8. Monitoramento

### 8.1 Supabase Dashboard

- **Database** → Logs de queries
- **API** → Uso de requisições
- **Auth** → Usuários (se usar auth do Supabase)

### 8.2 Railway Logs

```bash
railway logs
```

## 9. Backup e Restauração

### 9.1 Backup do Supabase

1. Dashboard → Database → Backups
2. Backups automáticos diários no Free tier
3. Download manual disponível

### 9.2 Restaurar Backup

```bash
# No Supabase Dashboard
Settings → Database → Database Settings → Restore from backup
```

## 10. Troubleshooting

### Erro: "Connection refused"

✅ Verifique:
- URL de conexão está correta?
- Senha está correta?
- Firewall/Security do Supabase permite seu IP?

### Erro: "Table doesn't exist"

✅ Verifique:
- Migrações foram executadas?
- Schema correto está sendo usado?

### Erro: "Invalid enum type"

✅ Verifique:
- Criar enum manualmente no PostgreSQL
- Ou usar TEXT com constraint

## 11. Próximos Passos

1. ✅ Backend conectado ao Supabase
2. ⏳ Configurar autenticação (se necessário)
3. ⏳ Configurar webhooks do Supabase
4. ⏳ Configurar real-time subscriptions
5. ⏳ Monitorar performance e custos

## 📚 Recursos

- [Documentação Supabase](https://supabase.com/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [Railway Docs](https://docs.railway.app/)

