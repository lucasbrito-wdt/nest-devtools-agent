# Script PowerShell para executar migrations no Supabase
# Uso: .\scripts\run-migration.ps1

# Cores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "🚀 Executando migration no Supabase..."

# Verificar se DATABASE_URL está definida
if (-not $env:DATABASE_URL) {
    Write-ColorOutput Red "❌ Erro: DATABASE_URL não está definida"
    Write-Host ""
    Write-Host "Defina a variável de ambiente:"
    Write-Host '$env:DATABASE_URL = "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"'
    Write-Host ""
    Write-Host "OU use:"
    Write-Host 'DATABASE_URL="..." .\scripts\run-migration.ps1'
    exit 1
}

# Verificar se psql está instalado
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Red "❌ Erro: psql não está instalado"
    Write-Host ""
    Write-Host "Instale PostgreSQL:"
    Write-Host "https://www.postgresql.org/download/windows/"
    exit 1
}

# Arquivo de migration
$MigrationFile = "supabase\migrations\001_initial_schema.sql"

if (-not (Test-Path $MigrationFile)) {
    Write-ColorOutput Red "❌ Erro: Arquivo de migration não encontrado: $MigrationFile"
    exit 1
}

Write-ColorOutput Yellow "📄 Migration file: $MigrationFile"
$dbUrl = $env:DATABASE_URL -replace ':[^@]*@', ':***@'
Write-ColorOutput Yellow "🔗 Database: $dbUrl"

# Executar migration
Write-Host ""
Write-ColorOutput Yellow "Executando migration..."
& psql $env:DATABASE_URL -f $MigrationFile

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-ColorOutput Green "✅ Migration executada com sucesso!"
    Write-Host ""
    Write-Host "Verificar tabelas criadas:"
    Write-Host "psql `"$env:DATABASE_URL`" -c '\dt'"
} else {
    Write-Host ""
    Write-ColorOutput Red "❌ Erro ao executar migration"
    exit 1
}

