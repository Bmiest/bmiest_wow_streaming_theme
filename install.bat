@echo off
setlocal enabledelayedexpansion
title bmiest overlay - installatie

set "ROOT=%~dp0"
set "ROOT=%ROOT:~0,-1%"
set "SCENES=%APPDATA%\obs-studio\basic\scenes"

echo.
echo   bmiest overlay
echo   ==============
echo   map: %ROOT%
echo.

if not exist "%SCENES%" (
  echo   OBS is hier nog nooit gestart -- start OBS een keer, sluit het af,
  echo   en klik dit bestand daarna opnieuw aan.
  echo.
  pause & exit /b 1
)

tasklist /fi "imagename eq obs64.exe" 2>nul | find /i "obs64.exe" >nul
if not errorlevel 1 (
  echo   OBS staat nog open. Sluit het eerst af -- bij het afsluiten schrijft
  echo   OBS zijn eigen versie over de nieuwe collectie heen.
  echo.
  pause & exit /b 1
)

if not exist "%ROOT%\config.js" (
  copy "%ROOT%\config.example.js" "%ROOT%\config.js" >nul
  echo   config.js aangemaakt.
)

set "SRC=%ROOT%\obs-collection.local.json"
set "MODE=zonder server"
if /i "%~1"=="server" (
  set "SRC=%ROOT%\obs-collection.server.json"
  set "MODE=via serve.bat"
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$r = $env:ROOT; $t = Get-Content -Raw -LiteralPath $env:SRC;" ^
  "$t = $t.Replace('__ROOT__', $r.Replace('\','\\'));" ^
  "Set-Content -LiteralPath ($env:SCENES + '\bmiest_overlay.json') -Value $t -Encoding UTF8"

if errorlevel 1 ( echo   Er ging iets mis. & pause & exit /b 1 )

echo   Collectie geinstalleerd (%MODE%).
echo.
echo   1. Zet je StreamElements JWT in config.js (regel met  jwt: '' )
echo   2. Start OBS en kies "bmiest overlay" onder Scene Collection
echo   3. Vervang de twee [VERVANG]-vlakken door je Game Capture en camera
echo.
echo   Blijven de balken leeg? Sluit OBS en klik install-met-server.bat aan.
echo.
pause
