@echo off
TITLE SaaS FTTX Manager - Atualizacao
color 0A

echo ========================================================
echo      SaaS FTTX Manager - Sistema de Atualizacao
echo ========================================================
echo.
echo [1/4] Verificando novos arquivos (Git Pull)...
git pull origin main
IF %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao baixar atualizacoes. Verifique sua internet ou conflitos.
    pause
    exit /b
)

echo.
echo [2/4] Atualizando Servidor (Backend)...
cd server
call npm install
call npm run build
cd ..

echo.
echo [3/4] Atualizando Interface (Frontend)...
cd client
call npm install
call npm run build
cd ..

echo.
echo [4/4] Finalizando...
echo.
echo ========================================================
echo   ATUALIZACAO CONCLUIDA COM SUCESSO!
echo ========================================================
echo.
echo Por favor, reinicie o servidor para aplicar as alteracoes.
echo Se estiver usando PM2: pm2 restart all
echo Se estiver rodando manualmente: Feche e abra novamente os terminais.
echo.
pause
