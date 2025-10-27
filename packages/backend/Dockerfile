# Backend Dockerfile para Nest DevTools Telescope
# Build context: raiz do projeto

FROM node:25-alpine

# Instalar pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copiar manifestos do workspace
COPY package.json pnpm-workspace.yaml tsconfig.json ./

# Copiar manifestos dos pacotes necessários
COPY packages/shared/package.json packages/shared/package.json
COPY packages/backend/package.json packages/backend/package.json

# Instalar dependências (desenvolvimento para ter hot reload)
RUN pnpm install --frozen-lockfile

# Copiar código fonte dos pacotes necessários
COPY packages/shared packages/shared
COPY packages/backend/src packages/backend/src
COPY packages/backend/prisma packages/backend/prisma
COPY packages/backend/nest-cli.json packages/backend/nest-cli.json

# Construir shared primeiro (dependência do backend)
WORKDIR /app/packages/shared
RUN pnpm build

# Gerar Prisma Client e build do backend
WORKDIR /app/packages/backend
RUN pnpm prisma:generate
RUN pnpm build

# Expoe a porta
EXPOSE 4001

# Comando para desenvolvimento com hot reload
WORKDIR /app/packages/backend
CMD ["pnpm", "dev"]