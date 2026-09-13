@echo off
echo ====================================================
echo   One-time setup: decor_rizdvo site auto-deploy
echo ====================================================
echo.

echo [1/4] Checking Git...
git --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo Git is not installed on this computer.
    echo Install it from: https://git-scm.com/download/win
    echo After installing, run this file again.
    pause
    exit /b 1
)

echo [2/4] Checking Node.js / npm...
call npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo Node.js is not installed on this computer.
    echo Install it from: https://nodejs.org  (LTS button)
    echo After installing, run this file again.
    pause
    exit /b 1
)

echo [3/4] Initializing git repository (if not already done)...
if not exist .git (
    git init
    git branch -M main
)

git remote get-url origin >nul 2>&1
if %ERRORLEVEL% neq 0 (
    git remote add origin https://github.com/marushchakvaleriy-alt/decor-rizdvo-site.git
    echo Remote added: https://github.com/marushchakvaleriy-alt/decor-rizdvo-site.git
) else (
    echo Remote "origin" is already set up.
)

echo [4/4] Installing npm packages (gh-pages)...
call npm install

echo.
echo ====================================================
echo   Done! To publish changes from now on, just
echo   double-click deploy.bat
echo ====================================================
pause
