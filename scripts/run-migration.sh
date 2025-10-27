#!/bin/bash

# Script para executar migrations no Supabase
# Uso: ./scripts/run-migration.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "${GREEN}🚀 Executando migration no Supabase...${NC}"

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
  echo "${RED}❌ Erro: DATABASE_URL não está definida${NC}"
  echo ""
  echo "Defina a variável de ambiente:"
  echo "export DATABASE_URL='postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres'"
  echo ""
  echo "OU use:"
  echo "DATABASE_URL='...' ./scripts/run-migration.sh"
  exit 1
fi

# Verificar se psql está instalado
if ! command -v psql &> /dev/null; then
  echo "${RED}❌ Erro: psql não está instalado${NC}"
  echo ""
  echo "Instale PostgreSQL client:"
  echo "- Windows: https://www.postgresql.org/download/windows/"
  echo "- MacOS: brew install postgresql"
  echo "- Linux: sudo apt-get install postgresql-client"
  exit 1
fi

# Arquivo de migration
MIGRATION_FILE="supabase/migrations/001_initial_schema.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "${RED}❌ Erro: Arquivo de migration não encontrado: $MIGRATION_FILE${NC}"
  exit 1
fi

echo "${YELLOW}📄 Migration file: $MIGRATION_FILE${NC}"
echo "${YELLOW}🔗 Database: ${DATABASE_URL%%@*}${NC}" # Esconde senha

# Executar migration
echo ""
echo "${YELLOW}Executando migration...${NC}"
psql "$DATABASE_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "${GREEN}✅ Migration executada com sucesso!${NC}"
  echo ""
  echo "Verificar tabelas criadas:"
  echo "psql \"$DATABASE_URL\" -c '\\dt'"
else
  echo ""
  echo "${RED}❌ Erro ao executar migration${NC}"
  exit 1
fi

