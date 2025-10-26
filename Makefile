.PHONY: help install dev build clean docker-up docker-down docker-logs test lint format

# Help
help:
	@echo "🔭 Nest DevTools Telescope - Comandos disponíveis:"
	@echo ""
	@echo "  make install      - Instala dependências"
	@echo "  make dev          - Inicia desenvolvimento (todos os serviços)"
	@echo "  make build        - Build de produção"
	@echo "  make clean        - Limpa arquivos gerados"
	@echo "  make docker-up    - Sobe containers Docker"
	@echo "  make docker-down  - Para containers Docker"
	@echo "  make docker-logs  - Exibe logs dos containers"
	@echo "  make test         - Roda testes"
	@echo "  make lint         - Lint de código"
	@echo "  make format       - Formata código"
	@echo ""

# Instalar dependências
install:
	@echo "📦 Instalando dependências..."
	pnpm install

# Desenvolvimento
dev:
	@echo "🚀 Iniciando desenvolvimento..."
	pnpm dev

# Build
build:
	@echo "🔨 Building..."
	pnpm build

# Clean
clean:
	@echo "🧹 Limpando..."
	pnpm clean

# Docker
docker-up:
	@echo "🐳 Subindo containers..."
	docker-compose up -d

docker-down:
	@echo "🐳 Parando containers..."
	docker-compose down

docker-logs:
	@echo "📋 Logs dos containers..."
	docker-compose logs -f

# Test
test:
	@echo "🧪 Rodando testes..."
	pnpm test

# Lint
lint:
	@echo "🔍 Linting..."
	pnpm lint

# Format
format:
	@echo "💅 Formatando código..."
	pnpm format

