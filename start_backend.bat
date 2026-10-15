@echo off
echo ==========================================
echo   Spousteni PHP API serveru na portu 8000
echo ==========================================

if exist "C:\xampp\php\php.exe" (
    "C:\xampp\php\php.exe" -S localhost:8000 -t .
) else (
    php -S localhost:8000 -t .
)
pause
