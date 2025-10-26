# ================================
# 🧱 STAGE 1 — Build
# ================================
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copia os manifests do monorepo
COPY package.json bun.lockb* ./

# Copia os manifests de cada pacote
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/

# Instala dependências
RUN bun install --frozen-lockfile

# Copia o restante do código-fonte
COPY packages/shared packages/shared
COPY packages/backend packages/backend

# Build dos pacotes necessários
WORKDIR /app/packages/shared
RUN bun run build

WORKDIR /app/packages/backend
RUN bun run build

# ================================
# 🚀 STAGE 2 — Production
# ================================
FROM oven/bun:1-alpine

WORKDIR /app

# Copia apenas os artefatos necessários
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./
COPY --from=builder /app/packages/shared/dist ../shared/dist

# Copia os node_modules do builder
COPY --from=builder /app/node_modules ./node_modules

# Expõe a porta da aplicação
EXPOSE 4000

# Inicia o app com Node.js (NestJS precisa do Node runtime)
CMD ["node", "dist/main.js"]
