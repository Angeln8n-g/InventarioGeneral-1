# PowerShell script to apply classrooms migration
# Run with: .\apply-classrooms-migration-simple.ps1

Write-Host "🚀 Applying Classrooms Migration (016)" -ForegroundColor Cyan
Write-Host "=" * 60

# Load environment variables
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env.local file not found" -ForegroundColor Red
    exit 1
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$supabaseKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl -or -not $supabaseKey) {
    Write-Host "❌ Missing Supabase credentials in .env.local" -ForegroundColor Red
    Write-Host "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 Reading migration file..." -ForegroundColor Yellow
$migrationFile = "supabase\migrations\016_add_classrooms_and_assignments.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

$migrationSQL = Get-Content $migrationFile -Raw
Write-Host "✅ Migration file loaded" -ForegroundColor Green

Write-Host "`n📊 Applying migration via Supabase REST API..." -ForegroundColor Yellow
Write-Host "⚠️  Note: This requires the SQL Editor API or direct database access" -ForegroundColor Yellow
Write-Host "`nRecommended approaches:" -ForegroundColor Cyan
Write-Host "1. Use Supabase Dashboard > SQL Editor > Paste the migration SQL" -ForegroundColor White
Write-Host "2. Use Supabase CLI: supabase db push" -ForegroundColor White
Write-Host "3. Use psql directly if you have database credentials" -ForegroundColor White

Write-Host "`n📋 Migration file location:" -ForegroundColor Cyan
Write-Host "   $((Resolve-Path $migrationFile).Path)" -ForegroundColor White

Write-Host "`n🔗 Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "   $supabaseUrl" -ForegroundColor White

Write-Host "`n💡 Quick steps:" -ForegroundColor Yellow
Write-Host "   1. Open Supabase Dashboard" -ForegroundColor White
Write-Host "   2. Go to SQL Editor" -ForegroundColor White
Write-Host "   3. Create a new query" -ForegroundColor White
Write-Host "   4. Copy and paste the contents of:" -ForegroundColor White
Write-Host "      $migrationFile" -ForegroundColor Cyan
Write-Host "   5. Click 'Run'" -ForegroundColor White

Write-Host "`n" + "=" * 60
Write-Host "Press any key to open the migration file in notepad..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

notepad $migrationFile

Write-Host "`n✅ Migration file opened in notepad" -ForegroundColor Green
Write-Host "Copy the contents and paste them into Supabase SQL Editor" -ForegroundColor Yellow
