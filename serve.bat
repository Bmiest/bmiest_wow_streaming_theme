@echo off
REM Serveert de overlay op http://localhost:8777 -- alleen op deze machine,
REM niet op het netwerk. Dat is met opzet: config.js bevat je StreamElements
REM token, en dat wil je niet aan je LAN aanbieden.
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
  python -m http.server 8777 --bind 127.0.0.1
  goto :eof
)
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 8777 --bind 127.0.0.1
  goto :eof
)
where npx >nul 2>nul
if %errorlevel%==0 (
  npx --yes http-server -p 8777 -a 127.0.0.1
  goto :eof
)

echo Geen Python of Node gevonden.
echo Installeer Python via de Microsoft Store en start dit bestand opnieuw.
pause
