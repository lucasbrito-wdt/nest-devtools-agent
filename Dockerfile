# ================================
# 🧱 STAGE 1 — Build
# ================================
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copia os manifests do monorepo
COPY package.json bun.lock* ./
COPY tsconfig.json ./

# Copia os manifests de cada pacote
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/

# Instala todas as dependências
RUN bun install

# Copia o restante do código-fonte
COPY packages/shared packages/shared
COPY packages/backend packages/backend

# Build dos pacotes necessários
WORKDIR /app
RUN bun run --filter '@nest-devtools/shared' build

# Gera Prisma Client
WORKDIR /app/packages/backend
RUN ../../node_modules/.bin/prisma generate

# Instala @nestjs/cli na raiz temporariamente para build
WORKDIR /app
RUN bun add -d @nestjs/cli

# Build do backend usando nest da raiz
WORKDIR /app/packages/backend
RUN ../../node_modules/.bin/nest build

# ================================
# 🚀 STAGE 2 — Production
# ================================
FROM oven/bun:1-alpine

WORKDIR /app

# Copia package.json da raiz
COPY --from=builder /app/package.json ./

# Copia estrutura completa do workspace para o bun resolver dependências
COPY --from=builder /app/packages ./packages

# Instala apenas dependências de produção
RUN bun install --production

# Volta o WORKDIR para o app principal (backend)
WORKDIR /app/packages/backend

# Expõe a porta da aplicação
EXPOSE 4000

# Inicia o app com Bun (migrations são executadas via prisma migrate deploy antes do start)
CMD ["sh", "-c", "cd /app/packages/backend && ../../node_modules/.bin/prisma migrate deploy && cd /app/packages/backend && bun run dist/main.js"]
