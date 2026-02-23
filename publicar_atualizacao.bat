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

echo [1/3] Verificando Git...
set "GIT_EXE=git"
where %GIT_EXE% >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\Git\bin\git.exe" (
        set "GIT_EXE=C:\Program Files\Git\bin\git.exe"
    ) else if exist "C:\Program Files (x86)\Git\bin\git.exe" (
        set "GIT_EXE=C:\Program Files (x86)\Git\bin\git.exe"
    ) else (
        echo [ERRO] Git nao encontrado! Por favor, instale o Git ou fale com o suporte.
        pause
        exit /b
    )
)

echo.
echo [2/3] Adicionando arquivos...
"%GIT_EXE%" add .

echo.
echo [3/3] Registrando versao (Commit)...
"%GIT_EXE%" commit -m "%msg%"

echo.
echo [4/4] Enviando para a nuvem (Push)...
"%GIT_EXE%" push origin main

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
