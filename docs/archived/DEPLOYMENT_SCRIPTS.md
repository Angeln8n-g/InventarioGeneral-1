# Deployment Scripts Documentation

This document provides detailed information about the automated deployment scripts included in this project.

## Overview

The project includes two deployment scripts that automate the entire deployment process:

- **`deploy.sh`**: For Linux/Unix systems (Ubuntu production server)
- **`deploy.ps1`**: For Windows systems (local development)

Both scripts provide the same functionality and follow the same workflow.

## Features

### ✅ Prerequisites Verification
- Checks if Docker is installed and accessible
- Checks if Docker Compose is installed
- Verifies Docker daemon is running
- Validates required configuration files exist (`.env.production`, `docker-compose.yml`)

### ✅ Image Building
- Builds optimized Docker images using multi-stage builds
- Supports version tagging for rollback capability
- Uses Docker layer caching for faster builds
- Provides clear build progress feedback

### ✅ Automated Deployment
- Safely stops existing containers
- Starts new containers with updated configuration
- Configures Docker networks and volumes
- Applies restart policies

### ✅ Health Checks
- Verifies all containers are running
- Tests application health endpoint (`/api/health`)
- Checks Nginx proxy is responding
- Automatic retries with configurable timeout
- Detailed health check reporting

### ✅ Rollback Support
- Roll back to any previous version
- Automatic health verification after rollback
- Safe rollback with container state validation

## Usage

### Linux/Ubuntu (deploy.sh)

#### First Time Setup

```bash
# Make script executable
chmod +x deploy.sh
```

#### Full Deployment (Recommended)

```bash
# Build, deploy, and verify
./deploy.sh --all
```

#### Individual Steps

```bash
# Only build Docker images
./deploy.sh --build

# Only deploy containers
./deploy.sh --deploy

# Only run health checks
./deploy.sh --check
```

#### Version Management

```bash
# Deploy with specific version tag
./deploy.sh --all --version v1.2.0

# Rollback to previous version
./deploy.sh --rollback --version v1.1.0
```

#### Help

```bash
./deploy.sh --help
```

### Windows (deploy.ps1)

#### Full Deployment (Recommended)

```powershell
# Build, deploy, and verify
.\deploy.ps1 -All
```

#### Individual Steps

```powershell
# Only build Docker images
.\deploy.ps1 -Build

# Only deploy containers
.\deploy.ps1 -Deploy

# Only run health checks
.\deploy.ps1 -Check
```

#### Version Management

```powershell
# Deploy with specific version tag
.\deploy.ps1 -All -Version "v1.2.0"

# Rollback to previous version
.\deploy.ps1 -Rollback -Version "v1.1.0"
```

## Configuration

### Default Settings

Both scripts use the following default configuration:

```bash
APP_NAME="inventory-app"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"
HEALTH_ENDPOINT="http://localhost:3000/api/health"
MAX_HEALTH_RETRIES=30
HEALTH_RETRY_DELAY=2
```

### Customization

You can modify these values at the beginning of the script files if needed:

**For deploy.sh (Linux):**
```bash
# Edit the configuration section at the top of the file
nano deploy.sh
```

**For deploy.ps1 (Windows):**
```powershell
# Edit the configuration section at the top of the file
notepad deploy.ps1
```

## Script Output

The scripts provide color-coded output for easy reading:

- 🔵 **Cyan/Blue**: Steps and informational messages
- ✅ **Green**: Successful operations
- ❌ **Red**: Errors and failures
- ⚠️ **Yellow**: Warnings

### Example Output

```bash
╔════════════════════════════════════════════╗
║   Inventory App Deployment Script         ║
║   Version: 1.0.0                          ║
╚════════════════════════════════════════════╝

==> Checking prerequisites...
✓ Docker is installed: Docker version 24.0.5
✓ Docker Compose is installed: Docker Compose version v2.20.0
✓ Docker daemon is running
✓ .env.production found
✓ docker-compose.yml found

==> Building Docker images...
✓ Docker images built successfully

==> Deploying application...
==> Stopping existing containers...
==> Starting containers...
✓ Application deployed successfully

==> Running health checks...
==> Checking container status...
✓ Container inventory-app is running
✓ Container nginx-proxy is running

==> Checking application health endpoint...
Attempt 1/30...
✓ Health check passed!
Response: {"status":"ok","timestamp":"2025-01-22T10:30:00.000Z"}

==> Checking Nginx proxy...
✓ Nginx proxy is responding

✓ All health checks completed!

✓ Deployment script completed successfully!

Next steps:
  - View logs: docker-compose logs -f
  - Check status: docker-compose ps
  - Stop application: docker-compose down
  - Access application: http://localhost:3000
  - Access via Nginx: http://localhost
```

## Workflow

The scripts follow this workflow when using `--all`:

1. **Prerequisites Check**
   - Verify Docker installation
   - Verify Docker Compose installation
   - Check Docker daemon status
   - Validate configuration files

2. **Build Phase**
   - Build Docker images from Dockerfile
   - Tag images with version (if specified)
   - Report build success/failure

3. **Deploy Phase**
   - Stop existing containers gracefully
   - Start new containers with updated configuration
   - Apply Docker Compose configuration

4. **Health Check Phase**
   - Wait for containers to initialize
   - Verify container status
   - Test application health endpoint (with retries)
   - Test Nginx proxy
   - Report overall health status

5. **Status Report**
   - Display running containers
   - Show Docker images
   - Provide next steps

## Error Handling

### Prerequisites Failures

If prerequisites are not met, the script will:
- Display clear error message
- Indicate what's missing
- Exit with error code 1

**Example:**
```bash
✗ Docker is not installed or not in PATH
```

### Build Failures

If image building fails:
- Display Docker build error output
- Exit with error code 1
- Preserve existing containers (no deployment)

### Deployment Failures

If container deployment fails:
- Display error message
- Show relevant logs
- Exit with error code 1
- Containers remain in previous state

### Health Check Failures

If health checks fail after deployment:
- Retry up to 30 times (configurable)
- Display retry attempts
- Show detailed error information
- Suggest checking logs
- Exit with error code 1

**Example:**
```bash
✗ Health check failed after 30 attempts
⚠ Check application logs with: docker-compose logs app
```

## Rollback Procedure

### When to Rollback

Use rollback when:
- New deployment causes issues
- Application is not functioning correctly
- Need to revert to stable version quickly

### How to Rollback

**Linux:**
```bash
./deploy.sh --rollback --version v1.0.0
```

**Windows:**
```powershell
.\deploy.ps1 -Rollback -Version "v1.0.0"
```

### Rollback Process

1. Validates version parameter is provided
2. Stops current containers
3. Deploys specified version
4. Runs health checks to verify rollback success
5. Reports rollback status

## Best Practices

### Version Tagging

Always tag your deployments with versions:

```bash
# Build and tag with version
./deploy.sh --build --version v1.2.0

# Deploy specific version
./deploy.sh --deploy --version v1.2.0
```

This enables easy rollback if needed.

### Pre-Deployment Checklist

Before running deployment:

1. ✅ Ensure `.env.production` is configured correctly
2. ✅ Verify PostgreSQL is running and accessible
3. ✅ Check SSL certificates are valid (for production)
4. ✅ Backup current deployment (if critical)
5. ✅ Test in staging environment first (if available)

### Post-Deployment Verification

After successful deployment:

1. ✅ Monitor logs for errors: `docker-compose logs -f`
2. ✅ Test critical functionality manually
3. ✅ Verify database connectivity
4. ✅ Check SSL certificate validity
5. ✅ Monitor resource usage: `docker stats`

### Monitoring

Keep an eye on:

```bash
# View real-time logs
docker-compose logs -f

# Check container status
docker-compose ps

# Monitor resource usage
docker stats

# View recent logs
docker-compose logs --tail=100
```

## Troubleshooting

### Script Won't Execute (Linux)

**Problem:** Permission denied

**Solution:**
```bash
chmod +x deploy.sh
```

### Docker Not Found

**Problem:** Docker command not found

**Solution:**
- Install Docker: See [Docker Installation Guide](https://docs.docker.com/engine/install/)
- Ensure Docker is in PATH
- Restart terminal after installation

### Health Check Timeout

**Problem:** Health checks fail repeatedly

**Solution:**
1. Check application logs: `docker-compose logs app`
2. Verify `.env.production` configuration
3. Test database connectivity
4. Increase `MAX_HEALTH_RETRIES` in script if needed

### Container Won't Start

**Problem:** Container exits immediately

**Solution:**
1. Check logs: `docker-compose logs app`
2. Verify environment variables
3. Check for port conflicts
4. Ensure PostgreSQL is accessible

## Integration with CI/CD

The scripts can be integrated into CI/CD pipelines:

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        run: |
          ssh user@server 'cd /opt/inventory-app && git pull && ./deploy.sh --all'
```

### GitLab CI Example

```yaml
deploy:
  stage: deploy
  script:
    - ssh user@server 'cd /opt/inventory-app && git pull && ./deploy.sh --all'
  only:
    - main
```

## Support

For issues or questions about the deployment scripts:

1. Check this documentation
2. Review script output for error messages
3. Check Docker and Docker Compose logs
4. Consult main [DEPLOYMENT.md](./DEPLOYMENT.md) guide

## Version History

- **v1.0.0** (2025-01-22): Initial release
  - Full deployment automation
  - Health check verification
  - Rollback support
  - Cross-platform support (Linux/Windows)

---

**Last Updated:** 2025-01-22
