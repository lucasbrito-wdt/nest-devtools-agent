# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Em Desenvolvimento
- WebSocket realtime updates completo
- Query tracing (TypeORM/Prisma)
- Export CSV/JSON
- Grafo de módulos (estático)

---

## [0.1.0] - 2025-01-24

### 🎉 Lançamento Inicial (MVP)

#### Adicionado

**Agent (`@nest-devtools/agent`):**
- ✅ Módulo NestJS plugável (`DevtoolsModule`)
- ✅ RequestInterceptor global para captura de requisições HTTP
- ✅ ExceptionFilter global para captura de exceções
- ✅ DevtoolsService com retry automático e buffer offline
- ✅ Sanitização de dados sensíveis (passwords, tokens, etc)
- ✅ Truncamento automático de payloads grandes
- ✅ Configuração via forRoot/forRootAsync
- ✅ Fail-silent: nunca quebra a aplicação

**Backend (`@nest-devtools/backend`):**
- ✅ API NestJS com TypeORM + PostgreSQL
- ✅ Endpoint POST /ingest com autenticação por API key
- ✅ Endpoint GET /events com filtros avançados
- ✅ Endpoint GET /events/:id para detalhes
- ✅ Endpoint GET /events/stats/summary para estatísticas
- ✅ Endpoint GET /health para health check
- ✅ Rate limiting (100 req/min configurável)
- ✅ CORS configurável
- ✅ WebSocket gateway (base implementada)
- ✅ Schema PostgreSQL otimizado com índices
- ✅ Função SQL para cleanup de eventos antigos

**Frontend (`@nest-devtools/frontend`):**
- ✅ SPA React com Vite
- ✅ Página Dashboard com estatísticas gerais
- ✅ Página Requests com tabela, busca e filtros
- ✅ Página Request Detail com visualização completa
- ✅ Página Exceptions com stacktraces
- ✅ Página Logs com timeline
- ✅ Dark mode com persistência
- ✅ Design moderno com TailwindCSS
- ✅ Ícones Tabler
- ✅ TanStack Query para data fetching
- ✅ Paginação
- ✅ Responsive design

**Shared (`@nest-devtools/shared`):**
- ✅ Tipos TypeScript compartilhados
- ✅ Enums de eventos
- ✅ Interfaces de configuração
- ✅ Tipos de API

**Infraestrutura:**
- ✅ Monorepo com pnpm workspaces
- ✅ Docker Compose para dev (PostgreSQL + Redis)
- ✅ Dockerfiles para backend e frontend
- ✅ Script init.sql para inicialização do banco
- ✅ Makefile com comandos úteis
- ✅ .dockerignore e .gitignore configurados

**Documentação:**
- ✅ README principal completo
- ✅ README de cada pacote
- ✅ docs/architecture.md - Arquitetura detalhada
- ✅ docs/security.md - Guia de segurança (CRÍTICO)
- ✅ docs/quick-start.md - Início rápido (5 minutos)
- ✅ docs/api.md - Referência completa da API
- ✅ docs/configuration.md - Configurações avançadas

#### Segurança
- ✅ Autenticação por API key
- ✅ Sanitização automática de campos sensíveis
- ✅ Rate limiting
- ✅ CORS configurável
- ✅ Input validation com class-validator
- ✅ Feature flag para desabilitar em produção

#### Performance
- ✅ Índices otimizados no PostgreSQL
- ✅ JSONB para payloads flexíveis
- ✅ Paginação eficiente
- ✅ Retry com exponential backoff
- ✅ Buffer local no agent

---

## Roadmap

### [0.2.0] - Q1 2025 (Planejado)

**Features:**
- [ ] Query tracing para TypeORM
- [ ] Query tracing para Prisma
- [ ] WebSocket realtime completo (emit on ingest)
- [ ] Export de eventos para CSV
- [ ] Export de eventos para JSON
- [ ] Grafo de módulos (análise estática)
- [ ] Logger transport customizado

**Melhorias:**
- [ ] Cache Redis implementado
- [ ] Cursor-based pagination
- [ ] Busca full-text otimizada

### [0.3.0] - Q2 2025 (Planejado)

**Features:**
- [ ] Jobs/Queues tracing (Bull)
- [ ] Métricas e charts (latência, throughput)
- [ ] Replay de requests
- [ ] Timeline visual de requests
- [ ] Comparação de payloads

**Integrações:**
- [ ] Sentry
- [ ] Grafana
- [ ] Slack notifications

### [1.0.0] - Q3 2025 (Planejado)

**Features:**
- [ ] Multi-project support
- [ ] RBAC (roles e permissões)
- [ ] OAuth/SSO authentication
- [ ] Hosted version (SaaS)
- [ ] Alerts configuráveis
- [ ] Webhooks

**Enterprise:**
- [ ] Multi-tenancy
- [ ] Audit logs
- [ ] Data residency
- [ ] SLA monitoring

---

## Convenções de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — Nova feature
- `fix:` — Bug fix
- `docs:` — Mudanças na documentação
- `style:` — Formatação, missing semi colons, etc
- `refactor:` — Refatoração de código
- `test:` — Adição ou correção de testes
- `chore:` — Manutenção, configs, etc
- `perf:` — Performance improvements
- `security:` — Correções de segurança

---

## Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para detalhes.

---

**Mantenedores:** Lucas & Team

**Licença:** MIT

