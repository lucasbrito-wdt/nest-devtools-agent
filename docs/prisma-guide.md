# 🔷 Guia do Prisma

## 📋 Visão Geral

O backend agora usa **Prisma** como ORM em vez de TypeORM. Prisma oferece:

- ✅ Type-safety completo
- ✅ Migrations automáticas
- ✅ Geração automática de types
- ✅ Query builder intuitivo
- ✅ Melhor performance
- ✅ Studio visual para dados

## 🚀 Comandos Principais

### Desenvolvimento

```bash
cd packages/backend

# Gerar Prisma Client (após alterar schema)
npm run prisma:generate

# Criar nova migration
npm run prisma:migrate

# Abrir Prisma Studio (UI visual)
npm run prisma:studio

# Ver status das migrations
npx prisma migrate status
```

### Produção

```bash
# Deploy de migrations
npm run prisma:deploy

# Equivalente a:
npx prisma migrate deploy
```

## 📝 Schema

O schema do Prisma está em `packages/backend/prisma/schema.prisma`:

```prisma
model Project {
  id            String   @id @default(uuid())
  name          String
  apiKey        String   @unique
  // ...

  events Event[]
  users  User[]
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  role      UserRole @default(VIEWER)
  // ...

  project Project? @relation(fields: [projectId], references: [id])
}

model Event {
  id        String   @id @default(uuid())
  type      String
  payload   Json     @db.JsonB
  // ...

  project Project? @relation(fields: [projectId], references: [id])
}
```

## 🔧 Como Usar no Código

### Injetar Prisma Service

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MyService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.event.findMany();
  }
}
```

### Queries Básicas

```typescript
// Buscar todos
const events = await this.prisma.event.findMany();

// Buscar um
const event = await this.prisma.event.findUnique({
  where: { id: '...' },
});

// Criar
const newEvent = await this.prisma.event.create({
  data: {
    type: 'HTTP_REQUEST',
    payload: { method: 'GET' },
  },
});

// Atualizar
const updated = await this.prisma.event.update({
  where: { id: '...' },
  data: { status: 200 },
});

// Deletar
await this.prisma.event.delete({
  where: { id: '...' },
});
```

### Queries Avançadas

```typescript
// Com filtros e paginação
const events = await this.prisma.event.findMany({
  where: {
    type: 'HTTP_REQUEST',
    status: { gte: 400 },
    createdAt: {
      gte: new Date('2024-01-01'),
    },
  },
  skip: 0,
  take: 50,
  orderBy: { createdAt: 'desc' },
  include: { project: true }, // JOIN
});

// Agregações
const count = await this.prisma.event.count({
  where: { type: 'ERROR' },
});

const avg = await this.prisma.event.aggregate({
  _avg: { status: true },
});

// Group by
const grouped = await this.prisma.event.groupBy({
  by: ['type'],
  _count: { id: true },
});
```

### Transações

```typescript
await this.prisma.$transaction(async (tx) => {
  const project = await tx.project.create({
    data: { name: 'Test', apiKey: 'key' },
  });

  await tx.event.create({
    data: {
      type: 'LOG',
      payload: {},
      projectId: project.id,
    },
  });
});
```

## 🔄 Migrations

### Criar Nova Migration

1. Altere o `schema.prisma`
2. Execute:
   ```bash
   npm run prisma:migrate
   ```
3. Digite nome da migration
4. Prisma gera SQL automaticamente

### Estrutura de Migrations

```
packages/backend/prisma/migrations/
├── 20241027000000_initial_schema/
│   └── migration.sql
├── 20241027120000_add_user_avatar/
│   └── migration.sql
└── migration_lock.toml
```

### Reset Database (Dev apenas)

```bash
npx prisma migrate reset
```

⚠️ **Cuidado**: Apaga todos os dados!

## 🎨 Prisma Studio

Interface visual para visualizar/editar dados:

```bash
npm run prisma:studio
```

Abre em http://localhost:5555

## 🐳 Docker

No Dockerfile, as migrations são executadas automaticamente:

```dockerfile
CMD ["sh", "-c", "prisma migrate deploy && bun run dist/main.js"]
```

## 📊 Performance

### Índices

Definir índices no schema:

```prisma
model Event {
  // ...

  @@index([projectId])
  @@index([type])
  @@index([createdAt])
}
```

### Query Otimizada

```typescript
// Ruim: N+1 queries
const events = await this.prisma.event.findMany();
for (const event of events) {
  const project = await this.prisma.project.findUnique({
    where: { id: event.projectId },
  });
}

// Bom: 1 query com JOIN
const events = await this.prisma.event.findMany({
  include: { project: true },
});
```

## 🔍 Debugging

```typescript
// Log de queries
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

## 📚 Recursos

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma with NestJS](https://docs.nestjs.com/recipes/prisma)

## ✅ Checklist de Migração

- [x] Prisma instalado
- [x] Schema criado
- [x] PrismaModule criado
- [x] EventsService migrado
- [x] Migration inicial criada
- [x] Dockerfile atualizado
- [ ] IngestService migrado
- [ ] HealthModule migrado
- [ ] Outros módulos migrados
