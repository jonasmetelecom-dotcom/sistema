@echo off
echo 🚀 Iniciando Atualizacao Profunda do FTTX Manager (Windows)...

echo 🛑 Parando containers...
docker-compose down

echo 🧹 Limpando cache e imagens antigas...
docker system prune -f

echo 🏗️ Reconstruindo sistema (sem cache)...
docker-compose build --no-cache

echo 🆙 Subindo containers...
docker-compose up -d

echo ✅ Sistema atualizado e rodando!
docker-compose ps
pause
