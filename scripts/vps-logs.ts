import { config } from 'dotenv';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
config({ path: '.env.production' });

const execAsync = promisify(exec);

interface LogViewerOptions {
  follow?: boolean;      // Follow logs in real-time
  lines?: number;        // Number of lines to show
  filter?: string;       // Filter logs by pattern
  level?: 'error' | 'warn' | 'info' | 'debug';  // Filter by log level
  since?: string;        // Show logs since timestamp
}

/**
 * Get available log files
 */
async function getAvailableLogFiles(): Promise<string[]> {
  const logDir = './logs';
  const logFiles: string[] = [];
  
  try {
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir);
      files.forEach(file => {
        if (file.endsWith('.log')) {
          logFiles.push(path.join(logDir, file));
        }
      });
    }
    
    // Add PM2 logs if available
    try {
      const { stdout } = await execAsync('pm2 list');
      if (stdout.includes('orchestrator')) {
        logFiles.push('pm2:orchestrator');
      }
    } catch {
      // PM2 not available or no processes
    }
    
  } catch (error) {
    console.warn('Could not scan log directory:', error);
  }
  
  return logFiles;
}

/**
 * View file-based logs
 */
function viewFileLog(filePath: string, options: LogViewerOptions = {}) {
  const {
    follow = false,
    lines = 100,
    filter,
    level,
    since
  } = options;
  
  let command = `tail`;
  let args = ['-n', lines.toString()];
  
  if (follow) {
    args.push('-f');
  }
  
  args.push(filePath);
  
  console.log(`📋 Viewing ${filePath}${follow ? ' (following)' : ''}...`);
  console.log('─'.repeat(60));
  
  const tail = spawn(command, args);
  
  tail.stdout.on('data', (data) => {
    const lines = data.toString().split('\\n');
    
    lines.forEach(line => {
      if (line.trim()) {
        // Apply filters
        if (filter && !line.toLowerCase().includes(filter.toLowerCase())) {
          return;
        }
        
        if (level && !line.toLowerCase().includes(level.toLowerCase())) {
          return;
        }
        
        if (since) {
          // Basic since filtering (this could be improved)
          const sinceTime = new Date(since);
          const logTime = extractTimestamp(line);
          if (logTime && logTime < sinceTime) {
            return;
          }
        }
        
        // Colorize log output
        console.log(colorizeLogLine(line));
      }
    });
  });
  
  tail.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
  });
  
  tail.on('close', (code) => {
    if (code !== 0) {
      console.error(`Log viewer exited with code ${code}`);
    }
  });
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\\n👋 Stopping log viewer...');
    tail.kill('SIGTERM');
    process.exit(0);
  });
}

/**
 * View PM2 logs
 */
function viewPM2Log(processName: string, options: LogViewerOptions = {}) {
  const {
    follow = false,
    lines = 100,
    filter,
    level
  } = options;
  
  let command = 'pm2';
  let args = ['logs', processName];
  
  if (!follow) {
    args.push('--lines', lines.toString());
  }
  
  console.log(`📋 Viewing PM2 logs for ${processName}${follow ? ' (following)' : ''}...`);
  console.log('─'.repeat(60));
  
  const pm2logs = spawn(command, args);
  
  pm2logs.stdout.on('data', (data) => {
    const lines = data.toString().split('\\n');
    
    lines.forEach(line => {
      if (line.trim()) {
        // Apply filters
        if (filter && !line.toLowerCase().includes(filter.toLowerCase())) {
          return;
        }
        
        if (level && !line.toLowerCase().includes(level.toLowerCase())) {
          return;
        }
        
        // Colorize log output
        console.log(colorizeLogLine(line));
      }
    });
  });
  
  pm2logs.stderr.on('data', (data) => {
    console.error(`Error: ${data}`);
  });
  
  pm2logs.on('close', (code) => {
    if (code !== 0) {
      console.error(`PM2 logs exited with code ${code}`);
    }
  });
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\\n👋 Stopping log viewer...');
    pm2logs.kill('SIGTERM');
    process.exit(0);
  });
}

/**
 * Extract timestamp from log line
 */
function extractTimestamp(line: string): Date | null {
  // Try to extract common timestamp formats
  const timestampPatterns = [
    /\\d{4}-\\d{2}-\\d{2}[T\\s]\\d{2}:\\d{2}:\\d{2}/,  // ISO format
    /\\d{2}:\\d{2}:\\d{2}/,                              // Time only
  ];
  
  for (const pattern of timestampPatterns) {
    const match = line.match(pattern);
    if (match) {
      try {
        return new Date(match[0]);
      } catch {
        continue;
      }
    }
  }
  
  return null;
}

/**
 * Colorize log lines based on content
 */
function colorizeLogLine(line: string): string {
  // ANSI color codes
  const colors = {
    reset: '\\033[0m',
    red: '\\033[31m',
    green: '\\033[32m',
    yellow: '\\033[33m',
    blue: '\\033[34m',
    magenta: '\\033[35m',
    cyan: '\\033[36m',
    gray: '\\033[90m'
  };
  
  // Error patterns
  if (line.match(/error|fail|exception|crash/i)) {
    return `${colors.red}${line}${colors.reset}`;
  }
  
  // Warning patterns
  if (line.match(/warn|warning|deprecated/i)) {
    return `${colors.yellow}${line}${colors.reset}`;
  }
  
  // Success patterns
  if (line.match(/success|completed|✅|done/i)) {
    return `${colors.green}${line}${colors.reset}`;
  }
  
  // Info patterns
  if (line.match(/info|starting|running/i)) {
    return `${colors.blue}${line}${colors.reset}`;
  }
  
  // Debug patterns
  if (line.match(/debug|trace/i)) {
    return `${colors.gray}${line}${colors.reset}`;
  }
  
  // Timestamp highlighting
  line = line.replace(/(\\d{4}-\\d{2}-\\d{2}[T\\s]\\d{2}:\\d{2}:\\d{2})/g, `${colors.cyan}$1${colors.reset}`);
  
  return line;
}

/**
 * Show log menu
 */
async function showLogMenu(): Promise<void> {
  const availableLogs = await getAvailableLogFiles();
  
  console.log('📋 Available Logs');
  console.log('═'.repeat(30));
  
  if (availableLogs.length === 0) {
    console.log('No log files found');
    return;
  }
  
  availableLogs.forEach((log, index) => {
    console.log(`${index + 1}. ${log}`);
  });
  
  console.log('\\nUsage examples:');
  console.log('  npm run logs              # Show this menu');
  console.log('  npm run logs -- --file logs/orchestrator.log');
  console.log('  npm run logs -- --pm2 orchestrator');
  console.log('  npm run logs -- --follow');
  console.log('  npm run logs -- --filter "error"');
  console.log('  npm run logs -- --level error');
  console.log('  npm run logs -- --lines 50');
}

/**
 * Main log viewer function
 */
async function viewLogs(args: string[] = []): Promise<void> {
  const options: LogViewerOptions = {};
  let logSource: string | null = null;
  let logType: 'file' | 'pm2' = 'file';
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--file':
        logType = 'file';
        logSource = args[++i];
        break;
      case '--pm2':
        logType = 'pm2';
        logSource = args[++i];
        break;
      case '--follow':
      case '-f':
        options.follow = true;
        break;
      case '--lines':
      case '-n':
        options.lines = parseInt(args[++i]) || 100;
        break;
      case '--filter':
        options.filter = args[++i];
        break;
      case '--level':
        options.level = args[++i] as any;
        break;
      case '--since':
        options.since = args[++i];
        break;
      case '--help':
      case '-h':
        await showLogMenu();
        return;
    }
  }
  
  // If no specific log source, show menu
  if (!logSource) {
    await showLogMenu();
    return;
  }
  
  // View the specified log
  if (logType === 'pm2') {
    viewPM2Log(logSource, options);
  } else {
    if (!fs.existsSync(logSource)) {
      console.error(`❌ Log file not found: ${logSource}`);
      process.exit(1);
    }
    viewFileLog(logSource, options);
  }
}

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  viewLogs(args).catch(console.error);
}

export { viewLogs, getAvailableLogFiles };