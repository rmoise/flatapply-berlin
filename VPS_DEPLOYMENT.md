# VPS Deployment Guide

This guide will help you deploy the FlatApply Berlin orchestrator to a VPS for 24/7 automated scraping.

## 📋 Prerequisites

### Local Requirements
- Node.js 18+ and npm
- SSH key for VPS access
- Git repository access

### VPS Requirements
- Ubuntu 22.04 LTS (recommended)
- 1GB RAM minimum (2GB recommended)
- 25GB storage minimum
- SSH access

## 🚀 Quick Deployment

### 1. Setup Environment Variables

```bash
# Set your VPS details
export VPS_HOST=your-vps-ip-address
export VPS_USER=ubuntu
export REPO_URL=https://github.com/your-username/flatapply-berlin.git

# Deploy to VPS
npm run deploy:vps
```

### 2. Configure Environment

After deployment, SSH to your VPS and edit the production environment:

```bash
ssh ubuntu@your-vps-ip
cd /home/ubuntu/flatapply-berlin
nano .env.production
```

Fill in your actual values (especially Supabase credentials).

### 3. Start the Orchestrator

```bash
pm2 restart orchestrator
```

## 📊 Management Commands

All commands can be run locally and will execute on the VPS:

```bash
# Deployment
npm run deploy:vps              # Full deployment
./scripts/deploy.sh health      # Health check only
./scripts/deploy.sh restart     # Restart orchestrator
./scripts/deploy.sh logs        # View logs
./scripts/deploy.sh status      # Show PM2 status

# Local orchestrator commands (when SSH'd to VPS)
npm run orchestrator:start      # Start orchestrator locally
npm run orchestrator:stop       # Stop orchestrator
npm run orchestrator:health     # Health check
npm run orchestrator:status     # System status
npm run orchestrator:logs       # View logs
npm run orchestrator:restart    # Restart orchestrator
```

## 🔧 Configuration

### Production Configuration

Edit `config/production.ts` to adjust:
- Concurrency limits
- Scraping intervals
- Resource usage
- Platform priorities

### Environment Variables

Key variables in `.env.production`:

```bash
# Core
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Orchestrator
MAX_CONCURRENT_PLATFORMS=2
MAX_CONCURRENT_PAGES=5
DISCOVERY_INTERVAL=30
UPDATE_INTERVAL=15

# Features
ENABLE_AUTO_DISCOVERY=true
ENABLE_AUTO_MATCHING=true
ENABLE_AUTO_CLEANUP=true
```

### PM2 Configuration

The orchestrator runs under PM2 with:
- Auto-restart on failure
- Memory limit monitoring
- Log rotation
- Daily restart at 3 AM
- Health monitoring

## 📈 Monitoring

### Health Checks

```bash
# Quick health check
npm run orchestrator:health

# Detailed system status
npm run orchestrator:status
```

### Logs

```bash
# Show recent logs
npm run orchestrator:logs

# Follow logs in real-time
npm run orchestrator:logs -- --follow

# Filter logs
npm run orchestrator:logs -- --filter "error"
npm run orchestrator:logs -- --level "warn"
```

### System Monitoring

The status command shows:
- System resources (memory, disk, CPU)
- PM2 process status
- Recent orchestrator activity
- Health warnings

## 🔄 Maintenance

### Regular Tasks

1. **Monitor disk space** - logs can grow large
2. **Check memory usage** - restart if needed
3. **Review error logs** - fix issues promptly
4. **Update dependencies** - security patches

### Updates

To deploy code updates:

```bash
# Deploy latest code
npm run deploy:vps

# Or manually
ssh ubuntu@your-vps
cd /home/ubuntu/flatapply-berlin
git pull
npm install
pm2 restart orchestrator
```

### Troubleshooting

#### Orchestrator won't start
```bash
# Check logs
npm run orchestrator:logs -- --filter "error"

# Try emergency restart
npm run orchestrator:restart -- --emergency

# Check system resources
npm run orchestrator:status
```

#### High memory usage
```bash
# Restart orchestrator
npm run orchestrator:restart

# Check for memory leaks in logs
npm run orchestrator:logs -- --filter "memory"
```

#### Browser issues
```bash
# Clean up browser processes
ssh ubuntu@your-vps
pkill -f "chromium|firefox|webkit"
pm2 restart orchestrator
```

## 💰 Cost Optimization

### VPS Providers

**Recommended providers:**
- **DigitalOcean**: $5-10/month, excellent docs
- **Linode**: $5-10/month, good performance  
- **Hetzner**: $3-7/month, European, cheap
- **Railway**: $5-15/month, very beginner-friendly

### Resource Usage

**Expected usage:**
- **CPU**: Low to moderate (bursts during scraping)
- **Memory**: 200-400MB average
- **Disk**: 5-10GB (including logs)
- **Network**: Minimal (mostly text data)

### Optimization Tips

1. **Limit concurrent pages** - reduce memory usage
2. **Increase scraping intervals** - reduce CPU load
3. **Disable images in browser** - reduce bandwidth
4. **Log rotation** - prevent disk filling
5. **Use headless browsers** - reduce resource usage

## 🔒 Security

### Basic Security

The deployment script automatically:
- Uses SSH keys for access
- Runs services as non-root user
- Isolates browser processes
- Implements resource limits

### Additional Security

For production use:
1. Setup firewall (UFW)
2. Disable password authentication
3. Use fail2ban for intrusion detection
4. Regular security updates
5. Monitor access logs

## 📞 Support

If you encounter issues:

1. Check logs: `npm run orchestrator:logs`
2. Check system status: `npm run orchestrator:status`
3. Try restart: `npm run orchestrator:restart`
4. Check the troubleshooting section above

The orchestrator is designed to be self-healing and should recover from most issues automatically.