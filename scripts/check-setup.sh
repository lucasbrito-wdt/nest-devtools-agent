#!/bin/bash

# Script para verificar se tudo está configurado corretamente

set -e

echo "🔍 Verificação de Configuração CI/CD"
echo "====================================="
echo ""

errors=0
warnings=0

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funções auxiliares
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅${NC} $1 instalado"
        return 0
    else
        echo -e "${RED}❌${NC} $1 NÃO instalado"
        ((errors++))
        return 1
    fi
}

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 existe"
        return 0
    else
        echo -e "${RED}❌${NC} $1 NÃO existe"
        ((errors++))
        return 1
    fi
}

check_directory() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1 existe"
        return 0
    else
        echo -e "${RED}❌${NC} $1 NÃO existe"
        ((errors++))
        return 1
    fi
}

check_secret() {
    if gh secret list | grep -q "$1"; then
        echo -e "${GREEN}✅${NC} Secret $1 configurado"
        return 0
    else
        echo -e "${YELLOW}⚠️${NC}  Secret $1 NÃO configurado"
        ((warnings++))
        return 1
    fi
}

# 1. Verificar dependências
echo "📦 === Dependências ==="
echo ""
check_command "node"
check_command "pnpm"
check_command "git"
check_command "gh"
check_command "docker"
check_command "docker-compose"
echo ""

# 2. Verificar estrutura de arquivos
echo "📁 === Estrutura de Arquivos ==="
echo ""
check_file "package.json"
check_file "pnpm-workspace.yaml"
check_file "docker-compose.yml"
check_file ".github/workflows/ci.yml"
check_file ".github/workflows/deploy-backend.yml"
check_file ".github/workflows/deploy-frontend.yml"
check_file ".github/workflows/deploy-supabase.yml"
check_file ".github/workflows/publish-agent.yml"
check_file ".npmrc"
check_file ".npmignore"
echo ""

# 3. Verificar pacotes
echo "📦 === Pacotes ==="
echo ""
check_directory "packages/agent"
check_directory "packages/backend"
check_directory "packages/frontend"
check_directory "packages/shared"
check_file "packages/agent/package.json"
check_file "packages/backend/package.json"
check_file "packages/frontend/package.json"
check_file "packages/shared/package.json"
echo ""

# 4. Verificar documentação
echo "📚 === Documentação ==="
echo ""
check_file "README.md"
check_file "PUBLISHING.md"
check_file "docs/github-setup.md"
check_file "docs/deployment.md"
echo ""

# 5. Verificar GitHub Secrets (se gh CLI estiver instalado e autenticado)
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    echo "🔐 === GitHub Secrets ==="
    echo ""
    check_secret "NETLIFY_AUTH_TOKEN"
    check_secret "NETLIFY_SITE_ID"
    check_secret "RAILWAY_TOKEN"
    check_secret "RAILWAY_SERVICE_NAME"
    check_secret "SUPABASE_ACCESS_TOKEN"
    check_secret "SUPABASE_PROJECT_REF"
    check_secret "NPM_TOKEN"
    check_secret "VITE_API_URL"
    check_secret "VITE_WS_URL"
    echo ""
else
    echo -e "${YELLOW}⚠️${NC}  Pulando verificação de secrets (gh CLI não autenticado)"
    echo ""
fi

# 6. Verificar builds
echo "🏗️  === Build Test ==="
echo ""
if pnpm install --frozen-lockfile &> /dev/null; then
    echo -e "${GREEN}✅${NC} pnpm install executado com sucesso"
else
    echo -e "${RED}❌${NC} pnpm install falhou"
    ((errors++))
fi

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅${NC} node_modules existe"
else
    echo -e "${RED}❌${NC} node_modules NÃO existe"
    ((errors++))
fi
echo ""

# 7. Verificar Git
echo "📝 === Git ==="
echo ""
if git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Git repository inicializado"
    
    remote=$(git remote get-url origin 2>/dev/null || echo "")
    if [ -n "$remote" ]; then
        echo -e "${GREEN}✅${NC} Remote origin configurado: $remote"
    else
        echo -e "${YELLOW}⚠️${NC}  Remote origin NÃO configurado"
        ((warnings++))
    fi
else
    echo -e "${RED}❌${NC} Git repository NÃO inicializado"
    ((errors++))
fi
echo ""

# Resumo
echo "================================="
echo ""
if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
    echo -e "${GREEN}✨ Tudo configurado corretamente!${NC}"
    echo ""
    echo "🚀 Próximos passos:"
    echo "1. git add ."
    echo "2. git commit -m 'ci: configure GitHub Actions'"
    echo "3. git push origin main"
    exit 0
elif [ $errors -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Configuração OK, mas com $warnings avisos${NC}"
    echo ""
    echo "Revise os avisos acima antes de continuar."
    exit 0
else
    echo -e "${RED}❌ Encontrados $errors erros e $warnings avisos${NC}"
    echo ""
    echo "Corrija os erros antes de continuar."
    echo "📚 Consulte: docs/github-setup.md"
    exit 1
fi

