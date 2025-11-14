# Script para configurar la base de datos de Supabase
# Ejecutar con: .\setup-database.ps1

Write-Host "=== Configuración de Base de Datos Supabase ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si Supabase CLI está instalado
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "Supabase CLI no está instalado." -ForegroundColor Yellow
    Write-Host "Instalando Supabase CLI..." -ForegroundColor Yellow
    
    # Instalar Supabase CLI usando npm
    npm install -g supabase
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error al instalar Supabase CLI. Por favor, instálalo manualmente:" -ForegroundColor Red
        Write-Host "npm install -g supabase" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Supabase CLI está instalado ✓" -ForegroundColor Green
Write-Host ""

# Leer las credenciales del archivo .env.local
$envFile = Get-Content .env.local
$supabaseUrl = ($envFile | Select-String "NEXT_PUBLIC_SUPABASE_URL=(.+)").Matches.Groups[1].Value
$supabaseKey = ($envFile | Select-String "SUPABASE_SERVICE_ROLE_KEY=(.+)").Matches.Groups[1].Value

Write-Host "URL de Supabase: $supabaseUrl" -ForegroundColor Cyan
Write-Host ""

# Vincular el proyecto
Write-Host "Vinculando proyecto con Supabase..." -ForegroundColor Yellow
supabase link --project-ref vyayutjogbpytpvpqxen

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al vincular el proyecto. Continuando con ejecución manual..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Ejecutando Migraciones ===" -ForegroundColor Cyan
Write-Host ""

# Ejecutar migraciones
Write-Host "1. Ejecutando schema inicial..." -ForegroundColor Yellow
supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Migraciones ejecutadas correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠ Error al ejecutar migraciones automáticamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Por favor, ejecuta las migraciones manualmente:" -ForegroundColor Yellow
    Write-Host "1. Ve a: https://supabase.com/dashboard/project/vyayutjogbpytpvpqxen/editor" -ForegroundColor Cyan
    Write-Host "2. Abre el SQL Editor" -ForegroundColor Cyan
    Write-Host "3. Ejecuta los archivos en orden:" -ForegroundColor Cyan
    Write-Host "   - supabase/migrations/001_initial_schema.sql" -ForegroundColor White
    Write-Host "   - supabase/migrations/002_rls_policies.sql" -ForegroundColor White
    Write-Host "   - supabase/migrations/003_sample_data.sql" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Configuración Completa ===" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Verifica que las tablas se crearon en: https://supabase.com/dashboard/project/vyayutjogbpytpvpqxen/editor" -ForegroundColor White
Write-Host "2. Ejecuta 'npm run dev' para iniciar el servidor de desarrollo" -ForegroundColor White
Write-Host "3. Accede a http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Credenciales de prueba:" -ForegroundColor Cyan
Write-Host "  Admin: admin / password123" -ForegroundColor White
Write-Host "  Usuario: teacher1 / password123" -ForegroundColor White
