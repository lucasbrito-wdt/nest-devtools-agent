# Como Rodar Migrations no Supabase

## 📋 Visão Geral

Este guia explica as diferentes formas de executar migrações SQL no Supabase, tanto para desenvolvimento local quanto para produção.

## 🎯 Opções Disponíveis

1. **Via Supabase Dashboard** (Mais simples) ✅
2. **Via linha de comando (psql)**
3. **Via TypeORM CLI**
4. **Via script automatizado**

## Opção 1: Via Supabase Dashboard (Recomendado)

### 1.1 Acessar SQL Editor

1. Acesse [https://supabase.com](https://supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (sidebar esquerda)

### 1.2 Executar Migration

1. Clique em **New Query**
2. Cole o conteúdo do arquivo de migration:

```sql
-- Conteúdo de supabase/migrations/001_initial_schema.sql

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
```

3. Clique em **Run** ou pressione `Ctrl/Cmd + Enter`

### 1.3 Verificar

Após executar, verifique se as tabelas foram criadas:

1. **Database** → **Tables**
2. Você deve ver:
   - ✅ `events`
   - ✅ `projects`
   - ✅ `users`

## Opção 2: Via Linha de Comando (psql)

### 2.1 Obter Connection String

1. **Settings** → **Database**
2. Role até "Connection string"
3. Escolha "URI" (modo Transaction)
4. Copie a URL

### 2.2 Instalar psql

#### Windows

```powershell
# Via PostgreSQL installer
# https://www.postgresql.org/download/windows/
```

#### MacOS

```bash
brew install postgresql
```

#### Linux

```bash
sudo apt-get install postgresql-client
```

### 2.3 Executar Migration

```bash
# Conectar ao banco
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# OU executar diretamente
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  -f supabase/migrations/001_initial_schema.sql
```

### 2.4 Exemplo de Uso

```bash
# 1. Definir variáveis
export DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# 2. Executar migration
psql "$DATABASE_URL" -f supabase/migrations/001_initial_schema.sql

# 3. Verificar
psql "$DATABASE_URL" -c "\dt"
```

## Opção 3: Via TypeORM CLI

### 3.1 Criar Arquivo de Configuração

```bash
cd packages/backend
```

### 3.2 Gerar Migration

```bash
# Gerar migration automaticamente
npm run migration:generate -- src/migrations/InitialSchema

# Editar a migration gerada se necessário
```

### 3.3 Executar Migration Local

```bash
# Executar todas as migrations pendentes
npm run migration:run
```

### 3.4 Executar Migration no Supabase

Como o TypeORM CLI não suporta Connection Pooling diretamente, use:

```bash
# 1. Obter connection string do Supabase (modo Session)
export SUPABASE_DB_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"

# 2. Executar via psql
psql "$SUPABASE_DB_URL" -f src/migrations/*.js
```

## Opção 4: Script Automatizado (Recomendado)

### 4.1 Criar Script de Migration

```typescript:packages/backend/scripts/migrate.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente
config();

async function migrate() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: ['dist/**/*.entity.js'],
    migrations: ['src/migrations/*.ts'],
    logging: true,
    synchronize: false, // Sempre false em produção
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Executar migrations
    const results = await dataSource.runMigrations();
    console.log(`✅ Executed ${results.length} migrations`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
```

### 4.2 Adicionar Script ao package.json

```json:packages/backend/package.json
{
  "scripts": {
    "migrate": "ts-node scripts/migrate.ts",
    "migrate:run": "typeorm migration:run -d src/config/typeorm.config.ts",
    "migrate:revert": "typeorm migration:revert -d src/config/typeorm.config.ts",
    "migrate:generate": "typeorm migration:generate -d src/config/typeorm.config.ts"
  }
}
```

### 4.3 Executar

```bash
# Desenvolvimento local
npm run migrate

# Produção (Railway)
DATABASE_URL="..." npm run migrate
```

## 4. Verificar Migrations

### 4.1 Via SQL Editor

```sql
-- Ver histórico de migrations
SELECT * FROM typeorm_migrations;

-- Ver todas as tabelas
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver estrutura da tabela
\d events

-- Ver índices
\di
```

### 4.2 Via Dashboard

1. **Database** → **Tables**
2. Liste todas as tabelas
3. Verifique índices em cada tabela

## 5. Troubleshooting

### Erro: "relation already exists"

```sql
-- Solução: Dropar tabela existente (CUIDADO!)
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Depois executar migration novamente
```

### Erro: "permission denied"

```sql
-- Verificar permissões
\du

-- Dar permissões necessárias
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
```

### Erro: "extension uuid-ossp does not exist"

```sql
-- Instalar extensão
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar se foi instalada
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
```

## 6. Rollback

### 6.1 Dropar Tabelas

```sql
-- CUIDADO: Isso apaga todos os dados!
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

### 6.2 Via TypeORM

```bash
# Reverter última migration
npm run migration:revert
```

## 7. Seed Data (Dados Iniciais)

### 7.1 Criar Script de Seed

```typescript:packages/backend/scripts/seed.ts
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Project } from '../src/modules/projects/entities/project.entity';

config();

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: ['dist/**/*.entity.js'],
  });

  try {
    await dataSource.initialize();

    // Criar projeto padrão
    const projectRepo = dataSource.getRepository(Project);

    const defaultProject = projectRepo.create({
      name: 'Default Project',
      apiKey: 'dev-project-key-12345',
      active: true,
      retentionDays: 30,
    });

    await projectRepo.save(defaultProject);
    console.log('✅ Seed completed');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
```

### 7.2 Executar Seed

```bash
npm run seed
```

## 8. CI/CD Integration

### 8.1 Railway Deployment Hook

Criar migração automática no deploy:

```typescript:packages/backend/src/main.ts
import { DataSource } from 'typeorm';

async function bootstrap() {
  // Executar migrations antes de iniciar
  const dataSource = new DataSource({
    // ... config
  });

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();

  // Depois iniciar aplicação normalmente
  const app = await NestFactory.create(AppModule);
  // ...
}
```

### 8.2 GitHub Actions

```yaml:.github/workflows/deploy.yml
- name: Run migrations
  run: |
    npm run migrate
  env:
    DATABASE_URL: ${{ secrets.SUPABASE_DATABASE_URL }}
```

## 9. Variáveis de Ambiente

### 9.1 Local (.env)

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 9.2 Railway

```
Settings → Variables → Add:
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

## 10. Checklist de Migration

- [ ] Backup do banco (automatico no Supabase)
- [ ] Testar localmente primeiro
- [ ] Verificar sintaxe SQL
- [ ] Criar índices necessários
- [ ] Testar reversão (rollback)
- [ ] Documentar mudanças
- [ ] Executar em staging
- [ ] Executar em produção

## 11. Próximos Passos

- ✅ Executar migration inicial
- ⏳ Configurar schema do shared
- ⏳ Adicionar mais índices conforme necessidade
- ⏳ Configurar backups
- ⏳ Monitorar performance

## 📚 Recursos

- [Supabase SQL Editor](https://supabase.com/docs/guides/database/tables)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
