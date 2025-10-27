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

# Copia o restante do código-fonte (incluindo schema.prisma)
COPY packages/shared packages/shared
COPY packages/backend packages/backend

# Instala todas as dependências
RUN bun install

# Gera Prisma Client
WORKDIR /app/packages/backend
RUN bunx prisma generate

# Build do pacote shared primeiro (dependência do backend)
WORKDIR /app/packages/shared
RUN bun run build

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

# Copia node_modules do builder (inclui @prisma/client e binários)
COPY --from=builder /app/node_modules ./node_modules

# Instala apenas dependências de produção
RUN bun install --production

# Gera Prisma Client antes de iniciar
WORKDIR /app/packages/backend
RUN ../../node_modules/.bin/prisma generate

# Expõe a porta da aplicação
EXPOSE 4000

# Executa migrations e inicia o app
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run dist/main.js"]
