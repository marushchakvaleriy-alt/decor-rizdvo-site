@echo off
chcp 65001 >nul
echo ====================================================
echo   Публікація сайту decor_rizdvo на GitHub Pages
echo ====================================================
echo.

echo [1/3] Збереження змін у Git...
git add .
git commit -m "Оновлення сайту: додано AR-примірку через камеру" >nul 2>&1

echo [2/3] Відправка оновлень у гілку main...
git push origin main

echo [3/3] Публікація сайту на GitHub Pages...
call npm run deploy

if %ERRORLEVEL% neq 0 (
    echo.
    echo Не вдалося завершити публікацію.
    echo Якщо з'явилося вікно входу GitHub — підтвердіть авторизацію в браузері.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ====================================================
echo   Успішно опубліковано!
echo   Сайт оновиться за 1-2 хвилини за адресою:
echo   https://marushchakvaleriy-alt.github.io/decor-rizdvo-site/
echo ====================================================
pause
