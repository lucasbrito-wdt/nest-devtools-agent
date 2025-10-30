# Backend Dockerfile para Nest DevTools Telescope
# Build context: raiz do projeto
# Usando Bun como package manager

FROM oven/bun:1-alpine

WORKDIR /app

# Copiar manifestos do workspace
COPY package.json bun.lock ./
COPY tsconfig.json ./

# Copiar package.json de todos os pacotes necessários
COPY packages/shared/package.json packages/shared/package.json
COPY packages/backend/package.json packages/backend/package.json
COPY packages/agent/package.json packages/agent/package.json

# Instalar dependências
RUN bun install

# Copiar código fonte completo dos pacotes necessários
COPY packages/shared packages/shared
COPY packages/backend packages/backend

# Construir shared primeiro (dependência do backend)
# Instalar dependências localmente no shared para garantir que typescript esteja disponível
WORKDIR /app/packages/shared
RUN bun install
RUN bun run build

# Gerar Prisma Client e build do backend
WORKDIR /app/packages/backend
RUN bun install
RUN bunx prisma generate
RUN bun run build

# Expor a porta
EXPOSE 4001

# Comando para desenvolvimento com hot reload
WORKDIR /app/packages/backend
CMD ["bun", "run", "dev"]