@echo off
echo ====================================================
echo   Deploying decor_rizdvo site to GitHub Pages
echo ====================================================
echo.

echo [1/2] Publishing "public" folder to GitHub Pages...
call npm run deploy

if %ERRORLEVEL% neq 0 (
    echo.
    echo Deployment failed. Please check the errors above.
    echo (If this is the first time - run setup.bat first)
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Deployment completed successfully!
echo Your site will appear (or update) in 1-2 minutes at:
echo https://marushchakvaleriy-alt.github.io/decor-rizdvo-site/
echo.
pause
