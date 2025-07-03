import { SupabaseClient } from '@supabase/supabase-js';
import { QueueItem, UniversalListing } from './models';
import { EventEmitter } from 'events';

export interface QueueConfig {
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  staleThreshold: number;       // Hours before data is considered stale
  priorityWeights: {
    new: number;
    incomplete: number;
    stale: number;
    platform: Record<string, number>;
  };
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  byPlatform: Record<string, {
    pending: number;
    processing: number;
    avgProcessingTime: number;
  }>;
}

export interface ProcessingResult {
  itemId: string;
  success: boolean;
  data?: UniversalListing;
  error?: string;
  duration: number;
}

/**
 * Smart queue system for managing scraping tasks across platforms
 */
export class UniversalScrapingQueue extends EventEmitter {
  private supabase: SupabaseClient;
  private isProcessing = false;
  private processingItems = new Set<string>();
  
  private config: QueueConfig = {
    batchSize: 50,
    maxRetries: 3,
    retryDelay: 5 * 60 * 1000,    // 5 minutes
    staleThreshold: 24,           // 24 hours
    priorityWeights: {
      new: 1000,
      incomplete: 500,
      stale: 100,
      platform: {
        wg_gesucht: 200,
        immobilienscout24: 300,
        ebay_kleinanzeigen: 100
      }
    }
  };
  
  constructor(supabaseUrl: string, supabaseKey: string, config?: Partial<QueueConfig>) {
    super();
    const { createClient } = require('@supabase/supabase-js');
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }
  
  /**
   * Add items to the queue
   */
  async enqueue(items: Partial<QueueItem>[]): Promise<number> {
    const queueItems = items.map(item => ({
      id: item.id || this.generateId(),
      platform: item.platform!,
      url: item.url!,
      listing_id: item.listingId,
      priority: item.priority || this.calculatePriority(item),
      attempts: 0,
      last_attempt: null,
      status: 'pending',
      data_needed: item.dataNeeded || {
        basic: true,
        description: true,
        contact: true,
        images: true,
        amenities: true
      },
      metadata: item.metadata || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await this.supabase
      .from('scraping_queue')
      .upsert(queueItems, {
        onConflict: 'platform,url',
        ignoreDuplicates: false
      })
      .select();
    
    if (error) {
      console.error('Failed to enqueue items:', error);
      throw error;
    }
    
    const count = data?.length || 0;
    console.log(`📥 Enqueued ${count} items`);
    this.emit('itemsEnqueued', { count, items: data });
    
    return count;
  }
  
  /**
   * Get next batch of items to process
   */
  async getNextBatch(platformFilter?: string): Promise<QueueItem[]> {
    // Build query with smart prioritization
    let query = this.supabase
      .from('scraping_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', this.config.maxRetries)
      .or(`last_attempt.is.null,last_attempt.lt.${new Date(Date.now() - this.config.retryDelay).toISOString()}`)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(this.config.batchSize);
    
    if (platformFilter) {
      query = query.eq('platform', platformFilter);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Failed to get queue items:', error);
      return [];
    }
    
    // Mark items as processing
    if (data && data.length > 0) {
      const ids = data.map(item => item.id);
      await this.markProcessing(ids);
    }
    
    return data || [];
  }
  
  /**
   * Get items by platform with smart batching
   */
  async getByPlatform(): Promise<Map<string, QueueItem[]>> {
    const { data, error } = await this.supabase
      .from('scraping_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', this.config.maxRetries)
      .order('priority', { ascending: false })
      .limit(this.config.batchSize * 3); // Get more to distribute across platforms
    
    if (error || !data) {
      return new Map();
    }
    
    // Group by platform
    const grouped = new Map<string, QueueItem[]>();
    for (const item of data) {
      const platform = item.platform;
      if (!grouped.has(platform)) {
        grouped.set(platform, []);
      }
      grouped.get(platform)!.push(item);
    }
    
    // Limit each platform to fair share
    const fairShare = Math.ceil(this.config.batchSize / grouped.size);
    for (const [platform, items] of grouped.entries()) {
      if (items.length > fairShare) {
        grouped.set(platform, items.slice(0, fairShare));
      }
    }
    
    return grouped;
  }
  
  /**
   * Mark items as processing
   */
  async markProcessing(ids: string[]): Promise<void> {
    await this.supabase
      .from('scraping_queue')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .in('id', ids);
    
    ids.forEach(id => this.processingItems.add(id));
  }
  
  /**
   * Mark item as completed
   */
  async markCompleted(itemId: string, result: ProcessingResult): Promise<void> {
    const updates: any = {
      status: 'completed',
      processing_ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (result.data) {
      updates.extracted_data = result.data;
    }
    
    await this.supabase
      .from('scraping_queue')
      .update(updates)
      .eq('id', itemId);
    
    this.processingItems.delete(itemId);
    this.emit('itemCompleted', { itemId, result });
  }
  
  /**
   * Mark item as failed
   */
  async markFailed(itemId: string, error: string): Promise<void> {
    const { data: item } = await this.supabase
      .from('scraping_queue')
      .select('attempts')
      .eq('id', itemId)
      .single();
    
    const attempts = (item?.attempts || 0) + 1;
    const status = attempts >= this.config.maxRetries ? 'failed' : 'pending';
    
    await this.supabase
      .from('scraping_queue')
      .update({
        status,
        attempts,
        last_attempt: new Date().toISOString(),
        error_message: error,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);
    
    this.processingItems.delete(itemId);
    this.emit('itemFailed', { itemId, error, attempts, final: status === 'failed' });
  }
  
  /**
   * Get queue statistics
   */
  async getStats(): Promise<QueueStats> {
    const { data: statusCounts } = await this.supabase
      .from('scraping_queue')
      .select('status, platform')
      .select();
    
    const stats: QueueStats = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byPlatform: {}
    };
    
    if (statusCounts) {
      for (const row of statusCounts) {
        stats.total++;
        stats[row.status as keyof QueueStats]++;
        
        if (!stats.byPlatform[row.platform]) {
          stats.byPlatform[row.platform] = {
            pending: 0,
            processing: 0,
            avgProcessingTime: 0
          };
        }
        
        if (row.status === 'pending' || row.status === 'processing') {
          stats.byPlatform[row.platform][row.status]++;
        }
      }
    }
    
    // Calculate average processing times
    for (const platform of Object.keys(stats.byPlatform)) {
      const { data: completed } = await this.supabase
        .from('scraping_queue')
        .select('processing_started_at, processing_ended_at')
        .eq('platform', platform)
        .eq('status', 'completed')
        .not('processing_started_at', 'is', null)
        .not('processing_ended_at', 'is', null)
        .limit(100);
      
      if (completed && completed.length > 0) {
        const times = completed.map(item => 
          new Date(item.processing_ended_at).getTime() - 
          new Date(item.processing_started_at).getTime()
        );
        stats.byPlatform[platform].avgProcessingTime = 
          times.reduce((a, b) => a + b, 0) / times.length;
      }
    }
    
    return stats;
  }
  
  /**
   * Clean up old completed items
   */
  async cleanup(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const { data, error } = await this.supabase
      .from('scraping_queue')
      .delete()
      .eq('status', 'completed')
      .lt('updated_at', cutoffDate.toISOString())
      .select();
    
    const count = data?.length || 0;
    console.log(`🧹 Cleaned up ${count} old queue items`);
    
    return count;
  }
  
  /**
   * Requeue failed items
   */
  async requeueFailed(): Promise<number> {
    const { data, error } = await this.supabase
      .from('scraping_queue')
      .update({
        status: 'pending',
        attempts: 0,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('status', 'failed')
      .select();
    
    const count = data?.length || 0;
    console.log(`🔄 Requeued ${count} failed items`);
    
    return count;
  }
  
  /**
   * Find and enqueue missing data
   */
  async enqueueMissingData(): Promise<number> {
    // Find listings with incomplete data
    const { data: incomplete } = await this.supabase
      .from('listings')
      .select('id, platform, external_id, url')
      .or('description.is.null,images.eq.{},contact_name.is.null')
      .eq('is_active', true)
      .limit(100);
    
    if (!incomplete || incomplete.length === 0) {
      return 0;
    }
    
    // Create queue items for missing data
    const queueItems = incomplete.map(listing => ({
      platform: listing.platform,
      url: listing.url,
      listingId: listing.id,
      priority: this.config.priorityWeights.incomplete,
      dataNeeded: {
        basic: false,  // Already have basic data
        description: !listing.description,
        contact: !listing.contact_name,
        images: !listing.images || listing.images.length === 0,
        amenities: true
      }
    }));
    
    return await this.enqueue(queueItems);
  }
  
  /**
   * Find and enqueue stale listings
   */
  async enqueueStaleListings(): Promise<number> {
    const staleDate = new Date();
    staleDate.setHours(staleDate.getHours() - this.config.staleThreshold);
    
    const { data: stale } = await this.supabase
      .from('listings')
      .select('id, platform, external_id, url')
      .lt('updated_at', staleDate.toISOString())
      .eq('is_active', true)
      .limit(50);
    
    if (!stale || stale.length === 0) {
      return 0;
    }
    
    const queueItems = stale.map(listing => ({
      platform: listing.platform,
      url: listing.url,
      listingId: listing.id,
      priority: this.config.priorityWeights.stale,
      dataNeeded: {
        basic: true,
        description: true,
        contact: true,
        images: true,
        amenities: true
      }
    }));
    
    return await this.enqueue(queueItems);
  }
  
  /**
   * Calculate priority based on various factors
   */
  private calculatePriority(item: Partial<QueueItem>): number {
    let priority = 0;
    
    // New listing priority
    if (!item.listingId) {
      priority += this.config.priorityWeights.new;
    }
    
    // Platform priority
    if (item.platform && this.config.priorityWeights.platform[item.platform]) {
      priority += this.config.priorityWeights.platform[item.platform];
    }
    
    // Data completeness priority
    if (item.dataNeeded) {
      const missingFields = Object.values(item.dataNeeded).filter(needed => needed).length;
      priority += missingFields * 100;
    }
    
    return priority;
  }
  
  private generateId(): string {
    return `qi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Queue manager instance factory
export function createScrapingQueue(supabaseUrl: string, supabaseKey: string, config?: Partial<QueueConfig>): UniversalScrapingQueue {
  return new UniversalScrapingQueue(supabaseUrl, supabaseKey, config);
}