import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { performHealthCheck } from './health-check';

// Load environment variables
config({ path: '.env.production' });

const execAsync = promisify(exec);

interface SystemInfo {
  uptime: string;
  memory: {
    total: string;
    used: string;
    free: string;
    percentage: number;
  };
  disk: {
    total: string;
    used: string;
    available: string;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  network: {
    connections: number;
  };
}

/**
 * Get comprehensive VPS status information
 */
async function getSystemInfo(): Promise<SystemInfo> {
  const info: SystemInfo = {
    uptime: '',
    memory: { total: '', used: '', free: '', percentage: 0 },
    disk: { total: '', used: '', available: '', percentage: 0 },
    cpu: { usage: 0, loadAverage: [] },
    network: { connections: 0 }
  };

  try {
    // System uptime
    const { stdout: uptimeOut } = await execAsync('uptime -p');
    info.uptime = uptimeOut.trim();

    // Memory usage
    const { stdout: memOut } = await execAsync('free -h');
    const memLines = memOut.split('\\n');
    const memData = memLines[1].split(/\\s+/);
    info.memory = {
      total: memData[1],
      used: memData[2],
      free: memData[3],
      percentage: Math.round((parseFloat(memData[2]) / parseFloat(memData[1])) * 100) || 0
    };

    // Disk usage
    const { stdout: diskOut } = await execAsync('df -h /');
    const diskLines = diskOut.split('\\n');
    const diskData = diskLines[1].split(/\\s+/);
    info.disk = {
      total: diskData[1],
      used: diskData[2],
      available: diskData[3],
      percentage: parseInt(diskData[4].replace('%', '')) || 0
    };

    // Load average
    const loadAvg = require('os').loadavg();
    info.cpu = {
      usage: Math.round(loadAvg[0] * 100), // Approximate CPU usage from load average
      loadAverage: loadAvg
    };

    // Network connections
    try {
      const { stdout: netOut } = await execAsync('netstat -an | grep ESTABLISHED | wc -l');
      info.network.connections = parseInt(netOut.trim()) || 0;
    } catch {
      info.network.connections = 0;
    }

  } catch (error) {
    console.warn('⚠️  Could not gather some system information:', error);
  }

  return info;
}

/**
 * Get PM2 process information
 */
async function getPM2Status() {
  try {
    const { stdout } = await execAsync('pm2 jlist');
    return JSON.parse(stdout);
  } catch (error) {
    console.warn('⚠️  Could not get PM2 status:', error);
    return [];
  }
}

/**
 * Get orchestrator-specific metrics
 */
async function getOrchestratorMetrics() {
  try {
    // This would connect to the orchestrator's stats endpoint if available
    // For now, we'll get basic info from logs
    const { stdout } = await execAsync('tail -n 50 ./logs/orchestrator.log | grep -E "(processed|matches|errors)" | tail -5');
    return stdout.trim().split('\\n').filter(Boolean);
  } catch (error) {
    return ['No recent orchestrator metrics available'];
  }
}

/**
 * Print formatted status report
 */
function printStatusReport(systemInfo: SystemInfo, pm2Status: any[], orchestratorMetrics: string[]) {
  console.log('\\n🖥️  VPS System Status');
  console.log('═'.repeat(50));
  
  // System info
  console.log(`⏱️  Uptime: ${systemInfo.uptime}`);
  console.log(`💾 Memory: ${systemInfo.memory.used}/${systemInfo.memory.total} (${systemInfo.memory.percentage}%)`);
  console.log(`💿 Disk: ${systemInfo.disk.used}/${systemInfo.disk.total} (${systemInfo.disk.percentage}%)`);
  console.log(`🔧 CPU Load: ${systemInfo.cpu.loadAverage.map(l => l.toFixed(2)).join(', ')}`);
  console.log(`🌐 Network Connections: ${systemInfo.network.connections}`);
  
  // PM2 processes
  console.log('\\n📋 PM2 Processes');
  console.log('─'.repeat(30));
  
  if (pm2Status.length > 0) {
    pm2Status.forEach(proc => {
      const status = proc.pm2_env?.status || 'unknown';
      const cpu = proc.monit?.cpu || 0;
      const memory = proc.monit?.memory ? `${Math.round(proc.monit.memory / 1024 / 1024)}MB` : '0MB';
      const uptime = proc.pm2_env?.pm_uptime ? new Date(proc.pm2_env.pm_uptime).toLocaleString() : 'unknown';
      const restarts = proc.pm2_env?.restart_time || 0;
      
      const statusIcon = {
        'online': '✅',
        'stopped': '🛑',
        'error': '❌',
        'launching': '🚀'
      }[status] || '❓';
      
      console.log(`${statusIcon} ${proc.name}: ${status}`);
      console.log(`   💾 Memory: ${memory} | 🔧 CPU: ${cpu}% | 🔄 Restarts: ${restarts}`);
      console.log(`   ⏰ Started: ${uptime}`);
    });
  } else {
    console.log('No PM2 processes running');
  }
  
  // Orchestrator metrics
  console.log('\\n📊 Recent Orchestrator Activity');
  console.log('─'.repeat(40));
  
  if (orchestratorMetrics.length > 0) {
    orchestratorMetrics.forEach(metric => {
      console.log(`   ${metric}`);
    });
  } else {
    console.log('   No recent activity logged');
  }
}

/**
 * Main status check function
 */
async function checkVPSStatus() {
  console.log('🔍 Checking VPS status...');
  
  try {
    // Gather all information
    const [systemInfo, pm2Status, orchestratorMetrics] = await Promise.all([
      getSystemInfo(),
      getPM2Status(),
      getOrchestratorMetrics()
    ]);
    
    // Print status report
    printStatusReport(systemInfo, pm2Status, orchestratorMetrics);
    
    // Run health check
    console.log('\\n🏥 Application Health Check');
    console.log('─'.repeat(35));
    
    try {
      await performHealthCheck();
    } catch (error) {
      console.error('Health check failed:', error);
    }
    
    // Resource warnings
    console.log('\\n⚠️  Resource Warnings');
    console.log('─'.repeat(25));
    
    const warnings = [];
    
    if (systemInfo.memory.percentage > 80) {
      warnings.push(`High memory usage: ${systemInfo.memory.percentage}%`);
    }
    
    if (systemInfo.disk.percentage > 85) {
      warnings.push(`High disk usage: ${systemInfo.disk.percentage}%`);
    }
    
    if (systemInfo.cpu.loadAverage[0] > 2) {
      warnings.push(`High CPU load: ${systemInfo.cpu.loadAverage[0].toFixed(2)}`);
    }
    
    if (warnings.length > 0) {
      warnings.forEach(warning => console.log(`   ⚠️  ${warning}`));
    } else {
      console.log('   ✅ No resource warnings');
    }
    
    console.log('\\n✅ Status check completed\\n');
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  checkVPSStatus();
}

export { checkVPSStatus, getSystemInfo, getPM2Status };