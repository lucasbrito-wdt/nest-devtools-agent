#!/bin/bash

# Script para configurar GitHub Secrets interativamente
# Requer: gh CLI (GitHub CLI)

set -e

echo "🔐 Configuração de GitHub Secrets"
echo "=================================="
echo ""
echo "Este script irá configurar todos os secrets necessários para CI/CD"
echo ""

# Verificar se gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) não está instalado!"
    echo "📥 Instale em: https://cli.github.com/"
    exit 1
fi

# Verificar autenticação
if ! gh auth status &> /dev/null; then
    echo "🔑 Fazendo login no GitHub..."
    gh auth login
fi

echo "✅ GitHub CLI configurado!"
echo ""

# Função para adicionar secret
add_secret() {
    local name=$1
    local description=$2
    local required=$3
    
    echo "📝 $name"
    echo "   $description"
    
    if [ "$required" == "required" ]; then
        echo "   ⚠️  OBRIGATÓRIO"
    else
        echo "   ℹ️  Opcional"
    fi
    
    read -p "   Digite o valor (enter para pular): " value
    
    if [ -n "$value" ]; then
        echo "$value" | gh secret set "$name"
        echo "   ✅ Secret '$name' configurado!"
    else
        echo "   ⏭️  Pulado"
    fi
    echo ""
}

echo "🌐 === NETLIFY (Backend) ==="
echo ""
add_secret "NETLIFY_AUTH_TOKEN" "Token de autenticação do Netlify (https://app.netlify.com/user/applications)" "required"
add_secret "NETLIFY_SITE_ID" "ID do site no Netlify (Dashboard → Settings → General)" "required"

echo "🚂 === RAILWAY (Frontend) ==="
echo ""
add_secret "RAILWAY_TOKEN" "Token de API do Railway (https://railway.app/account/tokens)" "required"
add_secret "RAILWAY_SERVICE_NAME" "Nome do serviço no Railway" "required"
add_secret "RAILWAY_URL" "URL do frontend (https://seu-projeto.up.railway.app)" "optional"

echo "🗄️  === SUPABASE (Database) ==="
echo ""
add_secret "SUPABASE_ACCESS_TOKEN" "Token de acesso Supabase (https://app.supabase.com/account/tokens)" "required"
add_secret "SUPABASE_PROJECT_REF" "Referência do projeto Supabase" "required"

echo "📦 === NPM (Package Publishing) ==="
echo ""
add_secret "NPM_TOKEN" "Token de autenticação npm (https://www.npmjs.com/settings/~/tokens)" "required"

echo "🔗 === URLs (Environment) ==="
echo ""
add_secret "VITE_API_URL" "URL da API do backend (https://seu-site.netlify.app/api)" "required"
add_secret "VITE_WS_URL" "URL do WebSocket (https://seu-site.netlify.app)" "required"

echo ""
echo "✨ Configuração concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Verifique os secrets em: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions"
echo "2. Configure variáveis de ambiente no Netlify"
echo "3. Configure variáveis de ambiente no Railway"
echo "4. Execute o primeiro workflow"
echo ""
echo "📚 Documentação completa: docs/github-setup.md"

