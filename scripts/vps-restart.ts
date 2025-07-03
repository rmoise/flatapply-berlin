import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { performHealthCheck } from './health-check';

// Load environment variables
config({ path: '.env.production' });

const execAsync = promisify(exec);

interface RestartOptions {
  force?: boolean;       // Force restart even if healthy
  graceful?: boolean;    // Use graceful restart (default: true)
  waitTime?: number;     // Wait time between stop and start (seconds)
  skipHealthCheck?: boolean; // Skip pre-restart health check
}

/**
 * Restart the orchestrator with various options
 */
async function restartOrchestrator(options: RestartOptions = {}): Promise<void> {
  const {
    force = false,
    graceful = true,
    waitTime = 5,
    skipHealthCheck = false
  } = options;
  
  console.log('🔄 Restarting FlatApply Orchestrator...');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log(`⚙️  Options: graceful=${graceful}, force=${force}, wait=${waitTime}s`);
  
  try {
    // Pre-restart health check (unless skipped or forced)
    if (!skipHealthCheck && !force) {
      console.log('\\n🏥 Running pre-restart health check...');
      
      try {
        const health = await performHealthCheck();
        
        if (health.overall === 'healthy') {
          console.log('✅ System is healthy. Proceeding with restart...');
        } else if (health.overall === 'warning') {
          console.log('⚠️  System has warnings. Restart may help...');
        } else {
          console.log('❌ System is critical. Restart is needed...');
        }
      } catch (error) {
        console.log('⚠️  Health check failed, proceeding with restart anyway...');
      }
    }
    
    // Check current PM2 status
    console.log('\\n📋 Checking current PM2 status...');
    try {
      const { stdout: pm2Status } = await execAsync('pm2 list');
      console.log(pm2Status);
      
      // Check if orchestrator is running
      const isRunning = pm2Status.includes('orchestrator') && pm2Status.includes('online');
      
      if (!isRunning && !force) {
        console.log('ℹ️  Orchestrator is not currently running. Use --force to start it.');
        return;
      }
      
    } catch (error) {
      console.log('⚠️  Could not get PM2 status:', error);
    }
    
    // Perform restart
    if (graceful) {
      console.log('\\n🔄 Performing graceful restart...');
      
      // PM2 reload performs zero-downtime restart
      try {
        await execAsync('pm2 reload orchestrator');
        console.log('✅ Graceful restart completed');
      } catch (error) {
        console.log('⚠️  Graceful restart failed, trying regular restart...');
        await performRegularRestart(waitTime);
      }
      
    } else {
      console.log('\\n🔄 Performing regular restart...');
      await performRegularRestart(waitTime);
    }
    
    // Wait for startup
    console.log('\\n⏳ Waiting for orchestrator to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Post-restart status check
    console.log('\\n📊 Post-restart status:');
    try {
      const { stdout: newStatus } = await execAsync('pm2 list');
      console.log(newStatus);
      
      // Check if restart was successful
      const isNowRunning = newStatus.includes('orchestrator') && newStatus.includes('online');
      
      if (isNowRunning) {
        console.log('✅ Orchestrator is now running');
        
        // Run health check after restart
        console.log('\\n🏥 Running post-restart health check...');
        setTimeout(async () => {
          try {
            await performHealthCheck();
            console.log('✅ Post-restart health check completed');
          } catch (error) {
            console.log('⚠️  Post-restart health check failed:', error);
          }
        }, 10000); // Wait 10 seconds for full startup
        
      } else {
        console.log('❌ Orchestrator failed to start properly');
        process.exit(1);
      }
      
    } catch (error) {
      console.log('⚠️  Could not verify restart status:', error);
    }
    
    console.log('\\n✅ Restart process completed');
    
  } catch (error) {
    console.error('❌ Restart failed:', error);
    process.exit(1);
  }
}

/**
 * Perform a regular stop/start restart
 */
async function performRegularRestart(waitTime: number): Promise<void> {
  try {
    // Stop the process
    console.log('⏹️  Stopping orchestrator...');
    await execAsync('pm2 stop orchestrator');
    console.log('✅ Orchestrator stopped');
    
    // Wait
    if (waitTime > 0) {
      console.log(`⏳ Waiting ${waitTime} seconds...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }
    
    // Start the process
    console.log('▶️  Starting orchestrator...');
    await execAsync('pm2 start orchestrator');
    console.log('✅ Orchestrator started');
    
  } catch (error) {
    // If PM2 commands fail, try ecosystem file
    console.log('⚠️  PM2 restart failed, trying ecosystem file...');
    
    try {
      await execAsync('pm2 delete orchestrator || true');
      await execAsync('pm2 start ecosystem.config.js --env production');
      console.log('✅ Orchestrator restarted using ecosystem file');
    } catch (ecosystemError) {
      throw new Error(`Both PM2 restart methods failed: ${error}, ${ecosystemError}`);
    }
  }
}

/**
 * Emergency restart - kills all processes and starts fresh
 */
async function emergencyRestart(): Promise<void> {
  console.log('🚨 Emergency restart initiated...');
  
  try {
    // Kill all related processes
    console.log('🛑 Killing all orchestrator processes...');
    await execAsync('pkill -f "start-orchestrator" || true');
    await execAsync('pkill -f "orchestrator" || true');
    
    // Clean up PM2
    console.log('🧹 Cleaning up PM2...');
    await execAsync('pm2 delete all || true');
    await execAsync('pm2 kill || true');
    
    // Kill browser processes
    console.log('🌐 Cleaning up browser processes...');
    await execAsync('pkill -f "chromium\\|firefox\\|webkit" || true');
    
    // Wait
    console.log('⏳ Waiting for cleanup...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Start fresh
    console.log('🚀 Starting fresh orchestrator...');
    await execAsync('pm2 start ecosystem.config.js --env production');
    
    console.log('✅ Emergency restart completed');
    
  } catch (error) {
    console.error('💥 Emergency restart failed:', error);
    throw error;
  }
}

/**
 * Parse command line arguments and run restart
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const options: RestartOptions = {};
  
  // Parse arguments
  for (const arg of args) {
    switch (arg) {
      case '--force':
        options.force = true;
        break;
      case '--no-graceful':
        options.graceful = false;
        break;
      case '--skip-health':
        options.skipHealthCheck = true;
        break;
      case '--emergency':
        await emergencyRestart();
        return;
      case '--wait':
        const waitIndex = args.indexOf('--wait');
        if (waitIndex !== -1 && args[waitIndex + 1]) {
          options.waitTime = parseInt(args[waitIndex + 1]) || 5;
        }
        break;
      case '--help':
      case '-h':
        console.log('🔄 VPS Orchestrator Restart Tool');
        console.log('');
        console.log('Usage: tsx scripts/vps-restart.ts [options]');
        console.log('');
        console.log('Options:');
        console.log('  --force         Force restart even if healthy');
        console.log('  --no-graceful   Use stop/start instead of graceful reload');
        console.log('  --skip-health   Skip pre-restart health check');
        console.log('  --emergency     Emergency restart (kill all processes)');
        console.log('  --wait <sec>    Wait time between stop and start (default: 5)');
        console.log('  --help, -h      Show this help');
        console.log('');
        console.log('Examples:');
        console.log('  tsx scripts/vps-restart.ts                # Normal graceful restart');
        console.log('  tsx scripts/vps-restart.ts --force        # Force restart');
        console.log('  tsx scripts/vps-restart.ts --emergency    # Emergency restart');
        console.log('  tsx scripts/vps-restart.ts --no-graceful --wait 10');
        return;
    }
  }
  
  await restartOrchestrator(options);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { restartOrchestrator, emergencyRestart };