#!/bin/bash

set -e

echo "🚀 TABSH Local Development Setup"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and detect runtime
check_docker() {
    print_status "Checking Docker installation..."
    
    # Check basic Docker installation
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first:"
        echo ""
        echo "🐳 Recommended for macOS:"
        echo "  brew install colima docker docker-compose"
        echo "  colima start --cpu 4 --memory 8 --disk 100 --vm-type vz --mount-type virtiofs"
        echo ""
        echo "📦 Alternative options:"
        echo "  • Docker Desktop: https://docs.docker.com/desktop/install/mac-install/"
        echo "  • Linux: https://docs.docker.com/engine/install/"
        echo "  • Windows: https://docs.docker.com/desktop/install/windows-install/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose is not installed."
        echo "Install with: brew install docker-compose"
        exit 1
    fi
    
    # Detect Docker runtime
    DOCKER_RUNTIME="unknown"
    if command -v colima &> /dev/null && colima status &> /dev/null; then
        DOCKER_RUNTIME="colima"
        print_success "Docker with Colima runtime detected"
        
        # Check if Colima is using optimal settings
        COLIMA_STATUS=$(colima status 2>/dev/null || echo "")
        if echo "$COLIMA_STATUS" | grep -q "vmType.*vz" && echo "$COLIMA_STATUS" | grep -q "mountType.*virtiofs"; then
            print_success "Colima is using optimal settings (vz + virtiofs)"
        else
            print_warning "Colima could be optimized. Consider:"
            echo "  colima stop"
            echo "  colima start --cpu 4 --memory 8 --disk 100 --vm-type vz --mount-type virtiofs"
        fi
    elif docker context list 2>/dev/null | grep -q "docker-desktop" && docker context list 2>/dev/null | grep -q "\*.*docker-desktop"; then
        DOCKER_RUNTIME="docker-desktop"
        print_success "Docker Desktop detected"
    else
        print_success "Docker installation detected"
    fi
    
    # Test Docker connectivity
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running or not accessible"
        if [ "$DOCKER_RUNTIME" = "colima" ]; then
            echo "Try: colima start"
        else
            echo "Please start your Docker runtime"
        fi
        exit 1
    fi
    
    print_success "Docker is running and accessible ($DOCKER_RUNTIME)"
}

# Check if Node.js is installed (for local development)
check_node() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_warning "Node.js is not installed. Installing via Docker only."
        DOCKER_ONLY=true
    else
        NODE_VERSION=$(node --version)
        print_success "Node.js ${NODE_VERSION} is installed"
        DOCKER_ONLY=false
    fi
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "Created .env from .env.example"
        else
            print_error ".env.example not found!"
            exit 1
        fi
    else
        print_warning ".env already exists, skipping creation"
    fi
    
    # Create .env.local for local overrides
    if [ ! -f ".env.local" ]; then
        cat > .env.local << EOF
# Local environment overrides
# This file is ignored by git and can contain local-specific settings

# Uncomment to override ports
# WEB_PORT=4444
# API_PORT=4445

# Uncomment for development mode
# NODE_ENV=development
# DEV_MODE=true

# Add any local-specific environment variables here
EOF
        print_success "Created .env.local for local overrides"
    else
        print_warning ".env.local already exists, skipping creation"
    fi
}

# Install dependencies
install_dependencies() {
    if [ "$DOCKER_ONLY" = false ]; then
        print_status "Installing Node.js dependencies..."
        if [ -f "package.json" ]; then
            npm install
            print_success "Dependencies installed"
        else
            print_error "package.json not found!"
            exit 1
        fi
    else
        print_status "Skipping local dependency installation (Docker-only mode)"
    fi
}

# Build Docker images
build_docker() {
    print_status "Building Docker images..."
    docker-compose build
    print_success "Docker images built successfully"
}

# Start services
start_services() {
    print_status "Starting Docker services..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 5
    
    # Check if services are healthy
    if docker-compose ps | grep -q "Up.*healthy"; then
        print_success "Services are running and healthy!"
    else
        print_warning "Services are starting up. Check status with: docker-compose ps"
    fi
}

# Display information
show_info() {
    echo ""
    echo "🎮 TABSH Development Environment Ready!"
    echo "======================================"
    echo ""
    echo "Services available at:"
    echo "  🌐 Web Application: http://localhost:4444"
    echo "  🔗 API Service:     http://localhost:4445"
    echo ""
    echo "Useful commands:"
    echo "  📊 Check status:    docker-compose ps"
    echo "  📋 View logs:       docker-compose logs -f"
    echo "  🔄 Restart:         docker-compose restart"
    echo "  ⏹️  Stop:            docker-compose down"
    echo "  🧪 Run tests:       npm test"
    echo ""
    if [ "$DOCKER_ONLY" = false ]; then
        echo "Local development:"
        echo "  🚀 Start locally:   npm start"
        echo "  🔧 Development:     npm run dev"
        echo ""
    fi
    echo "For more information, see README.md"
}

# Main setup process
main() {
    echo ""
    check_docker
    check_node
    setup_environment
    install_dependencies
    build_docker
    start_services
    show_info
    
    print_success "Setup completed successfully! 🎉"
}

# Handle script arguments
case "${1:-}" in
    "--docker-only")
        DOCKER_ONLY=true
        main
        ;;
    "--help"|"-h")
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --docker-only    Skip Node.js dependency installation"
        echo "  --help, -h       Show this help message"
        echo ""
        echo "This script sets up the TABSH development environment with Docker."
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information."
        exit 1
        ;;
esac