@echo off
setlocal
set "PROJECT=%~dp0"
title Servis Defteri Baslat

echo Servis Defteri baslatiliyor...
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

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri 'http://localhost:5173/' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
  start "Servis Defteri Web" cmd /k "cd /d ""%PROJECT%apps\web"" && npm run dev -- --host 0.0.0.0"
) else (
  echo Web zaten calisiyor.
)

timeout /t 5 /nobreak >nul
start "" "http://localhost:5173/"

echo.
echo Tarayici acildi. Bu pencereyi kapatabilirsin.
pause
