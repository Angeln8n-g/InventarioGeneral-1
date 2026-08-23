# Script para configurar Supabase automáticamente
Write-Host "=== Configurando Base de Datos Supabase ===" -ForegroundColor Cyan
Write-Host ""

# Leer credenciales
$env = Get-Content .env.local
$supabaseUrl = ($env | Select-String "NEXT_PUBLIC_SUPABASE_URL=(.+)").Matches.Groups[1].Value
$serviceKey = ($env | Select-String "SUPABASE_SERVICE_ROLE_KEY=(.+)").Matches.Groups[1].Value

Write-Host "URL: $supabaseUrl" -ForegroundColor Green
Write-Host ""

# Leer el script SQL
$sqlScript = Get-Content "supabase/setup-complete.sql" -Raw

Write-Host "Ejecutando script SQL..." -ForegroundColor Yellow
Write-Host ""

try {
    # Ejecutar el script SQL usando la API de Supabase
    $headers = @{
        "apikey" = $serviceKey
        "Authorization" = "Bearer $serviceKey"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        query = $sqlScript
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    
    Write-Host "✓ Script ejecutado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Base de datos configurada correctamente." -ForegroundColor Green
    Write-Host ""
    Write-Host "Ahora puedes iniciar sesión con:" -ForegroundColor Cyan
    Write-Host "  • admin / password123" -ForegroundColor White
    Write-Host "  • teacher1 / password123" -ForegroundColor White
    
} catch {
    Write-Host "⚠ No se pudo ejecutar automáticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, ejecuta manualmente:" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://supabase.com/dashboard/project/vyayutjogbpytpvpqxen/sql/new" -ForegroundColor Cyan
    Write-Host "2. Copia el contenido de: supabase/setup-complete.sql" -ForegroundColor Cyan
    Write-Host "3. Pégalo en el SQL Editor y haz clic en 'Run'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
