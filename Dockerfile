# ================================
# 🧱 STAGE 1 — Build
# ================================
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copia os manifests do monorepo
COPY package.json bun.lockb* ./
COPY tsconfig.json ./

# Copia os manifests de cada pacote
COPY packages/shared/package.json packages/shared/
COPY packages/backend/package.json packages/backend/

# Instala dependências
RUN bun install --frozen-lockfile

# Copia o restante do código-fonte
COPY packages/shared packages/shared
COPY packages/backend packages/backend

# Build dos pacotes necessários
WORKDIR /app
RUN bun run --filter '@nest-devtools/shared' build
RUN cd packages/backend && tsc

# ================================
# 🚀 STAGE 2 — Production
# ================================
FROM oven/bun:1-alpine

WORKDIR /app

# Copia package.json para instalar dependências de produção
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lockb ./

# Copia os artefatos compilados
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./package.json
COPY --from=builder /app/packages/shared/dist ./shared/dist
COPY --from=builder /app/packages/shared/package.json ./shared/package.json

# Instala apenas dependências de produção
RUN bun install --production --frozen-lockfile

# Expõe a porta da aplicação
EXPOSE 4000

# Inicia o app com Bun
CMD ["bun", "dist/main.js"]
