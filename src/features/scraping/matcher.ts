import { NormalizedListing } from './types.ts';

export interface UserPreferences {
  minRent?: number;
  maxRent?: number;
  minRooms?: number;
  maxRooms?: number;
  minSize?: number;
  maxSize?: number;
  districts?: string[];
  apartmentTypes?: string[];
  maxCommuteMinutes?: number;
  commuteAddress?: string;
}

export interface ListingMatch {
  listingId: string;
  userId: string;
  matchScore: number;
  matchReasons: string[];
  listing: NormalizedListing;
}

export class ListingMatcher {
  static calculateMatchScore(listing: NormalizedListing, preferences: UserPreferences): number {
    let score = 0;
    const maxScore = 100;
    
    // Price matching (30% of score)
    const priceScore = this.calculatePriceScore(listing.price, preferences.minRent, preferences.maxRent);
    score += priceScore * 0.3;

    // Room matching (25% of score)
    const roomScore = this.calculateRoomScore(listing.rooms, preferences.minRooms, preferences.maxRooms);
    score += roomScore * 0.25;

    // Size matching (20% of score)
    const sizeScore = this.calculateSizeScore(listing.sizeSquareMeters, preferences.minSize, preferences.maxSize);
    score += sizeScore * 0.2;

    // District matching (20% of score)
    const districtScore = this.calculateDistrictScore(listing.district, preferences.districts);
    score += districtScore * 0.2;

    // Property type matching (5% of score)
    const typeScore = this.calculateTypeScore(listing.propertyType, preferences.apartmentTypes);
    score += typeScore * 0.05;

    return Math.round(Math.min(score, maxScore));
  }

  static isMatch(listing: NormalizedListing, preferences: UserPreferences, minScore: number = 60): boolean {
    const score = this.calculateMatchScore(listing, preferences);
    return score >= minScore;
  }

  static createMatch(
    listing: NormalizedListing, 
    userId: string, 
    preferences: UserPreferences
  ): ListingMatch {
    const matchScore = this.calculateMatchScore(listing, preferences);
    const matchReasons = this.getMatchReasons(listing, preferences);

    return {
      listingId: listing.id || '',
      userId,
      matchScore,
      matchReasons,
      listing,
    };
  }

  private static calculatePriceScore(price: number, minRent?: number, maxRent?: number): number {
    if (!minRent && !maxRent) return 100; // No price preference

    if (minRent && price < minRent) return 0;
    if (maxRent && price > maxRent) return 0;

    // Perfect score if within range
    if ((!minRent || price >= minRent) && (!maxRent || price <= maxRent)) {
      return 100;
    }

    // Partial score for close matches
    if (minRent && price < minRent) {
      const diff = minRent - price;
      const tolerance = minRent * 0.1; // 10% tolerance
      return Math.max(0, 100 - (diff / tolerance) * 100);
    }

    if (maxRent && price > maxRent) {
      const diff = price - maxRent;
      const tolerance = maxRent * 0.1; // 10% tolerance
      return Math.max(0, 100 - (diff / tolerance) * 100);
    }

    return 100;
  }

  private static calculateRoomScore(rooms?: number, minRooms?: number, maxRooms?: number): number {
    if (!rooms) return 50; // Partial score if room count unknown
    if (!minRooms && !maxRooms) return 100; // No room preference

    if (minRooms && rooms < minRooms) return 0;
    if (maxRooms && rooms > maxRooms) return 0;

    return 100; // Perfect match if within range
  }

  private static calculateSizeScore(size?: number, minSize?: number, maxSize?: number): number {
    if (!size) return 50; // Partial score if size unknown
    if (!minSize && !maxSize) return 100; // No size preference

    if (minSize && size < minSize) return 0;
    if (maxSize && size > maxSize) return 0;

    return 100; // Perfect match if within range
  }

  private static calculateDistrictScore(district?: string, preferredDistricts?: string[]): number {
    if (!preferredDistricts || preferredDistricts.length === 0) return 100; // No district preference
    if (!district) return 30; // Low score if district unknown

    // Check for exact match
    if (preferredDistricts.includes(district)) return 100;

    // Check for partial matches (e.g., "Mitte" matches "Berlin-Mitte")
    const normalizedDistrict = district.toLowerCase();
    const partialMatch = preferredDistricts.some(preferred => 
      normalizedDistrict.includes(preferred.toLowerCase()) || 
      preferred.toLowerCase().includes(normalizedDistrict)
    );

    return partialMatch ? 70 : 20; // Partial match or low score
  }

  private static calculateTypeScore(propertyType?: string, preferredTypes?: string[]): number {
    if (!preferredTypes || preferredTypes.length === 0) return 100; // No type preference
    if (!propertyType) return 50; // Partial score if type unknown

    return preferredTypes.includes(propertyType) ? 100 : 30;
  }

  private static getMatchReasons(listing: NormalizedListing, preferences: UserPreferences): string[] {
    const reasons: string[] = [];

    // Price reasons
    if (preferences.minRent && preferences.maxRent) {
      if (listing.price >= preferences.minRent && listing.price <= preferences.maxRent) {
        reasons.push(`Price ${listing.price}€ is within your budget (${preferences.minRent}€ - ${preferences.maxRent}€)`);
      }
    } else if (preferences.maxRent && listing.price <= preferences.maxRent) {
      reasons.push(`Price ${listing.price}€ is within your maximum budget of ${preferences.maxRent}€`);
    }

    // Room reasons
    if (preferences.minRooms && preferences.maxRooms && listing.rooms) {
      if (listing.rooms >= preferences.minRooms && listing.rooms <= preferences.maxRooms) {
        reasons.push(`${listing.rooms} rooms matches your preference (${preferences.minRooms} - ${preferences.maxRooms} rooms)`);
      }
    } else if (preferences.minRooms && listing.rooms && listing.rooms >= preferences.minRooms) {
      reasons.push(`${listing.rooms} rooms meets your minimum requirement of ${preferences.minRooms} rooms`);
    }

    // Size reasons
    if (preferences.minSize && listing.sizeSquareMeters && listing.sizeSquareMeters >= preferences.minSize) {
      reasons.push(`${listing.sizeSquareMeters}m² meets your minimum size requirement of ${preferences.minSize}m²`);
    }

    // District reasons
    if (preferences.districts && preferences.districts.length > 0 && listing.district) {
      if (preferences.districts.includes(listing.district)) {
        reasons.push(`Located in your preferred district: ${listing.district}`);
      }
    }

    // Property type reasons
    if (preferences.apartmentTypes && preferences.apartmentTypes.length > 0 && listing.propertyType) {
      if (preferences.apartmentTypes.includes(listing.propertyType)) {
        reasons.push(`Property type "${listing.propertyType}" matches your preference`);
      }
    }

    // Auto-apply availability
    if (listing.allowsAutoApply) {
      reasons.push('Supports auto-apply feature');
    }

    // Recent listing
    const hoursSinceScraped = (Date.now() - listing.scrapedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceScraped < 2) {
      reasons.push('Recently listed (within last 2 hours)');
    }

    return reasons;
  }

  static filterMatchingListings(
    listings: NormalizedListing[], 
    preferences: UserPreferences,
    minScore: number = 60
  ): NormalizedListing[] {
    return listings.filter(listing => this.isMatch(listing, preferences, minScore));
  }

  static rankListings(
    listings: NormalizedListing[], 
    preferences: UserPreferences
  ): Array<{ listing: NormalizedListing; score: number }> {
    return listings
      .map(listing => ({
        listing,
        score: this.calculateMatchScore(listing, preferences)
      }))
      .sort((a, b) => b.score - a.score); // Sort by score descending
  }
}

/**
 * Create matches for a specific listing against all active users
 * Returns the number of matches created
 */
export async function createMatches(supabase: any, listingId: string): Promise<number> {
  try {
    // Get the listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      console.error('Error fetching listing:', listingError);
      return 0;
    }

    // Get all active users with preferences
    const { data: users, error: usersError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('is_active', true);

    if (usersError || !users) {
      console.error('Error fetching users:', usersError);
      return 0;
    }

    if (users.length === 0) {
      return 0;
    }

    // Convert listing to normalized format
    const normalizedListing: NormalizedListing = {
      id: listing.id,
      platform: listing.platform,
      externalId: listing.external_id,
      url: listing.url,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      warmRent: listing.warm_rent,
      sizeSquareMeters: listing.size_sqm,
      rooms: listing.rooms,
      floor: listing.floor,
      totalFloors: listing.total_floors,
      availableFrom: listing.available_from ? new Date(listing.available_from) : undefined,
      district: listing.district,
      address: listing.address,
      latitude: listing.latitude,
      longitude: listing.longitude,
      propertyType: listing.property_type,
      images: listing.images || [],
      amenities: listing.amenities || {},
      contactName: listing.contact_name,
      contactEmail: listing.contact_email,
      contactPhone: listing.contact_phone,
      wgSize: listing.wg_size,
      allowsAutoApply: listing.allows_auto_apply,
      scrapedAt: new Date(listing.scraped_at || listing.created_at),
      lastSeenAt: new Date(listing.last_seen_at || listing.updated_at),
      isActive: listing.is_active
    };

    const matches = [];

    // Calculate matches for each user
    for (const user of users) {
      const userPreferences: UserPreferences = {
        minRent: user.min_rent || 0,
        maxRent: user.max_rent || 10000,
        minRooms: user.min_rooms || 0,
        maxRooms: user.max_rooms || 10,
        minSize: user.min_size,
        maxSize: user.max_size,
        districts: user.preferred_districts || [],
        apartmentTypes: user.property_types || []
      };

      const matchScore = ListingMatcher.calculateMatchScore(normalizedListing, userPreferences);

      // Only create matches above 60% threshold
      if (matchScore >= 60) {
        matches.push({
          user_id: user.user_id,
          listing_id: listingId,
          match_score: matchScore,
          matched_at: new Date().toISOString()
        });
      }
    }

    if (matches.length > 0) {
      const { error: matchError } = await supabase
        .from('user_matches')
        .upsert(matches, { 
          onConflict: 'user_id,listing_id',
          ignoreDuplicates: true 
        });

      if (matchError) {
        console.error('Error creating matches:', matchError);
        return 0;
      }
    }

    return matches.length;
  } catch (error) {
    console.error('Error in createMatches:', error);
    return 0;
  }
}