import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
config({ path: '.env.production' });

const execAsync = promisify(exec);

/**
 * Gracefully stop the orchestrator and clean up resources
 */
async function stopOrchestrator() {
  console.log('🛑 Stopping FlatApply Scraping Orchestrator...');
  
  try {
    // Try to find the orchestrator process using PM2
    console.log('🔍 Looking for running orchestrator processes...');
    
    try {
      const { stdout } = await execAsync('pm2 list');
      console.log('📋 PM2 processes:\\n', stdout);
      
      // Stop the orchestrator process
      console.log('⏹️  Stopping orchestrator process...');
      await execAsync('pm2 stop orchestrator');
      console.log('✅ Orchestrator process stopped');
      
      // Optionally delete the process from PM2
      if (process.argv.includes('--delete')) {
        console.log('🗑️  Deleting orchestrator from PM2...');
        await execAsync('pm2 delete orchestrator');
        console.log('✅ Orchestrator process deleted from PM2');
      }
      
    } catch (pm2Error) {
      console.log('ℹ️  PM2 not found or no processes running');
      
      // Try to find process by name
      try {
        const { stdout } = await execAsync('pgrep -f "start-orchestrator"');
        const pids = stdout.trim().split('\\n').filter(Boolean);
        
        if (pids.length > 0) {
          console.log(`🔍 Found ${pids.length} orchestrator process(es):`, pids);
          
          for (const pid of pids) {
            console.log(`⏹️  Terminating process ${pid}...`);
            try {
              // Try graceful shutdown first
              await execAsync(`kill -TERM ${pid}`);
              console.log(`✅ Sent SIGTERM to process ${pid}`);
              
              // Wait a bit for graceful shutdown
              await new Promise(resolve => setTimeout(resolve, 5000));
              
              // Check if still running
              try {
                await execAsync(`kill -0 ${pid}`);
                console.log(`⚠️  Process ${pid} still running, sending SIGKILL...`);
                await execAsync(`kill -KILL ${pid}`);
              } catch {
                console.log(`✅ Process ${pid} terminated gracefully`);
              }
            } catch (error) {
              console.log(`⚠️  Could not terminate process ${pid}:`, error);
            }
          }
        } else {
          console.log('ℹ️  No orchestrator processes found');
        }
      } catch (pgrepError) {
        console.log('ℹ️  No orchestrator processes found via pgrep');
      }
    }
    
    // Clean up any remaining browser processes
    console.log('🧹 Cleaning up browser processes...');
    try {
      // Kill any lingering Playwright browser processes
      await execAsync('pkill -f "chromium\\|firefox\\|webkit" || true');
      console.log('✅ Browser processes cleaned up');
    } catch (error) {
      console.log('ℹ️  No browser processes to clean up');
    }
    
    // Show final status
    console.log('\\n📊 Final status:');
    try {
      const { stdout } = await execAsync('pm2 list');
      console.log(stdout);
    } catch {
      console.log('PM2 not available');
    }
    
    console.log('\\n✅ Orchestrator stopped successfully');
    
  } catch (error) {
    console.error('❌ Error stopping orchestrator:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  stopOrchestrator().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { stopOrchestrator };