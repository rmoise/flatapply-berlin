#!/bin/bash

# FlatApply Berlin - VPS Deployment Script
# This script helps deploy the orchestrator to a VPS

set -e  # Exit on any error

# Colors for output
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# Configuration
VPS_USER="${VPS_USER:-ubuntu}"
VPS_HOST="${VPS_HOST:-}"
APP_DIR="${APP_DIR:-/home/ubuntu/flatapply-berlin}"
REPO_URL="${REPO_URL:-}"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required variables are set
check_config() {
    log_info "Checking deployment configuration..."
    
    if [ -z "$VPS_HOST" ]; then
        log_error "VPS_HOST environment variable is required"
        echo "Example: export VPS_HOST=your-vps-ip-address"
        exit 1
    fi
    
    if [ -z "$REPO_URL" ]; then
        log_warning "REPO_URL not set, will use current directory"
        REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
        if [ -z "$REPO_URL" ]; then
            log_error "Could not determine repository URL. Please set REPO_URL environment variable"
            exit 1
        fi
    fi
    
    log_success "Configuration check passed"
    echo "  VPS: $VPS_USER@$VPS_HOST"
    echo "  App Directory: $APP_DIR"
    echo "  Repository: $REPO_URL"
}

# Test SSH connection
test_ssh() {
    log_info "Testing SSH connection to VPS..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes "$VPS_USER@$VPS_HOST" exit 2>/dev/null; then
        log_success "SSH connection successful"
    else
        log_error "SSH connection failed"
        echo "Please ensure:"
        echo "1. Your SSH key is added to the VPS (ssh-copy-id $VPS_USER@$VPS_HOST)"
        echo "2. The VPS is accessible and running"
        echo "3. The SSH service is running on the VPS"
        exit 1
    fi
}

# Install dependencies on VPS
install_dependencies() {
    log_info "Installing dependencies on VPS..."
    
    ssh "$VPS_USER@$VPS_HOST" << 'EOF'
        # Update system
        sudo apt update
        
        # Install Node.js 18.x
        if ! command -v node &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # Install PM2 globally
        if ! command -v pm2 &> /dev/null; then
            sudo npm install -g pm2
        fi
        
        # Install tsx globally for TypeScript execution
        if ! command -v tsx &> /dev/null; then
            sudo npm install -g tsx
        fi
        
        # Install git if not present
        if ! command -v git &> /dev/null; then
            sudo apt install -y git
        fi
        
        echo "Dependencies installed successfully"
EOF
    
    log_success "Dependencies installation completed"
}

# Deploy application
deploy_app() {
    log_info "Deploying application to VPS..."
    
    ssh "$VPS_USER@$VPS_HOST" << EOF
        # Create app directory if it doesn't exist
        mkdir -p $APP_DIR
        cd $APP_DIR
        
        # Clone or update repository
        if [ -d ".git" ]; then
            echo "Updating existing repository..."
            git fetch --all
            git reset --hard origin/main
        else
            echo "Cloning repository..."
            git clone $REPO_URL .
        fi
        
        # Install Node.js dependencies
        echo "Installing Node.js dependencies..."
        npm install
        
        # Install Playwright browsers
        echo "Installing Playwright browsers..."
        npx playwright install
        
        # Create logs directory
        mkdir -p logs
        
        echo "Application deployed successfully"
EOF
    
    log_success "Application deployment completed"
}

# Setup environment
setup_environment() {
    log_info "Setting up production environment..."
    
    # Check if .env.production exists locally
    if [ -f ".env.production" ]; then
        log_info "Copying local .env.production to VPS..."
        scp .env.production "$VPS_USER@$VPS_HOST:$APP_DIR/.env.production"
    else
        log_warning ".env.production not found locally"
        echo "Creating .env.production template on VPS..."
        
        ssh "$VPS_USER@$VPS_HOST" << EOF
            cd $APP_DIR
            if [ ! -f ".env.production" ]; then
                cp .env.production.example .env.production
                echo "Please edit $APP_DIR/.env.production with your actual values"
            fi
EOF
    fi
    
    log_success "Environment setup completed"
}

# Start orchestrator
start_orchestrator() {
    log_info "Starting orchestrator with PM2..."
    
    ssh "$VPS_USER@$VPS_HOST" << EOF
        cd $APP_DIR
        
        # Update PM2 configuration with correct path
        sed -i "s|/path/to/your/app|$APP_DIR|g" ecosystem.config.js
        
        # Stop existing process if running
        pm2 stop orchestrator 2>/dev/null || true
        pm2 delete orchestrator 2>/dev/null || true
        
        # Start orchestrator
        pm2 start ecosystem.config.js --env production
        
        # Save PM2 configuration
        pm2 save
        
        # Setup PM2 startup script
        sudo env PATH=\$PATH:/usr/bin pm2 startup systemd -u $VPS_USER --hp /home/$VPS_USER || true
        
        # Show status
        pm2 status
EOF
    
    log_success "Orchestrator started successfully"
}

# Run health check
run_health_check() {
    log_info "Running health check..."
    
    ssh "$VPS_USER@$VPS_HOST" << EOF
        cd $APP_DIR
        tsx scripts/health-check.ts
EOF
    
    if [ $? -eq 0 ]; then
        log_success "Health check passed"
    else
        log_warning "Health check failed - check logs for details"
    fi
}

# Main deployment function
main() {
    echo "🚀 FlatApply Berlin VPS Deployment"
    echo "=================================="
    
    check_config
    test_ssh
    install_dependencies
    deploy_app
    setup_environment
    start_orchestrator
    
    echo ""
    log_success "Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env.production on the VPS with your actual values:"
    echo "   ssh $VPS_USER@$VPS_HOST 'nano $APP_DIR/.env.production'"
    echo ""
    echo "2. Restart the orchestrator after updating config:"
    echo "   ssh $VPS_USER@$VPS_HOST 'cd $APP_DIR && pm2 restart orchestrator'"
    echo ""
    echo "3. Monitor the logs:"
    echo "   ssh $VPS_USER@$VPS_HOST 'cd $APP_DIR && pm2 logs orchestrator'"
    echo ""
    echo "4. Run health checks:"
    echo "   ssh $VPS_USER@$VPS_HOST 'cd $APP_DIR && tsx scripts/health-check.ts'"
    echo ""
    
    run_health_check
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "health")
        check_config
        run_health_check
        ;;
    "restart")
        check_config
        ssh "$VPS_USER@$VPS_HOST" "cd $APP_DIR && pm2 restart orchestrator"
        ;;
    "logs")
        check_config
        ssh "$VPS_USER@$VPS_HOST" "cd $APP_DIR && pm2 logs orchestrator"
        ;;
    "stop")
        check_config
        ssh "$VPS_USER@$VPS_HOST" "cd $APP_DIR && pm2 stop orchestrator"
        ;;
    "status")
        check_config
        ssh "$VPS_USER@$VPS_HOST" "cd $APP_DIR && pm2 status"
        ;;
    *)
        echo "Usage: $0 [deploy|health|restart|logs|stop|status]"
        echo ""
        echo "Commands:"
        echo "  deploy  - Full deployment (default)"
        echo "  health  - Run health check"
        echo "  restart - Restart orchestrator"
        echo "  logs    - Show orchestrator logs"
        echo "  stop    - Stop orchestrator"
        echo "  status  - Show PM2 status"
        exit 1
        ;;
esac