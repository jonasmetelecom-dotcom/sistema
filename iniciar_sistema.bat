@echo off
echo ========================================================
echo   INICIANDO SISTEMA FTTX (MODO PORTATIL)
echo ========================================================

:: 1. Navigate to project folder
cd /d "c:\SISTEMA DE PROJETOS DE FTTH"

:: 2. Start App (Frontend + Backend with SQLite)
echo.
echo [1/1] Iniciando Aplicacao...
echo O sistema usara um banco de dados local (arquivo).
echo Aguarde as mensagens "Nest Application successfully started".
echo.
npm run dev
pause
