import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { ListingMatcher } from '../src/features/scraping/matcher';

// Load environment variables
config({ path: '.env.local' });

async function createMatches() {
  console.log('🔍 Creating matches for existing users...\n');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with preferences
    const { data: users, error: usersError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('is_active', true);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    console.log(`Found ${users?.length || 0} users with active preferences`);

    // Get all active listings
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('is_active', true);

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      return;
    }

    console.log(`Found ${listings?.length || 0} active listings`);

    if (!users || !listings || users.length === 0 || listings.length === 0) {
      console.log('No users or listings to match');
      return;
    }

    let totalMatches = 0;

    for (const user of users) {
      console.log(`\n👤 Processing user ${user.user_id}`);
      const matches = [];

      const userPreferences = {
        minRent: user.min_rent || 0,
        maxRent: user.max_rent || 10000,
        minRooms: user.min_rooms || 0,
        maxRooms: user.max_rooms || 10,
        minSize: user.min_size,
        maxSize: user.max_size,
        districts: user.preferred_districts || [],
        propertyTypes: user.property_types || []
      };

      console.log('User preferences:', userPreferences);

      for (const listing of listings) {
        const normalizedListing = {
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
        
        // Debug logging
        if (listing.title.includes('SCHWARZ')) {
          console.log(`Listing: ${listing.title}`);
          console.log(`Price: €${listing.price}, Rooms: ${listing.rooms}, District: ${listing.district}`);
          console.log(`Match score: ${matchScore}`);
        }
        
        if (matchScore >= 60) { // 60% threshold
          matches.push({
            user_id: user.user_id,
            listing_id: listing.id,
            match_score: Math.min(100, matchScore), // Ensure it's capped at 100
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
        } else {
          console.log(`✅ Created ${matches.length} matches for user`);
          totalMatches += matches.length;
        }
      } else {
        console.log('❌ No matches found for user preferences');
      }
    }

    console.log(`\n🎉 Total matches created: ${totalMatches}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createMatches()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });