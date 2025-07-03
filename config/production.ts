import { OrchestratorConfig } from '../src/features/scraping/core/scrape-orchestrator';

/**
 * Production configuration for the orchestrator
 * Optimized for VPS deployment with resource constraints
 */
export const productionConfig: Partial<OrchestratorConfig> = {
  // Concurrency limits - conservative for VPS
  maxConcurrentPlatforms: 2,     // Process 2 platforms at once
  maxConcurrentPages: 5,         // Max 5 browser pages total
  batchSize: 25,                 // Process 25 listings per batch
  
  // Timing intervals (in minutes)
  discoveryInterval: 30,         // Discover new listings every 30 minutes
  updateInterval: 15,            // Update existing listings every 15 minutes
  healthCheckInterval: 5,        // Health check every 5 minutes
  
  // Feature flags
  enableAutoDiscovery: true,     // Automatically discover new listings
  enableAutoMatching: true,      // Automatically create user matches
  enableAutoCleanup: true,       // Clean up old data automatically
};

/**
 * Browser pool configuration for production
 */
export const browserPoolConfig = {
  maxBrowsersPerPlatform: 2,     // Max 2 browsers per platform
  maxTotalBrowsers: 5,           // Max 5 browsers total
  browserTimeout: 30000,         // 30 second timeout
  pageTimeout: 30000,            // 30 second page timeout
  
  // Resource limits
  memoryLimit: 256,              // 256MB per browser process
  
  // Browser launch options
  launchOptions: {
    headless: true,              // Always headless in production
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-images',          // Disable images for faster loading
      '--disable-javascript',      // We'll enable selectively
    ],
  },
};

/**
 * Platform-specific configurations
 */
export const platformConfigs = {
  wg_gesucht: {
    enabled: true,
    priority: 'high' as const,
    maxRequestsPerHour: 120,     // Conservative rate limiting
    searchConfig: {
      defaultPages: 3,           // Search first 3 pages
      resultsPerPage: 50,
      categories: ['wg-zimmer', 'wohnungen', 'haeuser'],
    },
    features: {
      hasGallery: true,
      hasPhoneReveal: true,
      hasDetailApi: false,
    },
    rateLimit: {
      requestDelay: 3000,        // 3 second delay between requests
      errorBackoff: 10000,       // 10 second backoff on errors
      maxRetries: 3,
    },
  },
  
  immoscout24: {
    enabled: false,              // Disabled until platform is registered
    priority: 'medium' as const,
    maxRequestsPerHour: 60,      // Lower rate for Apify-based scraping
    searchConfig: {
      defaultPages: 2,
      resultsPerPage: 30,
      categories: ['apartment', 'house'],
    },
    features: {
      hasGallery: true,
      hasPhoneReveal: false,
      hasDetailApi: true,        // Uses Apify API
    },
    rateLimit: {
      requestDelay: 5000,        // 5 second delay for Apify
      errorBackoff: 15000,       // 15 second backoff
      maxRetries: 2,
    },
  },
};

/**
 * Logging configuration for production
 */
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  enableScrapingLogs: process.env.ENABLE_SCRAPING_LOGS === 'true',
  
  // Log rotation
  maxLogSize: '10m',             // 10MB max file size
  maxLogFiles: 5,                // Keep 5 log files
  
  // Log destinations
  console: true,                 // Log to console (PM2 will capture)
  file: true,                    // Log to files
  
  // Performance logging
  enablePerformanceLogs: true,   // Log performance metrics
  enableErrorTracking: true,     // Track errors for analysis
};

/**
 * Database configuration for production
 */
export const databaseConfig = {
  connectionPool: {
    min: 2,                      // Minimum connections
    max: 10,                     // Maximum connections
    acquireTimeoutMillis: 30000, // 30 second timeout
    idleTimeoutMillis: 600000,   // 10 minute idle timeout
  },
  
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,            // 1 second initial delay
    backoffMultiplier: 2,        // Exponential backoff
  },
};

/**
 * Monitoring configuration
 */
export const monitoringConfig = {
  healthCheck: {
    enabled: true,
    port: parseInt(process.env.HEALTH_CHECK_PORT || '3001'),
    interval: 5 * 60 * 1000,     // 5 minutes
  },
  
  alerts: {
    webhook: process.env.HEALTH_CHECK_WEBHOOK_URL,
    email: process.env.ADMIN_EMAIL,
    
    // Alert thresholds
    memoryThreshold: 400,        // Alert if memory > 400MB
    errorRateThreshold: 0.1,     // Alert if error rate > 10%
    queueSizeThreshold: 1000,    // Alert if queue > 1000 items
  },
  
  metrics: {
    enabled: true,
    collectInterval: 60000,      // Collect metrics every minute
    retentionDays: 7,            // Keep metrics for 7 days
  },
};

/**
 * Security configuration
 */
export const securityConfig = {
  internalApiSecret: process.env.INTERNAL_API_SECRET || 'change-me-in-production',
  
  // Browser security
  browserSecurity: {
    disableWebSecurity: true,    // Needed for cross-origin requests
    ignoreHTTPSErrors: true,     // Ignore SSL errors for scraping
  },
  
  // Network security
  allowedOrigins: [
    'wg-gesucht.de',
    'immobilienscout24.de',
    'ebay-kleinanzeigen.de',
  ],
};

/**
 * Get complete production configuration
 */
export function getProductionConfig() {
  return {
    orchestrator: productionConfig,
    browserPool: browserPoolConfig,
    platforms: platformConfigs,
    logging: loggingConfig,
    database: databaseConfig,
    monitoring: monitoringConfig,
    security: securityConfig,
  };
}