# Script de Deploy para Netlify
# Execute este script para fazer deploy do frontend

Write-Host "🚀 Iniciando deploy para Netlify..." -ForegroundColor Green

# Verifica se está no diretório correto
$currentDir = Get-Location
Write-Host "📁 Diretório atual: $currentDir" -ForegroundColor Cyan

# Verifica se o diretório dist existe
if (-not (Test-Path "packages/frontend/dist")) {
    Write-Host "❌ Erro: O diretório packages/frontend/dist não existe!" -ForegroundColor Red
    Write-Host "🔧 Fazendo build..." -ForegroundColor Yellow
    
    # Build shared
    Write-Host "📦 Buildando pacote shared..." -ForegroundColor Cyan
    pnpm --filter @nest-devtools/shared build
    
    # Build frontend
    Write-Host "📦 Buildando frontend..." -ForegroundColor Cyan
    pnpm --filter @nest-devtools/frontend build
}

# Verifica se o build foi bem-sucedido
if (Test-Path "packages/frontend/dist/index.html") {
    Write-Host "✅ Build encontrado com sucesso!" -ForegroundColor Green
    
    Write-Host "`n⚠️  IMPORTANTE:" -ForegroundColor Yellow
    Write-Host "Quando o Netlify perguntar qual projeto selecionar:" -ForegroundColor Yellow
    Write-Host "   1. Use as setas ↓ para navegar" -ForegroundColor White
    Write-Host "   2. Selecione: @nest-devtools/frontend" -ForegroundColor White
    Write-Host "   3. Pressione ENTER" -ForegroundColor White
    Write-Host "`nIniciando deploy..." -ForegroundColor Cyan
    
    # Executa o deploy
    netlify deploy --prod --dir=packages/frontend/dist
} else {
    Write-Host "❌ Erro: Arquivo index.html não encontrado no build!" -ForegroundColor Red
    Write-Host "Execute o build manualmente com:" -ForegroundColor Yellow
    Write-Host "   pnpm --filter @nest-devtools/shared build" -ForegroundColor Cyan
    Write-Host "   pnpm --filter @nest-devtools/frontend build" -ForegroundColor Cyan
}

