@echo off
setlocal
set "PROJECT=%~dp0"
set "CLOUD_API=https://islik-cloud-api.onrender.com"
set "EXPO_PUBLIC_USE_LAN_API=false"
title Servis Defteri Mobil

echo Servis Defteri mobil uygulama baslatiliyor...
echo.
cd /d "%PROJECT%"

where docker >nul 2>nul
if errorlevel 1 goto cloud_api

docker info >nul 2>nul
if errorlevel 1 goto cloud_api

echo Yerel veritabani baslatiliyor...
docker compose -p islik-cloud up -d postgres
if errorlevel 1 goto cloud_api

set "DB_READY=0"
for /l %%N in (1,1,30) do (
  docker exec islik_cloud_postgres pg_isready -U islik -d islik_cloud >nul 2>nul
  if not errorlevel 1 (
    set "DB_READY=1"
    goto database_ready
  )
  timeout /t 1 /nobreak >nul
)

:database_ready
if "%DB_READY%"=="0" goto cloud_api

echo Veritabani guncellemeleri kontrol ediliyor...
pushd "%PROJECT%apps\api"
call npx prisma migrate deploy
set "MIGRATION_EXIT=%errorlevel%"
popd
if not "%MIGRATION_EXIT%"=="0" goto cloud_api

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri 'http://localhost:4000/health' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  start "Servis Defteri API" cmd /k "cd /d ""%PROJECT%apps\api"" && set HOST=0.0.0.0&& npm run dev"
) else (
  echo API zaten calisiyor.
)

echo API hazirlanmasi bekleniyor...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ready=$false; for($i=0; $i -lt 30; $i++){ try { Invoke-WebRequest -Uri 'http://localhost:4000/health' -UseBasicParsing -TimeoutSec 1 | Out-Null; $ready=$true; break } catch { Start-Sleep -Milliseconds 500 } }; if($ready){ exit 0 } else { exit 1 }"
if errorlevel 1 goto cloud_api

for /f "delims=" %%I in ('powershell -NoProfile -Command "$config = Get-NetIPConfiguration ^| Where-Object { $_.IPv4DefaultGateway -and $_.IPv4Address -and $_.NetAdapter.Status -eq 'Up' } ^| Sort-Object { if($_.NetAdapter.HardwareInterface){ 0 } else { 1 } }, { $_.NetIPv4Interface.InterfaceMetric } ^| Select-Object -First 1; if($config){ $config.IPv4Address.IPAddress ^| Select-Object -First 1 }"') do set "LAN_IP=%%I"
if not defined LAN_IP goto cloud_api

set "EXPO_PUBLIC_API_URL=http://%LAN_IP%:4000"
set "EXPO_PUBLIC_USE_LAN_API=true"
echo Telefon sunucu adresi otomatik bulundu: %EXPO_PUBLIC_API_URL%
goto start_expo

:cloud_api
set "EXPO_PUBLIC_API_URL=%CLOUD_API%"
set "EXPO_PUBLIC_USE_LAN_API=false"
echo.
echo Yerel veritabani kullanilamiyor. Calisan bulut sunucusu otomatik secildi.
echo Bulut sunucusu Expo acilirken arka planda hazirlaniyor...
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "try { Invoke-WebRequest -Uri '%CLOUD_API%/health' -UseBasicParsing -TimeoutSec 90 | Out-Null } catch {}"

:start_expo
cd /d "%PROJECT%apps\mobile"
echo.
echo Expo aciliyor. QR kodu Expo Go ile okutabilirsin.
echo Metro onbellegi korunuyor; sonraki acilislar daha hizli olacak.
call npm start -- --lan
if errorlevel 1 (
  echo.
  echo Expo baslatilamadi. Yukaridaki hatayi kontrol et.
  pause
)
