@echo off
setlocal
cd /d "%~dp0"

set PYTHON=C:\Users\ELO\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe
set PORT=5500

if not exist "%PYTHON%" (
  echo Python local do Codex nao encontrado:
  echo %PYTHON%
  echo.
  echo Instale o Python ou rode manualmente:
  echo python -m http.server %PORT% --bind 127.0.0.1
  pause
  exit /b 1
)

echo Servidor local iniciado.
echo Abra no navegador: http://127.0.0.1:%PORT%/
echo.
echo Para parar o servidor, feche esta janela.
echo.
"%PYTHON%" -m http.server %PORT% --bind 127.0.0.1
