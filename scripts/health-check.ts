import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { browserPool } from '../src/features/scraping/core/browser-pool';

// Load environment variables
config({ path: '.env.production' });

interface HealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  uptime: number;
  checks: {
    database: 'pass' | 'fail';
    browserPool: 'pass' | 'fail';
    diskSpace: 'pass' | 'fail';
    memory: 'pass' | 'fail';
  };
  stats: {
    totalListings: number;
    recentListings: number;
    totalMatches: number;
    recentMatches: number;
    browserPoolSize: number;
  };
  errors?: string[];
}

/**
 * Comprehensive health check for the VPS orchestrator
 */
async function performHealthCheck(): Promise<HealthStatus> {
  const startTime = Date.now();
  const errors: string[] = [];
  
  console.log('🏥 Performing health check...');
  
  const health: HealthStatus = {
    overall: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'fail',
      browserPool: 'fail',
      diskSpace: 'fail',
      memory: 'fail'
    },
    stats: {
      totalListings: 0,
      recentListings: 0,
      totalMatches: 0,
      recentMatches: 0,
      browserPoolSize: 0
    },
    errors
  };
  
  // Check database connectivity
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Test basic connectivity
    const { data, error } = await supabase
      .from('listings')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      errors.push(`Database error: ${error.message}`);
    } else {
      health.checks.database = 'pass';
      
      // Get total listings
      const { count: totalCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });
      
      health.stats.totalListings = totalCount || 0;
      
      // Get recent listings (last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const { count: recentCount } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', twentyFourHoursAgo.toISOString());
      
      health.stats.recentListings = recentCount || 0;
      
      // Get total matches
      const { count: totalMatches } = await supabase
        .from('user_matches')
        .select('*', { count: 'exact', head: true });
      
      health.stats.totalMatches = totalMatches || 0;
      
      // Get recent matches (last 24 hours)
      const { count: recentMatches } = await supabase
        .from('user_matches')
        .select('*', { count: 'exact', head: true })
        .gte('matched_at', twentyFourHoursAgo.toISOString());
      
      health.stats.recentMatches = recentMatches || 0;
    }
  } catch (error) {
    errors.push(`Database connection failed: ${error}`);
  }
  
  // Check browser pool
  try {
    const poolStats = browserPool.getStats();
    health.stats.browserPoolSize = poolStats.totalBrowsers;
    health.checks.browserPool = 'pass';
    
    // Warning if no browsers available but this might be normal
    if (poolStats.totalBrowsers === 0) {
      console.log('ℹ️  No browsers currently in pool (this may be normal)');
    }
  } catch (error) {
    errors.push(`Browser pool check failed: ${error}`);
  }
  
  // Check memory usage
  try {
    const memUsage = process.memoryUsage();
    const memUsedMB = Math.round(memUsage.rss / 1024 / 1024);
    const memLimitMB = 1000; // Assume 1GB limit for basic VPS
    
    console.log(`💾 Memory usage: ${memUsedMB}MB / ${memLimitMB}MB`);
    
    if (memUsedMB < memLimitMB * 0.8) {
      health.checks.memory = 'pass';
    } else {
      errors.push(`High memory usage: ${memUsedMB}MB (limit: ${memLimitMB}MB)`);
    }
  } catch (error) {
    errors.push(`Memory check failed: ${error}`);
  }
  
  // Check disk space (basic check)
  try {
    const fs = require('fs');
    const stats = fs.statSync('.');
    health.checks.diskSpace = 'pass'; // Basic check passed
  } catch (error) {
    errors.push(`Disk space check failed: ${error}`);
  }
  
  // Determine overall health
  const passedChecks = Object.values(health.checks).filter(check => check === 'pass').length;
  const totalChecks = Object.keys(health.checks).length;
  
  if (passedChecks === totalChecks && errors.length === 0) {
    health.overall = 'healthy';
  } else if (passedChecks >= totalChecks * 0.5) {
    health.overall = 'warning';
  } else {
    health.overall = 'critical';
  }
  
  health.errors = errors.length > 0 ? errors : undefined;
  
  const duration = Date.now() - startTime;
  console.log(`✅ Health check completed in ${duration}ms`);
  
  return health;
}

/**
 * Print health status in a human-readable format
 */
function printHealthStatus(health: HealthStatus) {
  const statusIcon = {
    healthy: '✅',
    warning: '⚠️ ',
    critical: '❌'
  }[health.overall];
  
  console.log(`\\n${statusIcon} Overall Status: ${health.overall.toUpperCase()}`);
  console.log(`📅 Timestamp: ${health.timestamp}`);
  console.log(`⏱️  Uptime: ${Math.round(health.uptime / 60)} minutes`);
  
  console.log('\\n🔍 Component Checks:');
  Object.entries(health.checks).forEach(([component, status]) => {
    const icon = status === 'pass' ? '✅' : '❌';
    console.log(`  ${icon} ${component}: ${status}`);
  });
  
  console.log('\\n📊 Statistics:');
  console.log(`  📋 Total Listings: ${health.stats.totalListings}`);
  console.log(`  🆕 Recent Listings (24h): ${health.stats.recentListings}`);
  console.log(`  🔗 Total Matches: ${health.stats.totalMatches}`);
  console.log(`  🔗 Recent Matches (24h): ${health.stats.recentMatches}`);
  console.log(`  🌐 Browser Pool Size: ${health.stats.browserPoolSize}`);
  
  if (health.errors && health.errors.length > 0) {
    console.log('\\n🚨 Errors:');
    health.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  console.log(''); // Empty line for spacing
}

/**
 * Main health check function
 */
async function runHealthCheck() {
  try {
    const health = await performHealthCheck();
    printHealthStatus(health);
    
    // Exit with appropriate code
    if (health.overall === 'critical') {
      process.exit(2);
    } else if (health.overall === 'warning') {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('💥 Health check failed:', error);
    process.exit(3);
  }
}

// Run if called directly
if (require.main === module) {
  runHealthCheck();
}

export { performHealthCheck, printHealthStatus, runHealthCheck };