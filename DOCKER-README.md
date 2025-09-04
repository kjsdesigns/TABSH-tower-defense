# TABSH - Tower Defense Game with Docker Support

A modern tower defense game built with vanilla JavaScript and Express.js, featuring comprehensive Docker containerization and development tooling.

## 🚀 Quick Start with Claude Code

### Prerequisites

Before starting, ensure you have:
- **Colima** (recommended) or Docker Desktop for container runtime
- **Git** for cloning repositories  
- **Claude Code CLI** for development assistance
- **Homebrew** (macOS) for package management

### One-Command Setup

```bash
./setup-local.sh
```

This will automatically:
- Validate Docker installation
- Set up environment files
- Install dependencies (if Node.js available)
- Build Docker images
- Start all services
- Run health checks

After setup, access the application at:
- **Web Application**: http://localhost:4444
- **API Service**: http://localhost:4445

### Manual Setup

If you prefer manual setup or troubleshooting:

```bash
# 1. Copy environment configuration
cp .env.example .env

# 2. Install dependencies (optional for Docker-only)
npm install

# 3. Build and start Docker services
docker-compose build
docker-compose up -d

# 4. Verify everything is working
npm test
```

## 🖥️ Colima Setup & Best Practices (Recommended for macOS)

### Why Colima over Docker Desktop?

**Colima** is the recommended Docker runtime for this project because:
- ⚡ **Faster startup** and better resource management
- 🔒 **More secure** - no daemon running as root
- 💾 **Lower memory footprint** than Docker Desktop
- 🆓 **Completely free** with no licensing restrictions
- 🛠️ **Better integration** with macOS Virtualization Framework

### Complete Colima Setup Guide

#### 1. Install Colima and Dependencies

```bash
# Install via Homebrew (recommended)
brew install colima docker docker-compose

# Verify installations
colima version
docker --version
docker-compose --version
```

#### 2. Configure Colima for Optimal Performance

Create or update your Colima configuration:

```bash
# Start with optimal settings for development
colima start --cpu 4 --memory 8 --disk 100 --vm-type vz --mount-type virtiofs

# Or edit configuration file directly
colima stop
nano ~/.colima/default/colima.yaml
```

**Recommended `~/.colima/default/colima.yaml` configuration:**

```yaml
# Optimal configuration for TABSH development
cpu: 4                    # Adjust based on your Mac's CPU count
memory: 8                 # 8GB RAM allocation
disk: 100                 # 100GB disk space
arch: aarch64             # ARM64 for Apple Silicon, x86_64 for Intel
runtime: docker           # Docker runtime
vmType: vz                # Use macOS Virtualization Framework (faster)
mountType: virtiofs       # Fastest mount type for vz
autoActivate: true        # Auto-set as Docker context
mountInotify: true        # Enable file watching for live reloading
kubernetes:
  enabled: false          # Disable K8s for better performance
network:
  address: false          # VM networking
  dns: []                 # Use system DNS
forwardAgent: false       # SSH agent forwarding
rosetta: false            # AMD64 emulation (only if needed)
binfmt: true             # Foreign architecture support
```

#### 3. Auto-Start Colima on Login (Recommended)

Set up automatic startup so Colima is always ready:

**Create launch agent:**
```bash
# Create the launch agent directory if it doesn't exist
mkdir -p ~/Library/LaunchAgents

# Create the launch script
sudo mkdir -p /usr/local/libexec/headless
sudo tee /usr/local/libexec/headless/launch-colima-user.sh > /dev/null << 'EOF'
#!/bin/bash

# Colima auto-start script for user login
set -euo pipefail

# Log function for debugging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> /tmp/colima-user-boot.log
}

log "Starting Colima user auto-start script"

# Set PATH to include Homebrew binaries
export PATH="/opt/homebrew/bin:$PATH"

# Wait for system to settle
sleep 5

# Check if Colima is already running
if colima status >/dev/null 2>&1; then
    log "Colima is already running, skipping start"
    exit 0
fi

log "Starting Colima as user..."

# Start Colima with optimal settings
colima start --cpu 4 --memory 8 --disk 100 --vm-type vz --mount-type virtiofs

# Verify startup and set Docker context
if colima status >/dev/null 2>&1; then
    log "Colima started successfully"
    docker context use colima >/dev/null 2>&1 || log "Failed to set Docker context"
    log "Colima user auto-start completed successfully"
else
    log "ERROR: Failed to start Colima"
    exit 1
fi
EOF

# Make the script executable
sudo chmod +x /usr/local/libexec/headless/launch-colima-user.sh

# Create the launch agent plist
cat > ~/Library/LaunchAgents/dev.colima.agent.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>dev.colima.agent</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/libexec/headless/launch-colima-user.sh</string>
    </array>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <false/>
    
    <key>StandardOutPath</key>
    <string>/tmp/colima-agent.out</string>
    
    <key>StandardErrorPath</key>
    <string>/tmp/colima-agent.err</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
        <key>HOME</key>
        <string>%USER_HOME%</string>
    </dict>
</dict>
</plist>
EOF

# Replace %USER_HOME% with actual home directory
sed -i '' "s|%USER_HOME%|$HOME|g" ~/Library/LaunchAgents/dev.colima.agent.plist

# Load the launch agent
launchctl load ~/Library/LaunchAgents/dev.colima.agent.plist
launchctl start dev.colima.agent
```

#### 4. Verify Colima Setup

```bash
# Check Colima status
colima status

# Verify Docker context
docker context list

# Test Docker functionality
docker run hello-world

# Check available resources
docker system info | grep -E "(CPUs|Total Memory)"
```

#### 5. Colima Management Commands

```bash
# Start Colima
colima start

# Stop Colima  
colima stop

# Restart Colima
colima restart

# Check status and resource usage
colima status
colima list

# Update Colima configuration
colima stop
colima start --cpu 6 --memory 10  # Adjust resources

# SSH into Colima VM (for debugging)
colima ssh

# Reset Colima (nuclear option)
colima delete
colima start --cpu 4 --memory 8 --disk 100 --vm-type vz --mount-type virtiofs
```

### Colima Performance Optimization

#### Resource Allocation Guidelines

**For Development:**
```bash
# Minimum recommended for TABSH
colima start --cpu 2 --memory 4 --disk 60

# Optimal for active development
colima start --cpu 4 --memory 8 --disk 100

# High-performance setup (if you have resources)
colima start --cpu 6 --memory 12 --disk 150
```

**CPU Allocation:** 
- Minimum: 2 CPUs
- Recommended: 4 CPUs (half your Mac's cores)
- Maximum: Never use all available CPUs

**Memory Allocation:**
- Minimum: 4GB for basic development
- Recommended: 8GB for optimal performance
- Maximum: 75% of your total RAM

**Disk Space:**
- Minimum: 60GB for basic usage
- Recommended: 100GB for active development
- Note: Can only be increased, never decreased

#### Performance Tuning Tips

1. **Use Virtualization Framework (vz):**
   ```bash
   # Fastest option for Apple Silicon Macs
   colima start --vm-type vz --mount-type virtiofs
   ```

2. **Enable File System Notifications:**
   ```yaml
   # In ~/.colima/default/colima.yaml
   mountInotify: true  # Enables live reloading
   ```

3. **Optimize for Your Architecture:**
   ```bash
   # For Apple Silicon Macs (M1/M2/M3)
   colima start --arch aarch64 --vm-type vz
   
   # For Intel Macs
   colima start --arch x86_64 --vm-type qemu
   ```

### Troubleshooting Colima

#### Common Issues and Solutions

**🔧 Colima Won't Start:**
```bash
# Check for conflicts
brew services list | grep -i docker
# Stop any conflicting services
brew services stop docker-machine

# Reset Colima
colima delete
colima start --cpu 4 --memory 8
```

**🔧 Docker Commands Fail:**
```bash
# Set correct Docker context  
docker context use colima

# Verify context is active
docker context list
```

**🔧 Performance Issues:**
```bash
# Check resource usage
docker system df
docker system prune -f

# Restart with more resources
colima stop
colima start --cpu 6 --memory 10
```

**🔧 File Watching Not Working:**
```bash
# Enable mount notifications
colima stop
# Edit ~/.colima/default/colima.yaml
# Set: mountInotify: true
colima start
```

**🔧 Auto-start Not Working:**
```bash
# Check launch agent status
launchctl list | grep colima

# View logs
tail -f /tmp/colima-user-boot.log
tail -f /tmp/colima-agent.out

# Reload launch agent
launchctl unload ~/Library/LaunchAgents/dev.colima.agent.plist
launchctl load ~/Library/LaunchAgents/dev.colima.agent.plist
```

### Migration from Docker Desktop

If you're migrating from Docker Desktop:

```bash
# 1. Stop Docker Desktop
# (Via GUI: Docker Desktop → Quit Docker Desktop)

# 2. Install and start Colima
brew install colima docker docker-compose
colima start --cpu 4 --memory 8 --disk 100 --vm-type vz

# 3. Import existing images (optional)
docker save $(docker images --format "table {{.Repository}}:{{.Tag}}" | tail -n +2) | \
colima ssh -- docker load

# 4. Update Docker context
docker context use colima

# 5. Verify everything works
docker run hello-world
```

## 🐳 Docker Architecture

### Services

The application runs two identical services for scalability:

- **Web Service** (Port 4444): Primary application server
- **API Service** (Port 4445): Dedicated API server (can be scaled independently)

Both services run the same Express.js application but can be configured differently for specialized roles.

### Docker Configuration

- **Base Image**: `node:20-alpine` (minimal, secure)
- **Security**: Non-root user (`tabsh:1001`)
- **Health Checks**: Automated endpoint monitoring
- **Volumes**: Live code reloading for development

## 🔧 Development Commands

### Docker Operations
```bash
# Start services
npm run docker:up
# or
docker-compose up -d

# Stop services
npm run docker:down
# or
docker-compose down

# View logs
npm run docker:logs
# or
docker-compose logs -f

# Build images
npm run docker:build
# or
docker-compose build
```

### Comprehensive Testing
```bash
# Run all local tests
npm test

# Test complete Docker environment
npm run test:docker

# Test inside containers only
npm run test:container

# Infrastructure tests only
npm run test:infrastructure
```

### Local Development
```bash
# Start locally (without Docker)
npm start

# Development mode with file watching
npm run dev

# Auto-restart mode
npm run dev:watch
```

## 📁 Project Structure

```
TABSH/
├── 📄 Dockerfile                     # Container configuration
├── 📄 docker-compose.yml             # Multi-service orchestration
├── 📄 server.js                      # Express.js application server
├── 📄 package.json                   # Dependencies and scripts
├── 📄 setup-local.sh                 # Automated setup script
├── 📄 .env                          # Environment configuration
├── 📄 .env.example                  # Environment template
├── 📄 .gitignore                    # Git ignore patterns
├── 📁 js/                           # Frontend JavaScript modules
├── 📁 css/                          # Stylesheets
├── 📁 assets/                       # Game assets (images, sounds)
├── 📁 config/                       # Game configuration files
│   ├── 📁 maps/                     # Level configurations
│   ├── 📁 towers/                   # Tower definitions
│   ├── 📁 enemies/                  # Enemy configurations
│   └── 📁 heroes/                   # Hero definitions
└── 🧪 Test Suites
    ├── 📄 test-suite.js                  # Infrastructure tests
    ├── 📄 container-test-suite.js        # Container-specific tests
    └── 📄 docker-test-suite.js           # Full Docker orchestration tests
```

## ⚙️ Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Service Ports
WEB_PORT=4444
API_PORT=4445

# Application Settings
NODE_ENV=development
DEV_MODE=true

# Security
SESSION_SECRET=your_session_secret_here

# Testing
TEST_PORT=4446
TEST_TIMEOUT=30000

# Docker Settings
DOCKER_COMPOSE_PROJECT_NAME=tabsh

# Logging
LOG_LEVEL=info
```

### Local Overrides

Create `.env.local` for local-specific settings (ignored by git):

```bash
# Local development overrides
# Uncomment to override ports
# WEB_PORT=3000
# API_PORT=3001

# Uncomment for development mode
# NODE_ENV=development
# DEV_MODE=true

# Add any local-specific environment variables here
```

## 🧪 Comprehensive Testing Strategy

The project includes a three-tier testing approach inspired by enterprise best practices:

### 1. Infrastructure Tests (`test-suite.js`)
- **Project structure validation** - Ensures all required files and directories exist
- **Environment configuration** - Validates environment variables and settings
- **Docker setup verification** - Confirms Docker configuration is correct
- **External port accessibility** - Tests ports 4444 and 4445 from host machine
- **API endpoint validation** - Validates REST API functionality
- **Configuration file access** - Ensures game configurations are accessible

### 2. Container Tests (`container-test-suite.js`)
- **Container environment validation** - Confirms execution inside Docker containers
- **Internal service accessibility** - Tests internal port 3000 within containers
- **File system access** - Validates mounted volumes and file permissions
- **Internal API functionality** - Tests API endpoints from within containers
- **Security validation** - Confirms non-root user execution

### 3. Docker Orchestration Tests (`docker-test-suite.js`)
- **Multi-service coordination** - Tests interaction between web and API services
- **Service health monitoring** - Validates Docker health checks
- **Cross-container communication** - Ensures services can communicate
- **Full integration validation** - End-to-end testing of complete system

### Test Results Philosophy

All tests are designed to provide:
- ✅ **Detailed feedback** on each validation step
- 🔍 **Clear error messages** with actionable guidance
- 📊 **Success metrics** and comprehensive summaries
- 🛠️ **Troubleshooting guidance** for fixing issues
- 🎯 **100% success rate requirement** for deployment readiness

## 🔄 Development Workflow for New Contributors

### Getting Started with Claude Code & Colima

#### Complete Setup for a New Mac

**1. Install Prerequisites:**
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install development tools
brew install git colima docker docker-compose node

# Verify installations
git --version
colima version
docker --version
node --version
```

**2. Set up Colima (Recommended):**
```bash
# Start Colima with optimal settings for TABSH
colima start --cpu 4 --memory 8 --disk 100 --vm-type vz --mount-type virtiofs

# Verify Colima is running
colima status
docker context use colima
docker run hello-world
```

**3. Clone and Setup TABSH:**
```bash
# Clone the repository
git clone https://github.com/kjsdesigns/TABSH-tower-defense.git
cd TABSH-tower-defense

# One-command setup (detects Colima automatically)
./setup-local.sh
```

**4. Verify Complete Setup:**
```bash
# Run comprehensive tests
npm test                # Local infrastructure tests
npm run test:docker     # Complete Docker test suite

# Should see: "🏆 COMPLETE TEST SUITE SUCCESS!" with 100% pass rate
```

**5. Start Developing:**
- **Game Application**: http://localhost:4444
- **API Endpoints**: http://localhost:4445
- **Claude Code**: Ready for AI-assisted development

#### Setup with Auto-Start on Login

For seamless development experience, set up Colima to start automatically:

```bash
# Run the complete auto-start setup from the Colima section above
# This ensures Colima starts every time you login to your Mac

# Verify auto-start is working
launchctl list | grep colima
tail -f /tmp/colima-user-boot.log
```

#### Alternative: Docker Desktop Setup

If you prefer Docker Desktop over Colima:

```bash
# 1. Install Docker Desktop from https://www.docker.com/products/docker-desktop

# 2. Start Docker Desktop and ensure it's running

# 3. Clone and setup TABSH
git clone https://github.com/kjsdesigns/TABSH-tower-defense.git
cd TABSH-tower-defense
./setup-local.sh

# 4. Verify setup
npm test
npm run test:docker
```

### Using Claude Code for Development

Claude Code is particularly helpful for:
- **Understanding the codebase structure**
- **Making changes to game configurations**
- **Adding new features or fixing bugs**
- **Running and interpreting tests**
- **Troubleshooting Docker issues**

Example Claude Code interactions:
```bash
# Ask Claude Code to explain the project
"Explain how this tower defense game works"

# Get help with Docker issues  
"The Docker containers aren't starting, can you help debug?"

# Request feature additions
"Add a new tower type with ice damage that slows enemies"
```

### For Existing Developers

```bash
# Update and restart workflow
git pull
docker-compose build
docker-compose up -d
npm run test:docker
```

## 🐛 Troubleshooting Guide

### Common Issues and Solutions

#### Colima-Specific Issues

**🚀 Colima Won't Start After System Restart**:
```bash
# Check if auto-start is configured
launchctl list | grep colima

# If not configured, set up auto-start (see Colima section above)
# Or manually start
colima start --cpu 4 --memory 8 --disk 100 --vm-type vz --mount-type virtiofs
```

**🐳 Docker Context Issues**:
```bash
# Check current context
docker context list

# Switch to Colima context
docker context use colima

# If context is missing, recreate it
colima stop && colima start
```

**⚡ Colima Performance Issues**:
```bash
# Check resource usage
docker system df
colima status

# Restart with more resources
colima stop
colima start --cpu 6 --memory 10 --disk 120

# Clean up unused resources
docker system prune -f
```

**📁 File Watching Not Working (Live Reload)**:
```bash
# Ensure mount notifications are enabled
colima stop
# Edit ~/.colima/default/colima.yaml and set: mountInotify: true
colima start

# Verify virtiofs is being used
colima status | grep mountType
```

#### General Docker Issues

**🔌 Port Conflicts**:
```bash
# Check what's using the ports
lsof -i :4444 -i :4445

# Solution: Change ports in .env.local
echo -e "WEB_PORT=5444\nAPI_PORT=5445" > .env.local
docker-compose down && docker-compose up -d
```

**🐳 Docker Container Issues**:
```bash
# Complete reset (Colima)
docker-compose down
colima restart
docker-compose build --no-cache
docker-compose up -d

# Complete reset (Docker Desktop)
docker-compose down
# Restart Docker Desktop
docker-compose build --no-cache
docker-compose up -d

# Check Docker daemon status
docker info

# Clean up Docker resources
docker system prune -f
```

**🏥 Service Health Problems**:
```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs web
docker-compose logs api

# Check health endpoints manually
curl http://localhost:4444/api/listFiles
curl http://localhost:4445/api/listFiles
```

### Test Failure Diagnosis

If tests fail, follow this diagnostic sequence:

1. **Check Docker services**: 
   ```bash
   docker-compose ps
   # All services should show "Up" and "healthy"
   ```

2. **Review service logs**: 
   ```bash
   docker-compose logs
   # Look for error messages or startup issues
   ```

3. **Verify infrastructure**: 
   ```bash
   npm run test:infrastructure
   # Should pass with 100% success rate
   ```

4. **Test container internals**: 
   ```bash
   npm run test:container
   # Validates container-specific functionality
   ```

5. **Full integration test**: 
   ```bash
   npm run test:docker
   # Complete end-to-end validation
   ```

## 🌟 Key Features

### Game Features
- 🏰 **Interactive tower defense gameplay** with real-time strategy elements
- 🗼 **Multiple tower types** with unique abilities and upgrade paths
- 👹 **Various enemy types** with different behaviors and resistances
- 🦸 **Hero units** with special powers and abilities
- 📈 **Progressive difficulty** across multiple challenging levels
- 🎮 **Real-time graphics** and immersive sound effects
- ⚙️ **Configuration-driven** gameplay for easy modding

### Development & DevOps Features
- 🐳 **Full Docker containerization** for consistent development environments
- 🏗️ **Multi-service architecture** designed for horizontal scalability
- 🧪 **Comprehensive test suite** achieving 100% success rate
- 🔄 **Live code reloading** for rapid development iteration
- 💓 **Health monitoring** with automated container recovery
- 🔐 **Security hardening** using non-root containers and best practices
- 🎛️ **Environment flexibility** with configurable settings and overrides
- 📊 **Detailed logging** and debugging capabilities

## 📋 API Documentation

### File Management Endpoints
- `GET /api/listFiles?dir=<directory>` - List files in specified directory
- `GET /api/getConfig?dir=<dir>&file=<file>` - Retrieve configuration file content
- `POST /api/saveConfig` - Save configuration changes (body: `{filePath, content}`)

### Game Asset Management
- **Static file serving** for images, sounds, and game configurations
- **Client-side routing support** for single-page application navigation
- **MIME type handling** for various asset formats

### Health and Monitoring
- **Docker health checks** via internal HTTP endpoints
- **Service status validation** through automated testing
- **Performance monitoring** through logging and metrics

## 🤝 Contributing Guidelines

### Development Standards

1. **Fork the repository** and create a feature branch
2. **Follow existing code patterns** and conventions
3. **Run the full test suite**: `npm run test:docker`
4. **Ensure 100% test success rate** before submitting
5. **Update documentation** for any configuration changes
6. **Submit a pull request** with detailed description

### Code Quality Requirements

- ✅ All new features **must include tests**
- 🐳 Docker configuration changes **must pass container tests**
- 📝 Environment changes **must be documented**
- 🎯 Code **must follow existing patterns** and conventions
- 🧪 **100% test success rate** required for merge approval

### Using Claude Code for Contributions

Claude Code can assist with:
- **Code review and suggestions**
- **Test writing and validation**
- **Documentation updates**
- **Debugging and troubleshooting**
- **Feature implementation guidance**

## 🔗 Resources and Links

- **Repository**: https://github.com/kjsdesigns/TABSH
- **Issues**: https://github.com/kjsdesigns/TABSH/issues
- **Claude Code Documentation**: https://docs.anthropic.com/claude/docs
- **Docker Best Practices**: Implemented from enterprise-grade reference architecture

---

## 🎉 Success Metrics

This implementation achieves:
- ✅ **100% test success rate** across all test suites
- 🐳 **Full Docker compatibility** with health monitoring
- 🔧 **Zero-configuration setup** for new developers
- 📊 **Comprehensive documentation** with troubleshooting guides
- 🚀 **Production-ready** containerization with security hardening
- 🎯 **Claude Code optimized** for AI-assisted development

**Ready to defend the realm? Your containerized tower defense kingdom awaits!** 🏰⚔️🐳