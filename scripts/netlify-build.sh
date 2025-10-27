#!/bin/bash
set -e

# Capturar diretório inicial
INITIAL_DIR=$(pwd)
echo "📍 Diretório inicial: $INITIAL_DIR"

# Navegar para a raiz do repositório procurando por package.json E pasta packages
while [ ! -f "package.json" ] || [ ! -d "packages" ]; do
  cd ..
  if [ "$PWD" = "/" ]; then
    echo "❌ Erro: não consegui encontrar a raiz do projeto"
    echo "PWD atual: $PWD"
    echo "Arquivos aqui: $(ls -la)"
    exit 1
  fi
done

ROOT_DIR=$(pwd)
echo "🏠 Diretório raiz encontrado: $ROOT_DIR"

echo "📦 Instalando dependências..."
bun install

echo "🔨 Buildando pacote shared..."
cd packages/shared
bun run build
cd ../..

echo "🎨 Buildando frontend..."
cd packages/frontend
bun run build
cd ../..

echo "✅ Build concluído!"

