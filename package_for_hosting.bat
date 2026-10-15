@echo off
echo ======================================================
echo   Priprava balicku pro webovy hosting (dist_hosting)
echo ======================================================

cd frontend
call npm run build
cd ..

if exist dist_hosting rmdir /s /q dist_hosting
if exist dist_hosting.zip del /f /q dist_hosting.zip

mkdir dist_hosting
mkdir dist_hosting\api

echo Kopirovani frontendu...
xcopy /E /I /Y frontend\dist\* dist_hosting\

echo Kopirovani API backendu...
xcopy /E /I /Y api\* dist_hosting\api\

echo Vytvareni .htaccess pro hosting...
copy /Y api\.htaccess_sample dist_hosting\.htaccess

echo Zabaleni do ZIP archivu...
powershell -Command "Compress-Archive -Path dist_hosting\* -DestinationPath dist_hosting.zip -Force"

echo ======================================================
echo   HOTOVO! Balicek pripraven:
echo   - Slozka: dist_hosting\
echo   - ZIP archiv: dist_hosting.zip
echo ======================================================
pause
