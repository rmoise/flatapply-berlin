import { SupabaseClient } from '@supabase/supabase-js';
import { UniversalListing, PropertyType, StandardAmenities, MatchResult } from './models';
import { EventEmitter } from 'events';

export interface UserPreferences {
  id: string;
  email: string;
  platforms: string[];
  
  // Location preferences
  districts: string[];
  maxDistanceFromCenter?: number;
  
  // Budget
  minRent: number;
  maxRent: number;
  includeUtilities: boolean;
  
  // Property preferences
  minSize?: number;
  maxSize?: number;
  minRooms?: number;
  maxRooms?: number;
  propertyTypes: PropertyType[];
  
  // Timing
  moveInDate?: Date;
  flexibleDates: boolean;
  
  // Amenities (required)
  requiredAmenities: Partial<StandardAmenities>;
  
  // WG preferences
  wgPreferences?: {
    maxFlatmates?: number;
    preferredGender?: 'male' | 'female' | 'any';
    ageRange?: { min: number; max: number };
  };
  
  // Matching settings
  minMatchScore: number;
  maxMatchesPerDay?: number;
  
  // Notification preferences
  notifyImmediately: boolean;
  notificationChannels: ('email' | 'sms' | 'push')[];
}

export interface MatchConfig {
  weights: {
    price: number;
    location: number;
    size: number;
    amenities: number;
    availability: number;
    propertyType: number;
  };
  penalties: {
    overBudget: number;
    wrongDistrict: number;
    missingAmenity: number;
    wrongPropertyType: number;
  };
  bonuses: {
    underBudget: number;
    perfectLocation: number;
    extraAmenities: number;
    immediateAvailability: number;
  };
}

export interface MatchStats {
  totalMatches: number;
  byPlatform: Record<string, number>;
  byScore: {
    excellent: number;    // 90-100
    good: number;        // 70-89
    fair: number;        // 60-69
  };
  averageScore: number;
  processingTime: number;
}

/**
 * Universal match engine for cross-platform listing matching
 */
export class UniversalMatchEngine extends EventEmitter {
  private supabase: SupabaseClient;
  
  private config: MatchConfig = {
    weights: {
      price: 0.35,
      location: 0.30,
      size: 0.15,
      amenities: 0.10,
      availability: 0.05,
      propertyType: 0.05
    },
    penalties: {
      overBudget: 40,
      wrongDistrict: 30,
      missingAmenity: 5,
      wrongPropertyType: 20
    },
    bonuses: {
      underBudget: 10,
      perfectLocation: 15,
      extraAmenities: 5,
      immediateAvailability: 10
    }
  };
  
  constructor(supabaseUrl: string, supabaseKey: string, config?: Partial<MatchConfig>) {
    super();
    const { createClient } = require('@supabase/supabase-js');
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    if (config) {
      this.config = {
        ...this.config,
        weights: { ...this.config.weights, ...config.weights },
        penalties: { ...this.config.penalties, ...config.penalties },
        bonuses: { ...this.config.bonuses, ...config.bonuses }
      };
    }
  }
  
  /**
   * Create matches for new listings
   */
  async createMatches(listings: UniversalListing[]): Promise<MatchStats> {
    const startTime = Date.now();
    const stats: MatchStats = {
      totalMatches: 0,
      byPlatform: {},
      byScore: { excellent: 0, good: 0, fair: 0 },
      averageScore: 0,
      processingTime: 0
    };
    
    console.log(`🔍 Creating matches for ${listings.length} listings...`);
    
    // Get all active users with preferences
    const users = await this.getActiveUsersWithPreferences();
    if (users.length === 0) {
      console.log('No active users found');
      return stats;
    }
    
    console.log(`👥 Matching against ${users.length} users`);
    
    const allMatches: any[] = [];
    
    // Process each listing
    for (const listing of listings) {
      const listingMatches = await this.matchListingToUsers(listing, users);
      
      // Track stats
      stats.byPlatform[listing.platform] = (stats.byPlatform[listing.platform] || 0) + listingMatches.length;
      
      for (const match of listingMatches) {
        allMatches.push(match);
        
        // Categorize by score
        if (match.match_score >= 90) stats.byScore.excellent++;
        else if (match.match_score >= 70) stats.byScore.good++;
        else stats.byScore.fair++;
      }
    }
    
    // Bulk insert matches
    if (allMatches.length > 0) {
      await this.bulkInsertMatches(allMatches);
      stats.totalMatches = allMatches.length;
      stats.averageScore = allMatches.reduce((sum, m) => sum + m.match_score, 0) / allMatches.length;
    }
    
    stats.processingTime = Date.now() - startTime;
    
    console.log(`✅ Created ${stats.totalMatches} matches in ${stats.processingTime}ms`);
    console.log(`📊 Average score: ${stats.averageScore.toFixed(1)}`);
    
    this.emit('matchesCreated', stats);
    
    return stats;
  }
  
  /**
   * Match a single listing to all eligible users
   */
  async matchListingToUsers(listing: UniversalListing, users: UserPreferences[]): Promise<any[]> {
    const matches = [];
    
    for (const user of users) {
      // Check if user wants this platform
      if (!user.platforms.includes(listing.platform)) {
        continue;
      }
      
      // Calculate match score
      const result = await this.calculateMatchScore(listing, user);
      
      // Only create match if above threshold
      if (result.score >= user.minMatchScore) {
        matches.push({
          user_id: user.id,
          listing_id: listing.id,
          platform: listing.platform,
          match_score: result.score,
          match_reasons: result.matchedCriteria,
          created_at: new Date().toISOString(),
          status: 'pending'
        });
      }
    }
    
    return matches;
  }
  
  /**
   * Calculate match score between listing and user preferences
   */
  async calculateMatchScore(listing: UniversalListing, preferences: UserPreferences): Promise<MatchResult> {
    let score = 100;
    const matchedCriteria: string[] = [];
    const missedCriteria: string[] = [];
    
    // 1. Price matching (35% weight)
    const priceScore = this.calculatePriceScore(listing, preferences);
    score = score - (100 - priceScore) * this.config.weights.price;
    
    if (priceScore === 100) matchedCriteria.push('Perfect price match');
    else if (priceScore >= 70) matchedCriteria.push('Good price match');
    else missedCriteria.push('Price outside preferred range');
    
    // 2. Location matching (30% weight)
    const locationScore = this.calculateLocationScore(listing, preferences);
    score = score - (100 - locationScore) * this.config.weights.location;
    
    if (locationScore === 100) matchedCriteria.push('Perfect location');
    else if (locationScore >= 70) matchedCriteria.push('Good location');
    else missedCriteria.push('Location not in preferred areas');
    
    // 3. Size matching (15% weight)
    const sizeScore = this.calculateSizeScore(listing, preferences);
    score = score - (100 - sizeScore) * this.config.weights.size;
    
    if (sizeScore >= 80) matchedCriteria.push('Size matches preferences');
    else if (sizeScore < 50) missedCriteria.push('Size mismatch');
    
    // 4. Amenities matching (10% weight)
    const amenityScore = this.calculateAmenityScore(listing, preferences);
    score = score - (100 - amenityScore) * this.config.weights.amenities;
    
    if (amenityScore === 100) matchedCriteria.push('All required amenities');
    else if (amenityScore < 70) missedCriteria.push('Missing required amenities');
    
    // 5. Availability matching (5% weight)
    const availabilityScore = this.calculateAvailabilityScore(listing, preferences);
    score = score - (100 - availabilityScore) * this.config.weights.availability;
    
    if (availabilityScore === 100) matchedCriteria.push('Available when needed');
    else if (availabilityScore < 50) missedCriteria.push('Availability mismatch');
    
    // 6. Property type matching (5% weight)
    const propertyTypeScore = this.calculatePropertyTypeScore(listing, preferences);
    score = score - (100 - propertyTypeScore) * this.config.weights.propertyType;
    
    if (propertyTypeScore === 100) matchedCriteria.push('Preferred property type');
    else if (propertyTypeScore === 0) missedCriteria.push('Wrong property type');
    
    // Apply bonuses
    score = this.applyBonuses(score, listing, preferences, matchedCriteria);
    
    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    return {
      userId: preferences.id,
      listingId: listing.id!,
      platform: listing.platform,
      score,
      matchedCriteria,
      missedCriteria,
      createdAt: new Date()
    };
  }
  
  private calculatePriceScore(listing: UniversalListing, preferences: UserPreferences): number {
    const totalRent = listing.costs.totalRent;
    
    // Over budget - heavy penalty
    if (totalRent > preferences.maxRent) {
      const overBudgetPercent = ((totalRent - preferences.maxRent) / preferences.maxRent) * 100;
      return Math.max(0, 100 - this.config.penalties.overBudget - overBudgetPercent);
    }
    
    // Under minimum - might be suspicious
    if (totalRent < preferences.minRent) {
      const underBudgetPercent = ((preferences.minRent - totalRent) / preferences.minRent) * 100;
      return Math.max(70, 100 - underBudgetPercent / 2);
    }
    
    // Within range - calculate position
    const range = preferences.maxRent - preferences.minRent;
    const position = (totalRent - preferences.minRent) / range;
    
    // Prefer lower prices within range
    return 100 - (position * 20);
  }
  
  private calculateLocationScore(listing: UniversalListing, preferences: UserPreferences): number {
    if (!listing.location.district) return 50; // Unknown location
    
    // Check if in preferred districts
    if (preferences.districts.length > 0) {
      const district = listing.location.district.toLowerCase();
      const isPreferred = preferences.districts.some(d => 
        district.includes(d.toLowerCase()) || d.toLowerCase().includes(district)
      );
      
      if (isPreferred) {
        return 100;
      } else {
        return 100 - this.config.penalties.wrongDistrict;
      }
    }
    
    // If no district preference, check distance from center
    if (preferences.maxDistanceFromCenter && listing.location.coordinates) {
      // Simplified distance check (would use proper geo calculation in production)
      const centerLat = 52.5200;
      const centerLng = 13.4050;
      const distance = Math.sqrt(
        Math.pow(listing.location.coordinates.lat - centerLat, 2) +
        Math.pow(listing.location.coordinates.lng - centerLng, 2)
      ) * 111; // Rough km conversion
      
      if (distance <= preferences.maxDistanceFromCenter) {
        return 100 - (distance / preferences.maxDistanceFromCenter) * 30;
      } else {
        return 50;
      }
    }
    
    return 80; // Default score if no location preferences
  }
  
  private calculateSizeScore(listing: UniversalListing, preferences: UserPreferences): number {
    if (!listing.size) return 70; // Unknown size gets neutral score
    
    if (preferences.minSize && listing.size < preferences.minSize) {
      const deficit = ((preferences.minSize - listing.size) / preferences.minSize) * 100;
      return Math.max(0, 100 - deficit);
    }
    
    if (preferences.maxSize && listing.size > preferences.maxSize) {
      const excess = ((listing.size - preferences.maxSize) / preferences.maxSize) * 100;
      return Math.max(50, 100 - excess / 2);
    }
    
    return 100;
  }
  
  private calculateAmenityScore(listing: UniversalListing, preferences: UserPreferences): number {
    const required = Object.entries(preferences.requiredAmenities);
    if (required.length === 0) return 100;
    
    let matched = 0;
    let total = 0;
    
    for (const [amenity, wanted] of required) {
      if (wanted) {
        total++;
        if (listing.amenities[amenity as keyof StandardAmenities]) {
          matched++;
        }
      }
    }
    
    if (total === 0) return 100;
    
    const score = (matched / total) * 100;
    return score - ((total - matched) * this.config.penalties.missingAmenity);
  }
  
  private calculateAvailabilityScore(listing: UniversalListing, preferences: UserPreferences): number {
    if (!preferences.moveInDate) return 100; // No date preference
    
    const available = listing.availability.from;
    if (!available) {
      return listing.availability.immediately ? 100 : 70;
    }
    
    const preferredDate = preferences.moveInDate;
    const daysDiff = Math.abs(
      (available.getTime() - preferredDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (preferences.flexibleDates) {
      if (daysDiff <= 30) return 100;
      if (daysDiff <= 60) return 80;
      return 60;
    } else {
      if (daysDiff <= 7) return 100;
      if (daysDiff <= 14) return 80;
      if (daysDiff <= 30) return 60;
      return 40;
    }
  }
  
  private calculatePropertyTypeScore(listing: UniversalListing, preferences: UserPreferences): number {
    if (!listing.propertyType || preferences.propertyTypes.length === 0) {
      return 80; // No preference or unknown type
    }
    
    if (preferences.propertyTypes.includes(listing.propertyType)) {
      return 100;
    }
    
    return 100 - this.config.penalties.wrongPropertyType;
  }
  
  private applyBonuses(
    baseScore: number, 
    listing: UniversalListing, 
    preferences: UserPreferences,
    matchedCriteria: string[]
  ): number {
    let score = baseScore;
    
    // Under budget bonus
    if (listing.costs.totalRent < preferences.maxRent * 0.8) {
      score += this.config.bonuses.underBudget;
      matchedCriteria.push('Great price');
    }
    
    // Extra amenities bonus
    const providedAmenities = Object.values(listing.amenities).filter(v => v === true).length;
    const requiredAmenities = Object.values(preferences.requiredAmenities).filter(v => v === true).length;
    if (providedAmenities > requiredAmenities + 3) {
      score += this.config.bonuses.extraAmenities;
      matchedCriteria.push('Many amenities');
    }
    
    // Immediate availability bonus
    if (listing.availability.immediately && preferences.moveInDate) {
      const daysUntilMove = Math.ceil(
        (preferences.moveInDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilMove <= 30) {
        score += this.config.bonuses.immediateAvailability;
        matchedCriteria.push('Available immediately');
      }
    }
    
    return score;
  }
  
  /**
   * Get active users with their preferences
   */
  private async getActiveUsersWithPreferences(): Promise<UserPreferences[]> {
    const { data: users, error } = await this.supabase
      .from('profiles')
      .select(`
        id,
        email,
        search_preferences
      `)
      .eq('is_active', true)
      .not('search_preferences', 'is', null);
    
    if (error || !users) {
      console.error('Failed to get users:', error);
      return [];
    }
    
    // Transform to UserPreferences format
    return users.map(user => ({
      id: user.id,
      email: user.email,
      platforms: user.search_preferences.platforms || ['wg_gesucht'],
      districts: user.search_preferences.districts || [],
      minRent: user.search_preferences.min_rent || 0,
      maxRent: user.search_preferences.max_rent || 2000,
      includeUtilities: user.search_preferences.include_utilities ?? true,
      minSize: user.search_preferences.min_size,
      maxSize: user.search_preferences.max_size,
      minRooms: user.search_preferences.min_rooms,
      maxRooms: user.search_preferences.max_rooms,
      propertyTypes: user.search_preferences.property_types || [PropertyType.WG_ROOM, PropertyType.STUDIO, PropertyType.APARTMENT],
      moveInDate: user.search_preferences.move_in_date ? new Date(user.search_preferences.move_in_date) : undefined,
      flexibleDates: user.search_preferences.flexible_dates ?? true,
      requiredAmenities: user.search_preferences.amenities || {},
      wgPreferences: user.search_preferences.wg_preferences,
      minMatchScore: user.search_preferences.min_match_score || 60,
      maxMatchesPerDay: user.search_preferences.max_matches_per_day,
      notifyImmediately: user.search_preferences.notify_immediately ?? false,
      notificationChannels: user.search_preferences.notification_channels || ['email']
    }));
  }
  
  /**
   * Bulk insert matches with deduplication
   */
  private async bulkInsertMatches(matches: any[]): Promise<void> {
    // Remove duplicates within batch
    const uniqueMatches = new Map<string, any>();
    for (const match of matches) {
      const key = `${match.user_id}-${match.listing_id}`;
      if (!uniqueMatches.has(key) || uniqueMatches.get(key).match_score < match.match_score) {
        uniqueMatches.set(key, match);
      }
    }
    
    const { error } = await this.supabase
      .from('user_matches')
      .upsert(Array.from(uniqueMatches.values()), {
        onConflict: 'user_id,listing_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Failed to insert matches:', error);
      throw error;
    }
  }
  
  /**
   * Update match scoring algorithm based on user feedback
   */
  async updateScoringWeights(feedback: Array<{ matchId: string; action: 'liked' | 'dismissed' | 'applied' }>): Promise<void> {
    // This would analyze user interactions and adjust weights
    // For now, just log the feedback
    console.log(`📊 Received ${feedback.length} feedback items for scoring adjustment`);
    
    // In production, this would:
    // 1. Analyze which criteria led to positive/negative actions
    // 2. Adjust weights using ML or statistical analysis
    // 3. A/B test new weights
    // 4. Persist successful weight changes
  }
  
  /**
   * Get match statistics for monitoring
   */
  async getMatchStats(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<any> {
    const since = new Date();
    switch (timeframe) {
      case 'hour':
        since.setHours(since.getHours() - 1);
        break;
      case 'day':
        since.setDate(since.getDate() - 1);
        break;
      case 'week':
        since.setDate(since.getDate() - 7);
        break;
    }
    
    const { data: matches, error } = await this.supabase
      .from('user_matches')
      .select('match_score, platform, created_at, status')
      .gte('created_at', since.toISOString());
    
    if (error || !matches) {
      return null;
    }
    
    return {
      total: matches.length,
      byPlatform: matches.reduce((acc, m) => {
        acc[m.platform] = (acc[m.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageScore: matches.reduce((sum, m) => sum + m.match_score, 0) / matches.length,
      byStatus: matches.reduce((acc, m) => {
        acc[m.status] = (acc[m.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

// Factory function
export function createMatchEngine(supabaseUrl: string, supabaseKey: string, config?: Partial<MatchConfig>): UniversalMatchEngine {
  return new UniversalMatchEngine(supabaseUrl, supabaseKey, config);
}