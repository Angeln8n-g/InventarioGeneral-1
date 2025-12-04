# PowerShell script to apply cable markers migration
# This script applies the 015_add_cable_markers.sql migration to your Supabase database

Write-Host "🚀 Applying cable markers migration..." -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Missing Supabase credentials in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "📍 Supabase URL: $supabaseUrl" -ForegroundColor Gray
Write-Host ""

# Check if migration file exists
$migrationFile = "supabase\migrations\015_add_cable_markers.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "📄 Reading migration file..." -ForegroundColor Yellow
$sqlContent = Get-Content $migrationFile -Raw

Write-Host "🔄 Applying migration using Node.js..." -ForegroundColor Yellow
Write-Host ""

# Run the Node.js script
node apply-cable-markers-migration.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now use the cable markers feature in your API." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Migration failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
