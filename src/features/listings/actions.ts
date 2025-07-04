'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NormalizedListing } from '@/features/scraping/types';
import { ListingNormalizer } from '@/features/scraping/normalizer';
import { ListingMatcher, UserPreferences } from '@/features/scraping/matcher';

export interface ListingFilters {
  minRent?: number;
  maxRent?: number;
  minRooms?: number;
  maxRooms?: number;
  minSize?: number;
  maxSize?: number;
  districts?: string[];
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'size_asc' | 'size_desc' | 'match_score';
  page?: number;
  limit?: number;
}

export async function saveScrapedListings(rawListings: any[]) {
  const supabase = await createClient();

  try {
    // Normalize the listings
    const normalizedListings = rawListings.map(ListingNormalizer.normalize);
    const validListings = normalizedListings.filter(ListingNormalizer.validateNormalizedListing);
    const deduplicatedListings = ListingNormalizer.deduplicateListings(validListings);

    console.log(`Saving ${deduplicatedListings.length} valid listings to database`);

    // Insert listings into database
    const { data: insertedListings, error } = await supabase
      .from('listings')
      .upsert(
        deduplicatedListings.map(listing => ({
          platform: listing.platform,
          external_id: listing.externalId,
          url: listing.url,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          warm_rent: listing.warmRent,
          size_sqm: listing.sizeSquareMeters,
          rooms: listing.rooms,
          floor: listing.floor,
          total_floors: listing.totalFloors,
          available_from: listing.availableFrom?.toISOString(),
          district: listing.district,
          address: listing.address,
          latitude: listing.latitude,
          longitude: listing.longitude,
          property_type: listing.propertyType,
          images: listing.images,
          amenities: listing.amenities,
          contact_name: listing.contactName,
          contact_email: listing.contactEmail,
          contact_phone: listing.contactPhone,
          wg_size: listing.wgSize || null,
          allows_auto_apply: listing.allowsAutoApply,
          scraped_at: listing.scrapedAt.toISOString(),
          last_seen_at: listing.lastSeenAt.toISOString(),
          is_active: listing.isActive,
        })),
        { 
          onConflict: 'platform,external_id',
          ignoreDuplicates: false 
        }
      )
      .select();

    if (error) {
      console.error('Error saving listings:', error);
      throw error;
    }

    // Create matches for all active users
    await createMatchesForNewListings(insertedListings || []);

    revalidatePath('/');
    
    return {
      success: true,
      saved: insertedListings?.length || 0,
      total: deduplicatedListings.length
    };

  } catch (error) {
    console.error('Error in saveScrapedListings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getPublicListings(filters: ListingFilters = {}) {
  const supabase = await createClient();

  try {
    console.log('🔍 getPublicListings called with filters:', JSON.stringify(filters, null, 2));
    
    let query = supabase
      .from('listings')
      .select(`
        id,
        platform,
        external_id,
        url,
        title,
        description,
        price,
        warm_rent,
        size_sqm,
        rooms,
        floor,
        available_from,
        district,
        address,
        property_type,
        images,
        amenities,
        wg_size,
        scraped_at,
        is_active
      `)
      .eq('is_active', true)
      .is('deactivated_at', null);

    // Apply filters following Context7 documentation patterns
    // Each filter method call is implicitly ANDed together
    
    // Price filtering: Use warm_rent if available, fallback to price if warm_rent is null
    if (filters.minRent && filters.maxRent) {
      // Both min and max - need OR logic to handle warm_rent vs price
      query = query.or(`and(warm_rent.gte.${filters.minRent},warm_rent.lte.${filters.maxRent}),and(warm_rent.is.null,price.gte.${filters.minRent},price.lte.${filters.maxRent})`);
    } else if (filters.minRent) {
      query = query.or(`warm_rent.gte.${filters.minRent},and(warm_rent.is.null,price.gte.${filters.minRent})`);
    } else if (filters.maxRent) {
      query = query.or(`warm_rent.lte.${filters.maxRent},and(warm_rent.is.null,price.lte.${filters.maxRent})`);
    }
    
    // Room filters - separate calls are ANDed together
    if (filters.minRooms) {
      query = query.gte('rooms', filters.minRooms);
    }
    if (filters.maxRooms) {
      query = query.lte('rooms', filters.maxRooms);
    }
    
    // Size filters
    if (filters.minSize) {
      query = query.gte('size_sqm', filters.minSize);
    }
    if (filters.maxSize) {
      query = query.lte('size_sqm', filters.maxSize);
    }
    
    // District filter
    if (filters.districts && filters.districts.length > 0) {
      query = query.in('district', filters.districts);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('warm_rent', { ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('warm_rent', { ascending: false, nullsFirst: false });
        break;
      case 'size_asc':
        query = query.order('size_sqm', { ascending: true });
        break;
      case 'size_desc':
        query = query.order('size_sqm', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('scraped_at', { ascending: false });
        break;
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data: listings, error } = await query;

    if (error) {
      console.error('Error fetching public listings:', error);
      throw error;
    }

    console.log(`🎯 Query returned ${listings?.length || 0} listings`);

    // Get total count for pagination
    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .is('deactivated_at', null);



    return {
      success: true,
      listings: listings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

  } catch (error) {
    console.error('Error in getPublicListings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      listings: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    };
  }
}

export async function getUserListings(userId: string, filters: ListingFilters = {}) {
  const supabase = await createClient();

  try {
    // Get user preferences for match scoring
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // If no preferences found, that's okay - just means user hasn't set them yet
    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefError);
    }

    let query = supabase
      .from('user_matches')
      .select(`
        *,
        listings (
          id,
          platform,
          external_id,
          url,
          title,
          description,
          price,
          warm_rent,
          size_sqm,
          rooms,
          floor,
          available_from,
          available_to,
          district,
          address,
          property_type,
          images,
          contact_name,
          contact_email,
          contact_phone,
          wg_size,
          allows_auto_apply,
          scraped_at,
          is_active,
          deactivated_at
        )
      `)
      .eq('user_id', userId)
      .is('dismissed_at', null)
      .eq('listings.is_active', true)
      .is('listings.deactivated_at', null);

    // Apply filters - use warm_rent if available, fallback to price
    if (filters.minRent) {
      query = query.or('warm_rent.gte.' + filters.minRent + ',and(warm_rent.is.null,price.gte.' + filters.minRent + ')');
    }
    if (filters.maxRent) {
      query = query.or('warm_rent.lte.' + filters.maxRent + ',and(warm_rent.is.null,price.lte.' + filters.maxRent + ')');
    }
    if (filters.minRooms) {
      query = query.gte('listings.rooms', filters.minRooms);
    }
    if (filters.maxRooms) {
      query = query.lte('listings.rooms', filters.maxRooms);
    }
    if (filters.minSize) {
      query = query.gte('listings.size_sqm', filters.minSize);
    }
    if (filters.maxSize) {
      query = query.lte('listings.size_sqm', filters.maxSize);
    }
    if (filters.districts && filters.districts.length > 0) {
      query = query.in('listings.district', filters.districts);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('warm_rent', { foreignTable: 'listings', ascending: true, nullsFirst: false });
        break;
      case 'price_desc':
        query = query.order('warm_rent', { foreignTable: 'listings', ascending: false, nullsFirst: false });
        break;
      case 'size_asc':
        query = query.order('size_sqm', { foreignTable: 'listings', ascending: true });
        break;
      case 'size_desc':
        query = query.order('size_sqm', { foreignTable: 'listings', ascending: false });
        break;
      case 'match_score':
        query = query.order('match_score', { ascending: false });
        break;
      case 'newest':
      default:
        query = query.order('matched_at', { ascending: false });
        break;
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    const { data: matches, error } = await query;

    if (error) {
      console.error('Error fetching user listings:', error);
      // Don't throw, just return empty results
      return {
        success: true,
        listings: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: 0,
          totalPages: 0
        },
        preferences: preferences || null
      };
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('user_matches')
      .select('listings!inner(*)', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('dismissed_at', null)
      .eq('listings.is_active', true)
      .is('listings.deactivated_at', null);

    return {
      success: true,
      listings: matches || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      preferences: preferences || null
    };

  } catch (error) {
    console.error('Error in getUserListings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      listings: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      },
      preferences: null
    };
  }
}

export async function dismissListing(userId: string, listingId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('user_matches')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    if (error) throw error;

    revalidatePath('/');
    
    return { success: true };

  } catch (error) {
    console.error('Error dismissing listing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function markListingViewed(userId: string, listingId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('user_matches')
      .update({ viewed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    if (error) throw error;

    return { success: true };

  } catch (error) {
    console.error('Error marking listing viewed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function getListingById(listingId: string, userId?: string) {
  const supabase = await createClient();

  try {
    // Fetch the listing
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }

    if (!listing) {
      return {
        success: false,
        error: 'Listing not found'
      };
    }

    // If user is authenticated, check if they have saved this listing
    let isSaved = false;
    let matchData = null;
    
    if (userId) {
      const { data: savedListing } = await supabase
        .from('saved_listings')
        .select('id')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .single();
      
      isSaved = !!savedListing;

      // Also get match data if exists
      const { data: match } = await supabase
        .from('user_matches')
        .select('*')
        .eq('user_id', userId)
        .eq('listing_id', listingId)
        .single();
      
      matchData = match;
    }

    // Return different data based on authentication
    if (userId) {
      // Authenticated user gets full listing data
      return {
        success: true,
        listing,
        isSaved,
        matchData,
        isAuthenticated: true
      };
    } else {
      // Public user gets listing without contact info
      const publicListing = {
        ...listing,
        contact_name: null,
        contact_email: null,
        contact_phone: null,
      };
      
      return {
        success: true,
        listing: publicListing,
        isSaved: false,
        matchData: null,
        isAuthenticated: false
      };
    }

  } catch (error) {
    console.error('Error in getListingById:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function createMatchesForNewListings(listings: any[]) {
  const supabase = await createClient();

  try {
    // Get all active users with preferences
    const { data: users, error: usersError } = await supabase
      .from('search_preferences')
      .select(`
        user_id,
        min_rent,
        max_rent,
        min_rooms,
        max_rooms,
        min_size,
        max_size,
        districts,
        apartment_types,
        max_commute_minutes,
        commute_address,
        active
      `)
      .eq('active', true);

    if (usersError || !users) {
      console.error('Error fetching users for matching:', usersError);
      return;
    }

    const matches: any[] = [];

    for (const user of users) {
      const userPreferences: UserPreferences = {
        minRent: user.min_rent,
        maxRent: user.max_rent,
        minRooms: user.min_rooms,
        maxRooms: user.max_rooms,
        minSize: user.min_size,
        maxSize: user.max_size,
        districts: user.districts,
        apartmentTypes: user.apartment_types,
        maxCommuteMinutes: user.max_commute_minutes,
        commuteAddress: user.commute_address,
      };

      for (const listing of listings) {
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
          allowsAutoApply: listing.allows_auto_apply,
          scrapedAt: new Date(listing.scraped_at),
          lastSeenAt: new Date(listing.last_seen_at),
          isActive: listing.is_active,
        };

        const matchScore = ListingMatcher.calculateMatchScore(normalizedListing, userPreferences);
        
        // Only create matches for listings with score >= 60
        if (matchScore >= 60) {
          matches.push({
            user_id: user.user_id,
            listing_id: listing.id,
            match_score: matchScore,
            matched_at: new Date().toISOString(),
          });
        }
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
      } else {
        console.log(`Created ${matches.length} new matches`);
      }
    }

  } catch (error) {
    console.error('Error in createMatchesForNewListings:', error);
  }
}

export async function saveListing(userId: string, listingId: string) {
  const supabase = await createClient();

  try {
    // Check if user already saved this listing
    const { data: existing } = await supabase
      .from('saved_listings')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .single();

    if (existing) {
      return { success: true, message: 'Listing already saved' };
    }

    const { error } = await supabase
      .from('saved_listings')
      .insert({
        user_id: userId,
        listing_id: listingId,
        saved_at: new Date().toISOString()
      });

    if (error) throw error;

    revalidatePath('/dashboard/saved');
    
    return { success: true, message: 'Listing saved successfully' };

  } catch (error) {
    console.error('Error saving listing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function unsaveListing(userId: string, listingId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    if (error) throw error;

    revalidatePath('/dashboard/saved');
    
    return { success: true, message: 'Listing removed from saved' };

  } catch (error) {
    console.error('Error unsaving listing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

