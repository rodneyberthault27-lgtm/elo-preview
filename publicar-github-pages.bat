@echo off
setlocal
cd /d "%~dp0"
set GH=gh
set REPO=rodneyberthault27-lgtm/elo-preview
set REMOTE=https://github.com/%REPO%.git

echo.
echo Publicando o Elo Preview no GitHub Pages...
echo Repositorio: %REPO%
echo.

where %GH% >nul 2>nul
if errorlevel 1 (
  echo GitHub CLI nao encontrado no PATH.
  echo Instale o GitHub CLI e rode este arquivo de novo.
  pause
  exit /b 1
)

"%GH%" auth status >nul 2>nul
if errorlevel 1 (
  echo Primeiro vamos entrar no GitHub.
  echo Uma pagina do GitHub sera aberta. Autorize a conta e volte aqui.
  "%GH%" auth login --hostname github.com --git-protocol https --web
  if errorlevel 1 (
    echo Nao foi possivel concluir o login.
    pause
    exit /b 1
  )
)

git remote remove origin >nul 2>nul
git remote add origin %REMOTE%
git branch -M main
git add .
git commit -m "Publish Elo Preview" >nul 2>nul
git push -u origin main
if errorlevel 1 (
  echo O envio falhou. Verifique se o repositorio %REPO% existe e se voce autorizou o login do GitHub.
  pause
  exit /b 1
)

"%GH%" api repos/%REPO%/pages -X POST -f source.branch=main -f source.path=/ >nul 2>nul
"%GH%" api repos/%REPO%/pages -X PUT -f source.branch=main -f source.path=/ >nul 2>nul

echo.
echo Pronto. O GitHub Pages pode levar alguns minutos para publicar.
echo Link:
echo https://rodneyberthault27-lgtm.github.io/elo-preview/
echo.
pause
