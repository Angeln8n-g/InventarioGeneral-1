#!/usr/bin/env pwsh
# ============================================
# Quick Start Deployment Script
# ============================================
# This script automates the deployment process for the inventory management application
# Usage: .\deploy.ps1 [options]
# Options:
#   -Build      : Build Docker images
#   -Deploy     : Deploy the application
#   -Check      : Run health checks
#   -All        : Run all steps (default)
#   -Rollback   : Rollback to previous version

param(
    [switch]$Build,
    [switch]$Deploy,
    [switch]$Check,
    [switch]$All,
    [switch]$Rollback,
    [string]$Version = "latest"
)

# Colors for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

# Configuration
$APP_NAME = "inventory-app"
$COMPOSE_FILE = "docker-compose.yml"
$ENV_FILE = ".env.production"
$HEALTH_ENDPOINT = "http://localhost:3000/api/health"
$MAX_HEALTH_RETRIES = 30
$HEALTH_RETRY_DELAY = 2

# ============================================
# Helper Functions
# ============================================

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor $InfoColor
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor $SuccessColor
}

function Write-Error-Message {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor $ErrorColor
}

function Write-Warning-Message {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor $WarningColor
}

function Check-Prerequisites {
    Write-Step "Checking prerequisites..."
    
    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker is installed: $dockerVersion"
    }
    catch {
        Write-Error-Message "Docker is not installed or not in PATH"
        exit 1
    }
    
    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose is installed: $composeVersion"
    }
    catch {
        Write-Error-Message "Docker Compose is not installed or not in PATH"
        exit 1
    }
    
    # Check if Docker daemon is running
    try {
        docker ps | Out-Null
        Write-Success "Docker daemon is running"
    }
    catch {
        Write-Error-Message "Docker daemon is not running. Please start Docker."
        exit 1
    }
    
    # Check if .env.production exists
    if (-not (Test-Path $ENV_FILE)) {
        Write-Error-Message "$ENV_FILE not found!"
        Write-Host "Please create $ENV_FILE from $ENV_FILE.example" -ForegroundColor $WarningColor
        exit 1
    }
    Write-Success "$ENV_FILE found"
    
    # Check if docker-compose.yml exists
    if (-not (Test-Path $COMPOSE_FILE)) {
        Write-Error-Message "$COMPOSE_FILE not found!"
        exit 1
    }
    Write-Success "$COMPOSE_FILE found"
}

function Build-Images {
    Write-Step "Building Docker images..."
    
    try {
        # Build with docker-compose
        docker-compose -f $COMPOSE_FILE build --no-cache
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker images built successfully"
            
            # Tag with version if specified
            if ($Version -ne "latest") {
                Write-Step "Tagging image with version: $Version"
                docker tag "${APP_NAME}:latest" "${APP_NAME}:${Version}"
                Write-Success "Image tagged as ${APP_NAME}:${Version}"
            }
        }
        else {
            Write-Error-Message "Failed to build Docker images"
            exit 1
        }
    }
    catch {
        Write-Error-Message "Error during build: $_"
        exit 1
    }
}

function Deploy-Application {
    Write-Step "Deploying application..."
    
    try {
        # Stop existing containers
        Write-Step "Stopping existing containers..."
        docker-compose -f $COMPOSE_FILE down
        
        # Start containers
        Write-Step "Starting containers..."
        docker-compose -f $COMPOSE_FILE up -d
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Application deployed successfully"
        }
        else {
            Write-Error-Message "Failed to deploy application"
            exit 1
        }
    }
    catch {
        Write-Error-Message "Error during deployment: $_"
        exit 1
    }
}

function Check-Health {
    Write-Step "Running health checks..."
    
    # Wait for containers to start
    Write-Host "Waiting for containers to start..." -ForegroundColor $InfoColor
    Start-Sleep -Seconds 5
    
    # Check container status
    Write-Step "Checking container status..."
    $containers = docker-compose -f $COMPOSE_FILE ps --format json | ConvertFrom-Json
    
    $allRunning = $true
    foreach ($container in $containers) {
        $name = $container.Name
        $state = $container.State
        
        if ($state -eq "running") {
            Write-Success "Container $name is running"
        }
        else {
            Write-Error-Message "Container $name is not running (state: $state)"
            $allRunning = $false
        }
    }
    
    if (-not $allRunning) {
        Write-Error-Message "Some containers are not running. Check logs with: docker-compose logs"
        exit 1
    }
    
    # Check application health endpoint
    Write-Step "Checking application health endpoint..."
    $healthCheckPassed = $false
    
    for ($i = 1; $i -le $MAX_HEALTH_RETRIES; $i++) {
        try {
            Write-Host "Attempt $i/$MAX_HEALTH_RETRIES..." -ForegroundColor $InfoColor
            $response = Invoke-WebRequest -Uri $HEALTH_ENDPOINT -Method Get -TimeoutSec 5 -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                $healthCheckPassed = $true
                Write-Success "Health check passed!"
                Write-Host "Response: $($response.Content)" -ForegroundColor $InfoColor
                break
            }
        }
        catch {
            if ($i -lt $MAX_HEALTH_RETRIES) {
                Write-Host "Health check failed, retrying in $HEALTH_RETRY_DELAY seconds..." -ForegroundColor $WarningColor
                Start-Sleep -Seconds $HEALTH_RETRY_DELAY
            }
        }
    }
    
    if (-not $healthCheckPassed) {
        Write-Error-Message "Health check failed after $MAX_HEALTH_RETRIES attempts"
        Write-Host "Check application logs with: docker-compose logs app" -ForegroundColor $WarningColor
        exit 1
    }
    
    # Check nginx
    Write-Step "Checking Nginx proxy..."
    try {
        $nginxResponse = Invoke-WebRequest -Uri "http://localhost" -Method Get -TimeoutSec 5 -UseBasicParsing
        if ($nginxResponse.StatusCode -eq 200 -or $nginxResponse.StatusCode -eq 301 -or $nginxResponse.StatusCode -eq 302) {
            Write-Success "Nginx proxy is responding"
        }
    }
    catch {
        Write-Warning-Message "Nginx check failed. This is expected if SSL is not configured yet."
    }
    
    Write-Success "All health checks completed!"
}

function Rollback-Deployment {
    Write-Step "Rolling back to previous version..."
    
    if ($Version -eq "latest") {
        Write-Error-Message "Please specify a version to rollback to using -Version parameter"
        Write-Host "Example: .\deploy.ps1 -Rollback -Version v1.0.0" -ForegroundColor $InfoColor
        exit 1
    }
    
    Write-Step "Stopping current containers..."
    docker-compose -f $COMPOSE_FILE down
    
    Write-Step "Deploying version: $Version"
    # Update docker-compose to use specific version
    # This assumes images are tagged with versions
    $env:IMAGE_TAG = $Version
    docker-compose -f $COMPOSE_FILE up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Rollback completed successfully"
        Check-Health
    }
    else {
        Write-Error-Message "Rollback failed"
        exit 1
    }
}

function Show-Logs {
    Write-Step "Showing recent logs..."
    docker-compose -f $COMPOSE_FILE logs --tail=50
}

function Show-Status {
    Write-Step "Current deployment status:"
    docker-compose -f $COMPOSE_FILE ps
    
    Write-Host "`nDocker images:" -ForegroundColor $InfoColor
    docker images | Select-String $APP_NAME
}

# ============================================
# Main Execution
# ============================================

Write-Host @"
╔════════════════════════════════════════════╗
║   Inventory App Deployment Script         ║
║   Version: 1.0.0                          ║
╚════════════════════════════════════════════╝
"@ -ForegroundColor $InfoColor

# If no flags specified, run all steps
if (-not ($Build -or $Deploy -or $Check -or $Rollback)) {
    $All = $true
}

# Check prerequisites first
Check-Prerequisites

# Execute based on flags
if ($Rollback) {
    Rollback-Deployment
}
elseif ($All) {
    Build-Images
    Deploy-Application
    Check-Health
    Show-Status
}
else {
    if ($Build) {
        Build-Images
    }
    
    if ($Deploy) {
        Deploy-Application
    }
    
    if ($Check) {
        Check-Health
    }
}

Write-Host "`n" -NoNewline
Write-Success "Deployment script completed successfully!"
Write-Host @"

Next steps:
  - View logs: docker-compose logs -f
  - Check status: docker-compose ps
  - Stop application: docker-compose down
  - Access application: http://localhost:3000
  - Access via Nginx: http://localhost

For production with SSL:
  - Configure SSL certificates in nginx/ssl/
  - Update nginx.conf with your domain
  - Access via: https://inventario.hunykho.com

"@ -ForegroundColor $InfoColor

exit 0
