'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { SearchPreferences } from '@/features/listings/types';

export interface PreferencesFormData {
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
  active: boolean;
  // Shared living preferences
  sharedGenderPreference?: string;
  sharedMinAge?: number;
  sharedMaxAge?: number;
  sharedSmokingAllowed?: boolean | null;
  sharedPetsAllowed?: boolean | null;
}

export async function getUserPreferences(userId: string) {
  const supabase = await createClient();

  try {
    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching preferences:', error);
      throw error;
    }

    return {
      success: true,
      preferences: preferences || null
    };

  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function updateUserPreferences(userId: string, preferences: PreferencesFormData) {
  const supabase = await createClient();

  try {
    const preferencesData = {
      user_id: userId,
      min_rent: preferences.minRent,
      max_rent: preferences.maxRent,
      min_rooms: preferences.minRooms,
      max_rooms: preferences.maxRooms,
      min_size: preferences.minSize,
      max_size: preferences.maxSize,
      preferred_districts: preferences.districts,
      property_types: preferences.apartmentTypes,
      is_active: preferences.active,
      // Shared living preferences
      shared_gender_preference: preferences.sharedGenderPreference,
      shared_min_age: preferences.sharedMinAge,
      shared_max_age: preferences.sharedMaxAge,
      shared_smoking_allowed: preferences.sharedSmokingAllowed,
      shared_pets_allowed: preferences.sharedPetsAllowed,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(preferencesData, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }

    // Trigger re-matching if preferences are active
    if (preferences.active) {
      await triggerReMatching(userId);
    }

    revalidatePath('/dashboard/preferences');
    revalidatePath('/dashboard/listings');
    
    return {
      success: true,
      preferences: data
    };

  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deleteUserPreferences(userId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    // Also delete existing matches since preferences changed
    await supabase
      .from('user_matches')
      .delete()
      .eq('user_id', userId);

    revalidatePath('/dashboard/preferences');
    revalidatePath('/dashboard/listings');
    
    return { success: true };

  } catch (error) {
    console.error('Error deleting preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function triggerReMatching(userId: string) {
  const supabase = await createClient();

  try {
    // Get user's updated preferences
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!userPrefs) return;

    // Delete existing matches for this user
    await supabase
      .from('user_matches')
      .delete()
      .eq('user_id', userId);

    // Get all active listings
    const { data: listings } = await supabase
      .from('listings')
      .select('*')
      .eq('is_active', true)
      .order('scraped_at', { ascending: false })
      .limit(1000); // Limit to most recent 1000 listings

    if (!listings) return;

    // Re-calculate matches
    const { ListingMatcher } = await import('@/features/scraping/matcher');
    const matches: any[] = [];

    const userPreferences = {
      minRent: userPrefs.min_rent,
      maxRent: userPrefs.max_rent,
      minRooms: userPrefs.min_rooms,
      maxRooms: userPrefs.max_rooms,
      minSize: userPrefs.min_size,
      maxSize: userPrefs.max_size,
      districts: userPrefs.preferred_districts,
      propertyTypes: userPrefs.property_types,
    };

    for (const listing of listings) {
      const normalizedListing = {
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
      
      if (matchScore >= 60) {
        matches.push({
          user_id: userId,
          listing_id: listing.id,
          match_score: matchScore,
          matched_at: new Date().toISOString(),
        });
      }
    }

    if (matches.length > 0) {
      await supabase
        .from('user_matches')
        .insert(matches);
    }

    console.log(`Re-matched ${matches.length} listings for user ${userId}`);

  } catch (error) {
    console.error('Error in triggerReMatching:', error);
  }
}

export async function getDistrictOptions() {
  // Berlin districts for the dropdown
  return [
    'Mitte',
    'Charlottenburg-Wilmersdorf',
    'Friedrichshain-Kreuzberg', 
    'Pankow',
    'Neukölln',
    'Tempelhof-Schöneberg',
    'Steglitz-Zehlendorf',
    'Treptow-Köpenick',
    'Marzahn-Hellersdorf',
    'Lichtenberg',
    'Reinickendorf',
    'Spandau'
  ];
}

export async function getApartmentTypeOptions() {
  return [
    // Regular properties
    'apartment',
    'house',
    'studio',
    'loft',
    'penthouse',
    'maisonette',
    'attic',
    'ground_floor',
    'basement',
    // Shared living options
    'room_in_shared',
    'student_housing',
    'sublet'
  ];
}