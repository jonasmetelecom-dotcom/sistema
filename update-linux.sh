#!/bin/bash

echo "🚀 Iniciando Atualização Profunda do FTTX Manager..."

# 1. Parar containers
echo "🛑 Parando containers..."
docker compose down

# 2. Limpar cache de build e imagens antigas do projeto
echo "🧹 Limpando cache e imagens antigas..."
docker system prune -f
docker image prune -af

# 3. Forçar rebuild sem cache
echo "🏗️ Reconstruindo sistema (sem cache)..."
docker compose build --no-cache

# 4. Subir sistema
echo "🆙 Subindo containers..."
docker compose up -d

echo "✅ Sistema atualizado e rodando!"
docker compose ps
