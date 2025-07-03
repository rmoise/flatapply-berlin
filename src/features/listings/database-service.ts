import { createClient } from '@supabase/supabase-js';
import { NormalizedListing } from '@/features/scraping/types';
import { ListingNormalizer } from '@/features/scraping/normalizer';
import { ListingMatcher, UserPreferences } from '@/features/scraping/matcher';

// Database service that works outside of Next.js request context
export class ListingDatabaseService {
  private supabase: any;
  private readonly IMAGE_THRESHOLD = 3; // Listings with fewer images need enhancement

  private initSupabase() {
    if (!this.supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error(`Missing Supabase environment variables: URL=${supabaseUrl ? 'set' : 'missing'}, ServiceKey=${supabaseServiceKey ? 'set' : 'missing'}`);
      }

      // Use service role key for direct database access
      this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    }
    return this.supabase;
  }

  async saveScrapedListings(rawListings: any[]) {
    const supabase = this.initSupabase();
    
    try {
      // Check if rawListings is undefined or not an array
      if (!rawListings || !Array.isArray(rawListings)) {
        console.error('saveScrapedListings received invalid input:', rawListings);
        throw new Error('Invalid input: rawListings must be an array');
      }
      
      // Filter out null/undefined listings first
      const validRawListings = rawListings.filter(listing => listing != null);
      console.log(`Processing ${validRawListings.length} valid raw listings out of ${rawListings.length} total`);
      
      // Normalize the listings
      const normalizedListings = validRawListings.map(ListingNormalizer.normalize);
      console.log(`Normalized ${normalizedListings.length} listings`);
      
      const validListings = normalizedListings.filter((listing, index) => {
        const isValid = ListingNormalizer.validateNormalizedListing(listing);
        if (!isValid && index === 0) {
          // Log why the first listing failed validation
          console.log('First listing validation failure - debugging:');
          console.log('  Title:', listing.title ? `"${listing.title}"` : 'MISSING');
          console.log('  URL:', listing.url ? `"${listing.url}"` : 'MISSING');
          console.log('  External ID:', listing.externalId ? `"${listing.externalId}"` : 'MISSING');
          console.log('  Price:', listing.price);
          console.log('  Platform:', listing.platform);
        }
        return isValid;
      });
      console.log(`${validListings.length} listings passed validation`);
      
      const deduplicatedListings = ListingNormalizer.deduplicateListings(validListings);
      console.log(`${deduplicatedListings.length} listings after deduplication`);
      
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
            available_from: listing.availableFrom ? 
              (listing.availableFrom instanceof Date ? listing.availableFrom.toISOString() : listing.availableFrom) : 
              undefined,
            district: listing.district,
            address: listing.address,
            postal_code: listing.postalCode,
            property_type: listing.propertyType,
            furnished: listing.furnished,
            pets_allowed: listing.petsAllowed,
            wbs_required: listing.wbsRequired,
            allows_auto_apply: listing.allowsAutoApply,
            contact_name: listing.contactName,
            contact_email: listing.contactEmail,
            contact_phone: listing.contactPhone,
            wg_size: listing.wgSize || null,
            images: listing.images,
            amenities: listing.amenities,
            utilities: listing.utilities,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
          { 
            onConflict: 'platform,external_id',
            ignoreDuplicates: false 
          }
        )
        .select();

      if (error) {
        throw error;
      }

      console.log(`Successfully saved ${insertedListings?.length || 0} listings`);

      // Create matches for active users
      if (insertedListings && insertedListings.length > 0) {
        await this.createMatchesForNewListings(insertedListings);
      }

      return {
        saved: insertedListings?.length || 0,
        total: deduplicatedListings.length
      };

    } catch (error) {
      console.error('Error saving scraped listings:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  private async createMatchesForNewListings(listings: any[]) {
    const supabase = this.initSupabase();
    
    try {
      // Get all active users with preferences
      const { data: users, error: usersError } = await supabase
        .from('user_preferences')
        .select(`
          user_id,
          min_rent,
          max_rent,
          min_rooms,
          max_rooms,
          min_size,
          max_size,
          preferred_districts,
          property_types
        `)
        .eq('is_active', true);

      if (usersError) {
        throw usersError;
      }

      if (!users || users.length === 0) {
        console.log('No active users found for matching');
        return;
      }

      console.log(`Creating matches for ${users.length} active users and ${listings.length} new listings`);

      const matches = [];

      for (const user of users) {
        const userPreferences: UserPreferences = {
          minRent: user.min_rent || 0,
          maxRent: user.max_rent || 10000,
          minRooms: user.min_rooms || 0,
          maxRooms: user.max_rooms || 10,
          minSize: user.min_size,
          maxSize: user.max_size,
          districts: user.preferred_districts || [],
          propertyTypes: user.property_types || []
        };

        for (const listing of listings) {
          const normalizedListing: NormalizedListing = {
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
            postalCode: listing.postal_code,
            propertyType: listing.property_type,
            furnished: listing.furnished,
            petsAllowed: listing.pets_allowed,
            wbsRequired: listing.wbs_required,
            allowsAutoApply: listing.allows_auto_apply,
            contactName: listing.contact_name,
            contactEmail: listing.contact_email,
            contactPhone: listing.contact_phone,
            images: listing.images || [],
            amenities: listing.amenities || {},
            utilities: listing.utilities || {}
          };

          const matchScore = ListingMatcher.calculateMatchScore(normalizedListing, userPreferences);

          // Only create matches above threshold
          if (matchScore >= 0.6) {
            matches.push({
              user_id: user.user_id,
              listing_id: listing.id,
              match_score: matchScore,
              matched_at: new Date().toISOString()
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
          throw matchError;
        }

        console.log(`Created ${matches.length} new matches`);
      } else {
        console.log('No matches created (scores below threshold)');
      }

    } catch (error) {
      console.error('Error creating matches:', error);
      // Don't throw - matching errors shouldn't break listing saving
    }
  }
  
  async getListingsNeedingImageEnhancement(): Promise<Array<{ id: string; url: string; images: string[] }>> {
    const supabase = this.initSupabase();
    
    try {
      // Get listings from the last 24 hours with few images
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      
      const { data, error } = await supabase
        .from('listings')
        .select('id, url, images')
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .eq('platform', 'wg_gesucht')
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (error) {
        console.error('Error fetching listings needing enhancement:', error);
        return [];
      }
      
      // Filter listings with few images
      const needsEnhancement = (data || []).filter((listing: any) => {
        const imageCount = listing.images?.length || 0;
        return imageCount < this.IMAGE_THRESHOLD;
      });
      
      console.log(`Found ${needsEnhancement.length} listings needing image enhancement`);
      return needsEnhancement;
    } catch (error) {
      console.error('Error in getListingsNeedingImageEnhancement:', error);
      return [];
    }
  }
  
  async updateListingImages(listingId: string, images: string[]): Promise<boolean> {
    const supabase = this.initSupabase();
    
    try {
      const { error } = await supabase
        .from('listings')
        .update({ 
          images,
          updated_at: new Date().toISOString()
        })
        .eq('id', listingId);
      
      if (error) {
        console.error(`Error updating listing ${listingId} images:`, error);
        return false;
      }
      
      console.log(`Updated listing ${listingId} with ${images.length} images`);
      return true;
    } catch (error) {
      console.error('Error in updateListingImages:', error);
      return false;
    }
  }
}

// Singleton instance
export const listingDatabaseService = new ListingDatabaseService();