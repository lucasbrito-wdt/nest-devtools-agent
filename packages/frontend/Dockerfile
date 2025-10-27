# Frontend Dockerfile para Nest DevTools Telescope
# Build context: raiz do projeto
# Usando Bun como package manager

FROM oven/bun:1-alpine

WORKDIR /app

# Copiar manifestos do workspace
COPY package.json bun.lock ./
COPY tsconfig.json ./

# Copiar package.json de todos os pacotes necessários
COPY packages/shared/package.json packages/shared/package.json
COPY packages/frontend/package.json packages/frontend/package.json

# Instalar dependências
RUN bun install

# Copiar código fonte completo dos pacotes necessários
COPY packages/shared packages/shared
COPY packages/frontend packages/frontend

# Construir shared primeiro
WORKDIR /app/packages/shared
RUN bun run build

# Expor a porta
EXPOSE 3000

# Comando para desenvolvimento com hot reload
WORKDIR /app/packages/frontend
CMD ["bun", "dev"]