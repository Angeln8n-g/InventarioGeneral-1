# Script para limpiar caché y reiniciar Next.js
Write-Host "🧹 Limpiando caché de Next.js..." -ForegroundColor Cyan

# Eliminar carpeta .next
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ Carpeta .next eliminada" -ForegroundColor Green
}

# Eliminar caché de node_modules
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✓ Caché de node_modules eliminada" -ForegroundColor Green
}

# Eliminar caché de Turbopack
if (Test-Path .turbo) {
    Remove-Item -Recurse -Force .turbo
    Write-Host "✓ Caché de Turbopack eliminada" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Caché limpiada exitosamente" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Iniciando servidor de desarrollo..." -ForegroundColor Cyan
Write-Host ""

# Iniciar servidor de desarrollo
npm run dev
