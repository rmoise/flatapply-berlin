module.exports = {
  apps: [
    {
      name: 'orchestrator',
      script: 'tsx',
      args: 'scripts/start-orchestrator.ts',
      cwd: '/path/to/your/app', // Will be updated during deployment
      
      // Runtime configuration
      node_args: '--max-old-space-size=512', // Limit memory for VPS
      instances: 1, // Single instance for orchestrator
      exec_mode: 'fork', // Fork mode for single instance
      
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s', // Minimum uptime before considering stable
      max_memory_restart: '400M', // Restart if memory exceeds 400MB
      
      // Logging
      log_file: './logs/orchestrator.log',
      error_file: './logs/orchestrator-error.log',
      out_file: './logs/orchestrator-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      
      // Health monitoring
      kill_timeout: 30000, // 30 seconds to gracefully shutdown
      listen_timeout: 10000, // 10 seconds to start listening
      
      // Restart strategies
      restart_delay: 4000, // Wait 4 seconds before restart
      exponential_backoff_restart_delay: 100,
      
      // Advanced PM2 features
      watch: false, // Don't watch files in production
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Cron restart (optional - restart daily at 3 AM)
      cron_restart: '0 3 * * *',
      
      // Process management
      kill_retry_time: 100,
      
      // Custom environment variables
      env_production: {
        NODE_ENV: 'production',
        ENABLE_AUTO_DISCOVERY: 'true',
        ENABLE_AUTO_MATCHING: 'true',
        ENABLE_AUTO_CLEANUP: 'true',
        MAX_CONCURRENT_PLATFORMS: '2',
        MAX_CONCURRENT_PAGES: '5',
        BATCH_SIZE: '25',
        DISCOVERY_INTERVAL: '30', // 30 minutes
        UPDATE_INTERVAL: '15',    // 15 minutes
        HEALTH_CHECK_INTERVAL: '5' // 5 minutes
      }
    }
  ],
  
  // Deployment configuration (optional)
  deploy: {
    production: {
      user: 'ubuntu', // Default Ubuntu user
      host: ['your-vps-ip'], // Will be updated with actual VPS IP
      ref: 'origin/main',
      repo: 'https://github.com/your-username/flatapply-berlin.git', // Update with your repo
      path: '/home/ubuntu/flatapply-berlin',
      
      // Pre-deployment commands
      'pre-setup': 'apt update && apt install nodejs npm -y',
      
      // Setup commands
      'post-setup': [
        'npm install',
        'npm install -g tsx pm2',
        'npx playwright install',
        'mkdir -p logs'
      ].join(' && '),
      
      // Deployment commands
      'pre-deploy-local': '',
      'pre-deploy': 'git fetch --all',
      'post-deploy': [
        'npm install',
        'npx playwright install',
        'pm2 reload ecosystem.config.js --env production',
        'pm2 save'
      ].join(' && '),
      
      // Environment
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};