import { config } from 'dotenv';
import { createOrchestrator, OrchestratorConfig } from '../src/features/scraping/core/scrape-orchestrator';

// Load environment variables
config({ path: '.env.production' });

/**
 * Production orchestrator entry point for VPS deployment
 */
async function startOrchestrator() {
  console.log('🚀 Starting FlatApply Scraping Orchestrator...');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🏠 Environment: ${process.env.NODE_ENV || 'production'}`);
  
  // Validate required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Production orchestrator configuration
  const config: Partial<OrchestratorConfig> = {
    maxConcurrentPlatforms: parseInt(process.env.MAX_CONCURRENT_PLATFORMS || '2'),
    maxConcurrentPages: parseInt(process.env.MAX_CONCURRENT_PAGES || '5'),
    batchSize: parseInt(process.env.BATCH_SIZE || '25'),
    discoveryInterval: parseInt(process.env.DISCOVERY_INTERVAL || '30'), // 30 minutes
    updateInterval: parseInt(process.env.UPDATE_INTERVAL || '15'),        // 15 minutes  
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '5'), // 5 minutes
    enableAutoDiscovery: process.env.ENABLE_AUTO_DISCOVERY !== 'false',
    enableAutoMatching: process.env.ENABLE_AUTO_MATCHING !== 'false',
    enableAutoCleanup: process.env.ENABLE_AUTO_CLEANUP !== 'false'
  };
  
  console.log('⚙️  Configuration:', JSON.stringify(config, null, 2));
  
  try {
    // Create and start orchestrator
    const orchestrator = createOrchestrator(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      config
    );
    
    // Setup event listeners for monitoring
    orchestrator.on('started', (data) => {
      console.log('✅ Orchestrator started successfully');
      console.log('📊 Configuration:', data.config);
    });
    
    orchestrator.on('discoveryCompleted', (data) => {
      console.log(`🔍 Discovery completed: ${data.platforms} platforms in ${data.duration}ms`);
    });
    
    orchestrator.on('updateCompleted', (data) => {
      console.log(`🔄 Update completed: ${data.processed} processed, ${data.new} new, ${data.updated} updated in ${data.duration}ms`);
    });
    
    orchestrator.on('healthWarning', (data) => {
      console.warn('⚠️  Health warning:', data.type, data.stats);
    });
    
    orchestrator.on('stopped', (data) => {
      console.log('🛑 Orchestrator stopped');
      console.log('📊 Final stats:', data.stats);
      process.exit(0);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\\n📡 Received SIGINT, shutting down gracefully...');
      await orchestrator.stop();
    });
    
    process.on('SIGTERM', async () => {
      console.log('\\n📡 Received SIGTERM, shutting down gracefully...');
      await orchestrator.stop();
    });
    
    process.on('uncaughtException', async (error) => {
      console.error('💥 Uncaught exception:', error);
      await orchestrator.stop();
      process.exit(1);
    });
    
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
      await orchestrator.stop();
      process.exit(1);
    });
    
    // Start the orchestrator
    await orchestrator.start();
    
    // Keep the process alive
    console.log('🔄 Orchestrator is running... Press Ctrl+C to stop');
    
    // Optional: Log stats every hour
    setInterval(() => {
      const stats = orchestrator.getStats();
      console.log('📊 Hourly stats:', {
        uptime: Math.round((Date.now() - stats.startTime.getTime()) / 1000 / 60),
        processed: stats.totalListingsProcessed,
        matches: stats.totalMatchesCreated,
        errors: stats.errors.length
      });
    }, 60 * 60 * 1000); // Every hour
    
  } catch (error) {
    console.error('❌ Failed to start orchestrator:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  startOrchestrator().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

export { startOrchestrator };