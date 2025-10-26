# Build stage
FROM node:20-alpine AS builder

RUN npm install -g pnpm

WORKDIR /app

# Copia arquivos de dependências
COPY package.json pnpm-lock.yaml* ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/package.json ./packages/shared/

# Instala dependências
RUN pnpm install --frozen-lockfile

# Copia código fonte
COPY packages/frontend ./packages/frontend
COPY packages/shared ./packages/shared

# Build
WORKDIR /app/packages/shared
RUN pnpm build

WORKDIR /app/packages/frontend
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copia arquivos buildados
COPY --from=builder /app/packages/frontend/dist /usr/share/nginx/html

# Copia configuração do nginx
COPY packages/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

