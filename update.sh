#!/bin/bash

echo "========================================================"
echo "     SaaS FTTX Manager - Sistema de Atualizacao"
echo "========================================================"
echo ""

# Check if we are inside Docker
if [ -f /.dockerenv ]; then
    echo "[AVISO] Voce esta rodando dentro de um container Docker."
    echo "Para atualizar corretamente, rode 'git pull' e 'docker compose up -d --build' no seu servidor (VMware)."
    exit 1
fi

echo "[1/4] Verificando novos arquivos (Git Pull)..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao baixar atualizacoes."
    exit 1
fi

echo ""
echo "[2/4] Atualizando Servidor (Backend)..."
cd server && npm install && npm run build && cd ..

echo ""
echo "[3/4] Atualizando Interface (Frontend)..."
cd client && npm install && npm run build && cd ..

echo ""
echo "[4/4] Finalizando..."
echo "========================================================"
echo "   ATUALIZACAO CONCLUIDA COM SUCESSO!"
echo "========================================================"
echo ""
echo "Por favor, reinicie o sistema para aplicar."
