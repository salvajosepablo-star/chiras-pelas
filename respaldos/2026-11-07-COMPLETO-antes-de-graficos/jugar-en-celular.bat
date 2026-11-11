@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  ===== CHIRAS PELAS =====
echo  Conecte el celular al mismo Wi-Fi que este computador
echo  y abra en el navegador del celular una de estas direcciones:
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
  for /f "tokens=* delims= " %%b in ("%%a") do echo     http://%%b:8000
)
echo.
echo  En este computador: http://localhost:8000
echo  Deje esta ventana abierta mientras juega. Ciérrela para apagar el servidor.
echo.
python -m http.server 8000
pause
