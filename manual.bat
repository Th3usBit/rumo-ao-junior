@echo off
rem =====================================================================
rem  manual.bat - abre o manual de uso do Rumo ao Júnior no navegador
rem
rem  Duplo clique e pronto. Não precisa de Node.js nem de servidor:
rem  o manual (manual\index.html) funciona direto do disco.
rem =====================================================================
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Manual do Rumo ao Júnior

if not exist "manual\index.html" goto sem_manual
echo.
echo   Abrindo o manual de uso no navegador...
start "" "%~dp0manual\index.html"
ping -n 2 127.0.0.1 >nul
exit /b 0

:sem_manual
echo.
echo   [ERRO] Não encontrei o arquivo manual\index.html nesta pasta.
echo   Confira se a pasta "manual" veio junto com o projeto.
echo.
pause
exit /b 1
