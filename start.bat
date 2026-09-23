@echo off
rem =====================================================================
rem  start.bat - abre o Rumo ao Júnior (e, se quiser, roda os testes)
rem
rem  Duplo clique: mostra um menu; se você não escolher nada, abre o app
rem  sozinho em 8 segundos.
rem
rem  Pelo terminal:
rem     start.bat app        abre o app (servidor local + navegador)
rem     start.bat testes     roda todos os testes automatizados (Playwright)
rem     start.bat ui         abre os testes no modo visual do Playwright
rem     start.bat relatorio  abre o relatório da última execução dos testes
rem     start.bat manual     abre o manual de uso (manual\index.html)
rem
rem  Opções (variáveis de ambiente, antes de rodar):
rem     set PORTA=3001         usa outra porta (padrão: 3000)
rem     set ABRIR_NAVEGADOR=0  não abre o navegador automaticamente
rem =====================================================================
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Rumo ao Júnior

if not defined PORTA set "PORTA=3000"
if not defined ABRIR_NAVEGADOR set "ABRIR_NAVEGADOR=1"
set "URL=http://localhost:%PORTA%"

rem O manual é uma página estática: abre mesmo sem o Node instalado.
set "OPCAO=%~1"
if /i "%OPCAO%"=="manual" goto manual

where node >nul 2>nul
if errorlevel 1 goto sem_node

if /i "%OPCAO%"=="app" goto app
if /i "%OPCAO%"=="testes" goto testes
if /i "%OPCAO%"=="ui" goto testes_ui
if /i "%OPCAO%"=="relatorio" goto relatorio
if not "%OPCAO%"=="" goto uso

:menu
echo.
echo   ==============================================
echo    Rumo ao Júnior - sistema de estudo
echo   ==============================================
echo.
echo    [1] Abrir o app no navegador (padrão)
echo    [2] Rodar os testes automatizados
echo    [3] Testes no modo visual (Playwright UI)
echo    [4] Abrir o relatório dos últimos testes
echo    [5] Abrir o manual de uso
echo.
choice /c 12345 /n /t 8 /d 1 /m "   Escolha de 1 a 5 (o app abre sozinho em 8 segundos): "
if errorlevel 255 goto app
if errorlevel 5 goto manual
if errorlevel 4 goto relatorio
if errorlevel 3 goto testes_ui
if errorlevel 2 goto testes
goto app

rem ---------------------------------------------------------------------
:app
rem O app já está rodando nesta porta? Então só abre o navegador.
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -TimeoutSec 2; if ($r.Content -match 'Rumo ao J') { exit 0 } else { exit 2 } } catch { exit 1 }"
if errorlevel 2 goto porta_ocupada
if errorlevel 1 goto iniciar_servidor
echo.
echo   O app já está rodando em %URL%
if "%ABRIR_NAVEGADOR%"=="1" start "" "%URL%"
ping -n 3 127.0.0.1 >nul
exit /b 0

:iniciar_servidor
echo.
echo   Iniciando o servidor local em %URL%
echo.
echo   - Deixe esta janela aberta enquanto estuda.
echo   - Para encerrar: feche a janela ou aperte Ctrl+C.
echo   - Use sempre este mesmo endereço: o progresso fica salvo por endereço.
echo.
rem Abre o navegador assim que o servidor responder (em segundo plano)
if "%ABRIR_NAVEGADOR%"=="1" start "" /min powershell -NoProfile -WindowStyle Hidden -Command "for ($i = 0; $i -lt 120; $i++) { try { Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -TimeoutSec 1 | Out-Null; Start-Process '%URL%'; break } catch { Start-Sleep -Milliseconds 500 } }"
rem Usa o "serve" já instalado pelos testes, se existir; senão, baixa com npx
if exist "testes\node_modules\.bin\serve.cmd" goto serve_local
call npx --yes serve -l %PORTA% --no-clipboard --no-port-switching .
goto servidor_parou
:serve_local
call "testes\node_modules\.bin\serve.cmd" -l %PORTA% --no-clipboard --no-port-switching .
:servidor_parou
echo.
echo   Servidor encerrado.
pause
exit /b 0

:porta_ocupada
echo.
echo   [ERRO] A porta %PORTA% já está sendo usada por outro programa.
echo   Feche esse programa ou escolha outra porta no terminal, por exemplo:
echo       set PORTA=3001
echo       .\start.bat
echo   Atenção: outro endereço guarda outro progresso. Use Exportar e Importar backup.
echo.
pause
exit /b 1

rem ---------------------------------------------------------------------
:testes
call :preparar_testes
if errorlevel 1 goto erro_instalacao
echo.
echo   Rodando os testes: desktop, celular e tema escuro. Leva uns 4 minutos.
echo.
pushd testes
call npx playwright test
set "RESULTADO=%errorlevel%"
popd
echo.
if "%RESULTADO%"=="0" goto testes_ok
echo   Alguns testes falharam. Para ver os detalhes: .\start.bat relatorio
echo.
pause
exit /b 1
:testes_ok
echo   Todos os testes passaram. Relatório completo: .\start.bat relatorio
echo   Capturas de tela de cada página: pasta testes\prints
echo.
pause
exit /b 0

:testes_ui
call :preparar_testes
if errorlevel 1 goto erro_instalacao
pushd testes
call npx playwright test --ui
popd
exit /b 0

:relatorio
if not exist "testes\relatorio\index.html" goto sem_relatorio
call :preparar_testes
if errorlevel 1 goto erro_instalacao
pushd testes
call npx playwright show-report relatorio
popd
exit /b 0

:sem_relatorio
echo.
echo   Ainda não há relatório. Rode os testes primeiro: .\start.bat testes
echo.
pause
exit /b 1

:preparar_testes
rem Instala as dependências dos testes só na primeira vez
if exist "testes\node_modules\@playwright\test\package.json" exit /b 0
echo.
echo   Instalando as dependências dos testes. Isso só acontece na primeira vez.
pushd testes
call npm install --no-audit --no-fund
set "R=%errorlevel%"
popd
exit /b %R%

:erro_instalacao
echo.
echo   [ERRO] Não foi possível instalar as dependências dos testes.
echo   Confira a conexão com a internet e tente de novo.
echo   Os testes usam o Google Chrome instalado no computador.
echo.
pause
exit /b 1

rem ---------------------------------------------------------------------
:manual
rem O manual é uma página estática: abre direto do disco, sem servidor.
if not exist "manual\index.html" goto sem_manual
echo.
echo   Abrindo o manual de uso no navegador...
start "" "%~dp0manual\index.html"
ping -n 2 127.0.0.1 >nul
exit /b 0

:sem_manual
echo.
echo   [ERRO] Não encontrei o arquivo manual\index.html nesta pasta.
echo.
pause
exit /b 1

rem ---------------------------------------------------------------------
:sem_node
echo.
echo   [ERRO] O Node.js não foi encontrado.
echo   Instale a versão LTS em https://nodejs.org/ e rode o start.bat de novo.
echo   Sem o Node, dá para abrir pelo VS Code com a extensão Live Server.
echo   O manual de uso abre sem o Node: dois cliques em manual.bat.
echo.
pause
exit /b 1

:uso
echo.
echo   Opção desconhecida: %OPCAO%
echo   Use: .\start.bat [app ^| testes ^| ui ^| relatorio ^| manual]
echo.
exit /b 1
