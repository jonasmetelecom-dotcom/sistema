@echo off
TITLE SaaS FTTX Manager - Publicar Atualizacao
color 0B

echo ========================================================
echo      SaaS FTTX Manager - Publicador de Versao
echo ========================================================
echo.
echo Este script vai enviar suas alteracoes para a nuvem.
echo O sistema dos clientes vai detectar essa nova versao.
echo.

set /p msg="Digite uma descricao curta da atualizacao (ex: Corrigido bug no mapa): "

if "%msg%"=="" (
    echo [ERRO] A descricao e obrigatoria!
    pause
    exit /b
)

echo.
echo [1/3] Adicionando arquivos...
git add .

echo.
echo [2/3] Registrando versao (Commit)...
git commit -m "%msg%"

echo.
echo [3/3] Enviando para a nuvem (Push)...
git push origin main

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo      SUCESSO! A ATUALIZACAO FOI PUBLICADA.
    echo ========================================================
    echo.
    echo Agora os clientes receberao o aviso de nova versao.
) ELSE (
    echo.
    echo [ERRO] Falha ao enviar. Verifique sua conexao ou permissoes.
)

pause
