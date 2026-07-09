@echo off
setlocal
set PROJECT=%~dp0
title Servis Defteri Mobil

echo Servis Defteri mobil uygulama baslatiliyor...
echo.

cd /d "%PROJECT%"

where docker >nul 2>nul
if %errorlevel%==0 (
  docker compose -p islik-cloud up -d postgres
) else (
  echo Docker bulunamadi. Postgres zaten calisiyorsa devam eder.
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri 'http://localhost:4000/health' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  start "Servis Defteri API" cmd /k "cd /d ""%PROJECT%apps\api"" && set HOST=0.0.0.0&& npm run dev"
) else (
  echo API zaten calisiyor.
)

for /f "tokens=2 delims=:" %%I in ('ipconfig ^| findstr /i "IPv4"') do (
  if not defined LAN_IP set "LAN_IP=%%I"
)
set "LAN_IP=%LAN_IP: =%"

if defined LAN_IP (
  set "EXPO_PUBLIC_API_URL=http://%LAN_IP%:4000"
  echo Telefon sunucu adresi: %EXPO_PUBLIC_API_URL%
) else (
  set "EXPO_PUBLIC_API_URL=http://localhost:4000"
  echo IP bulunamadi. Uygulamadaki Sunucu alanina bilgisayar IP adresini elle yaz.
)

cd /d "%PROJECT%apps\mobile"
echo Expo aciliyor. QR kodu Expo Go ile okutabilirsin.
npm start -- --clear
