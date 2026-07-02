@echo off
REM Levanta los 4 componentes en ventanas separadas. PostgreSQL ya corre como servicio.
set BASE=%~dp0
set PATH=C:\Program Files\nodejs;%PATH%

start "API :4000"        cmd /k "cd /d %BASE%sistema-web-completo && npm run dev"
start "Login :4001"      cmd /k "cd /d %BASE%servicio-login && npm run dev"
start "Registro :4002"   cmd /k "cd /d %BASE%servicio-registro && npm run dev"
start "Frontend :5173"   cmd /k "cd /d %BASE%frontend && npm run dev"

echo Iniciando 4 servicios... abre http://localhost:5173 cuando carguen.
