@echo off
echo ====================================================
echo   Auto-deploy to GitHub Pages
echo ====================================================
echo.

echo [1/2] Saving and pushing changes to GitHub...
git add .
git commit -m "Auto deploy from bat file"
git push origin main

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error during deployment. Please check your internet connection or try again.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Success! Files sent to GitHub.
echo.
echo Your site will be updated in 1-2 minutes at:
echo https://marushchakvaleriy-alt.github.io/decor-rizdvo-site/
echo.
pause
