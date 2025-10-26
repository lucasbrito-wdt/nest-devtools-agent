# Build stage
FROM node:20-alpine AS builder

# Instala pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copia arquivos de dependências
COPY package.json pnpm-lock.yaml* ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/package.json ./packages/shared/

# Instala dependências
RUN pnpm install --frozen-lockfile

# Copia código fonte
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

# Build
WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/packages/backend
RUN pnpm build

# Production stage
FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

# Copia apenas o necessário
COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/package.json ./
COPY --from=builder /app/packages/backend/node_modules ./node_modules

EXPOSE 4000

CMD ["node", "dist/main.js"]

