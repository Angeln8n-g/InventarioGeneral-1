# Script para iniciar el servidor de desarrollo
Write-Host "=== Iniciando Servidor de Desarrollo ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Servidor iniciando en: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Yellow
Write-Host "  Admin:    admin / password123" -ForegroundColor White
Write-Host "  Usuario:  teacher1 / password123" -ForegroundColor White
Write-Host ""
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Gray
Write-Host ""

npm run dev
