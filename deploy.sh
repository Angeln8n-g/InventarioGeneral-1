#!/bin/bash
# ============================================
# Quick Start Deployment Script
# ============================================
# This script automates the deployment process for the inventory management application
# Usage: ./deploy.sh [options]
# Options:
#   --build      : Build Docker images
#   --deploy     : Deploy the application
#   --check      : Run health checks
#   --all        : Run all steps (default)
#   --rollback   : Rollback to previous version
#   --version    : Specify version tag (default: latest)

set -e  # Exit on error

# Configuration
APP_NAME="inventory-app"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env.production"
HEALTH_ENDPOINT="http://localhost:3000/api/health"
MAX_HEALTH_RETRIES=30
HEALTH_RETRY_DELAY=2
VERSION="latest"

# Parse command line arguments
BUILD=false
DEPLOY=false
CHECK=false
ALL=false
ROLLBACK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --deploy)
            DEPLOY=true
            shift
            ;;
        --check)
            CHECK=true
            shift
            ;;
        --all)
            ALL=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --version)
            VERSION="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --build      : Build Docker images"
            echo "  --deploy     : Deploy the application"
            echo "  --check      : Run health checks"
            echo "  --all        : Run all steps (default)"
            echo "  --rollback   : Rollback to previous version"
            echo "  --version    : Specify version tag (default: latest)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# If no flags specified, run all steps
if [ "$BUILD" = false ] && [ "$DEPLOY" = false ] && [ "$CHECK" = false ] && [ "$ROLLBACK" = false ]; then
    ALL=true
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# Helper Functions
# ============================================

print_step() {
    echo -e "\n${CYAN}==> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_success "Docker is installed: $DOCKER_VERSION"
    else
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version)
        print_success "Docker Compose is installed: $COMPOSE_VERSION"
    else
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if Docker daemon is running
    if docker ps &> /dev/null; then
        print_success "Docker daemon is running"
    else
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    # Check if .env.production exists
    if [ ! -f "$ENV_FILE" ]; then
        print_error "$ENV_FILE not found!"
        print_warning "Please create $ENV_FILE from $ENV_FILE.example"
        exit 1
    fi
    print_success "$ENV_FILE found"
    
    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        print_error "$COMPOSE_FILE not found!"
        exit 1
    fi
    print_success "$COMPOSE_FILE found"
}

build_images() {
    print_step "Building Docker images..."
    
    # Build with docker-compose
    if docker-compose -f "$COMPOSE_FILE" build --no-cache; then
        print_success "Docker images built successfully"
        
        # Tag with version if specified
        if [ "$VERSION" != "latest" ]; then
            print_step "Tagging image with version: $VERSION"
            docker tag "${APP_NAME}:latest" "${APP_NAME}:${VERSION}"
            print_success "Image tagged as ${APP_NAME}:${VERSION}"
        fi
    else
        print_error "Failed to build Docker images"
        exit 1
    fi
}

deploy_application() {
    print_step "Deploying application..."
    
    # Stop existing containers
    print_step "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start containers
    print_step "Starting containers..."
    if docker-compose -f "$COMPOSE_FILE" up -d; then
        print_success "Application deployed successfully"
    else
        print_error "Failed to deploy application"
        exit 1
    fi
}

check_health() {
    print_step "Running health checks..."
    
    # Wait for containers to start
    echo -e "${CYAN}Waiting for containers to start...${NC}"
    sleep 5
    
    # Check container status
    print_step "Checking container status..."
    
    ALL_RUNNING=true
    while IFS= read -r line; do
        CONTAINER_NAME=$(echo "$line" | awk '{print $1}')
        CONTAINER_STATE=$(echo "$line" | awk '{print $2}')
        
        if [ "$CONTAINER_STATE" = "running" ]; then
            print_success "Container $CONTAINER_NAME is running"
        else
            print_error "Container $CONTAINER_NAME is not running (state: $CONTAINER_STATE)"
            ALL_RUNNING=false
        fi
    done < <(docker-compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.State}}" | tail -n +2)
    
    if [ "$ALL_RUNNING" = false ]; then
        print_error "Some containers are not running. Check logs with: docker-compose logs"
        exit 1
    fi
    
    # Check application health endpoint
    print_step "Checking application health endpoint..."
    HEALTH_CHECK_PASSED=false
    
    for i in $(seq 1 $MAX_HEALTH_RETRIES); do
        echo -e "${CYAN}Attempt $i/$MAX_HEALTH_RETRIES...${NC}"
        
        if curl -f -s -o /tmp/health_response.json "$HEALTH_ENDPOINT" &> /dev/null; then
            HEALTH_CHECK_PASSED=true
            print_success "Health check passed!"
            echo -e "${CYAN}Response: $(cat /tmp/health_response.json)${NC}"
            rm -f /tmp/health_response.json
            break
        else
            if [ $i -lt $MAX_HEALTH_RETRIES ]; then
                print_warning "Health check failed, retrying in $HEALTH_RETRY_DELAY seconds..."
                sleep $HEALTH_RETRY_DELAY
            fi
        fi
    done
    
    if [ "$HEALTH_CHECK_PASSED" = false ]; then
        print_error "Health check failed after $MAX_HEALTH_RETRIES attempts"
        print_warning "Check application logs with: docker-compose logs app"
        exit 1
    fi
    
    # Check nginx
    print_step "Checking Nginx proxy..."
    if curl -f -s -o /dev/null "http://localhost" || [ $? -eq 22 ]; then
        print_success "Nginx proxy is responding"
    else
        print_warning "Nginx check failed. This is expected if SSL is not configured yet."
    fi
    
    print_success "All health checks completed!"
}

rollback_deployment() {
    print_step "Rolling back to previous version..."
    
    if [ "$VERSION" = "latest" ]; then
        print_error "Please specify a version to rollback to using --version parameter"
        echo -e "${CYAN}Example: ./deploy.sh --rollback --version v1.0.0${NC}"
        exit 1
    fi
    
    print_step "Stopping current containers..."
    docker-compose -f "$COMPOSE_FILE" down
    
    print_step "Deploying version: $VERSION"
    # Update docker-compose to use specific version
    export IMAGE_TAG="$VERSION"
    docker-compose -f "$COMPOSE_FILE" up -d
    
    if [ $? -eq 0 ]; then
        print_success "Rollback completed successfully"
        check_health
    else
        print_error "Rollback failed"
        exit 1
    fi
}

show_status() {
    print_step "Current deployment status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo -e "\n${CYAN}Docker images:${NC}"
    docker images | grep "$APP_NAME" || echo "No images found"
}

# ============================================
# Main Execution
# ============================================

cat << "EOF"
╔════════════════════════════════════════════╗
║   Inventory App Deployment Script         ║
║   Version: 1.0.0                          ║
╚════════════════════════════════════════════╝
EOF

# Check prerequisites first
check_prerequisites

# Execute based on flags
if [ "$ROLLBACK" = true ]; then
    rollback_deployment
elif [ "$ALL" = true ]; then
    build_images
    deploy_application
    check_health
    show_status
else
    if [ "$BUILD" = true ]; then
        build_images
    fi
    
    if [ "$DEPLOY" = true ]; then
        deploy_application
    fi
    
    if [ "$CHECK" = true ]; then
        check_health
    fi
fi

echo ""
print_success "Deployment script completed successfully!"

cat << EOF

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

EOF

exit 0
