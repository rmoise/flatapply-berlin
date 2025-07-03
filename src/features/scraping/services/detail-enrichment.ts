import { WGGesuchtStealthScraper } from '../scrapers/wg-gesucht-stealth';
import { createServerClient } from '@/lib/supabase/server';
import type { UniversalListing } from '../core/models';

interface EnrichmentOptions {
  maxConcurrent?: number;
  delayBetweenRequests?: number;
  skipOnError?: boolean;
  updateDatabase?: boolean;
}

interface EnrichmentResult {
  totalListings: number;
  successCount: number;
  failedCount: number;
  errors: Array<{ listingId: string; error: string }>;
}

export class DetailEnrichmentService {
  private scraper: WGGesuchtStealthScraper;

  constructor() {
    this.scraper = new WGGesuchtStealthScraper({
      maxRetries: 3,
      retryDelay: 5000,
      requestDelay: 2000
    });
  }

  /**
   * Enrich listings with detail page information
   */
  async enrichListings(
    listings: UniversalListing[],
    options: EnrichmentOptions = {}
  ): Promise<EnrichmentResult> {
    const {
      maxConcurrent = 3,
      delayBetweenRequests = 2000,
      skipOnError = true,
      updateDatabase = true
    } = options;

    console.log(`🔄 Starting detail enrichment for ${listings.length} listings`);
    console.log(`Options: maxConcurrent=${maxConcurrent}, delayBetweenRequests=${delayBetweenRequests}ms`);

    const result: EnrichmentResult = {
      totalListings: listings.length,
      successCount: 0,
      failedCount: 0,
      errors: []
    };

    try {
      // Enrich listings using the scraper
      const enrichedListings = await this.scraper.enrichListingsWithDetails(listings, {
        maxConcurrent,
        delayBetweenRequests,
        skipOnError
      });

      // Update database if requested
      if (updateDatabase) {
        await this.updateListingsInDatabase(enrichedListings, result);
      }

      // Calculate final stats
      result.successCount = enrichedListings.filter(l => l.detailsScraped).length;
      result.failedCount = result.totalListings - result.successCount;

      return result;

    } catch (error) {
      console.error('Fatal error during enrichment:', error);
      throw error;
    }
  }

  /**
   * Enrich listings by their IDs from the database
   */
  async enrichListingsByIds(
    listingIds: string[],
    options: EnrichmentOptions = {}
  ): Promise<EnrichmentResult> {
    console.log(`📋 Fetching ${listingIds.length} listings from database...`);

    const supabase = await createServerClient();
    
    // Fetch listings from database
    const { data: listings, error } = await supabase
      .from('listings')
      .select('*')
      .in('id', listingIds);

    if (error) {
      throw new Error(`Failed to fetch listings: ${error.message}`);
    }

    if (!listings || listings.length === 0) {
      console.log('⚠️  No listings found');
      return {
        totalListings: 0,
        successCount: 0,
        failedCount: 0,
        errors: []
      };
    }

    console.log(`✅ Found ${listings.length} listings to enrich`);

    // Convert database listings to UniversalListing format
    const universalListings: UniversalListing[] = listings.map(dbListing => ({
      id: dbListing.id,
      platform: dbListing.platform,
      url: dbListing.url,
      title: dbListing.title,
      description: dbListing.description || '',
      price: dbListing.price,
      warmRent: dbListing.warm_rent,
      additionalCosts: dbListing.utilities?.amount,
      deposit: dbListing.deposit,
      size: dbListing.size_sqm,
      rooms: dbListing.rooms,
      floor: dbListing.floor,
      totalFloors: dbListing.total_floors,
      availableFrom: dbListing.available_from ? new Date(dbListing.available_from) : null,
      availableTo: dbListing.available_to ? new Date(dbListing.available_to) : null,
      location: {
        district: dbListing.district,
        address: dbListing.address,
        zipCode: dbListing.zip_code,
        city: dbListing.city || 'Berlin',
        country: 'Germany',
        coordinates: dbListing.latitude && dbListing.longitude ? {
          lat: dbListing.latitude,
          lng: dbListing.longitude
        } : null
      },
      images: dbListing.images || [],
      amenities: dbListing.amenities || {},
      contact: dbListing.contact_name ? {
        name: dbListing.contact_name,
        phone: dbListing.contact_phone,
        email: dbListing.contact_email,
        company: null,
        isAgent: false
      } : null,
      propertyType: dbListing.property_type,
      status: dbListing.is_active ? 'active' : 'inactive',
      viewCount: null,
      isVerified: false,
      allowsPets: dbListing.amenities?.petsAllowed || null,
      allowsSmoking: dbListing.amenities?.smokingAllowed || null,
      hasParking: dbListing.amenities?.parking || null,
      isBarrierFree: null,
      isFurnished: dbListing.amenities?.furnished || null,
      hasKitchen: dbListing.amenities?.kitchen || null,
      hasBalcony: dbListing.amenities?.balcony || null,
      hasGarden: dbListing.amenities?.garden || null,
      energyClass: null,
      heatingType: null,
      lastUpdated: new Date(dbListing.updated_at),
      scrapedAt: new Date(dbListing.scraped_at),
      detailsScraped: false,
      rawData: null,
      allowsAutoApply: false
    }));

    // Enrich listings
    return this.enrichListings(universalListings, options);
  }

  /**
   * Update enriched listings in the database
   */
  private async updateListingsInDatabase(
    listings: UniversalListing[],
    result: EnrichmentResult
  ): Promise<void> {
    console.log('\n💾 Updating database with enriched details...');
    
    const supabase = await createServerClient();
    let updateCount = 0;

    for (const listing of listings) {
      if (!listing.id || !listing.detailsScraped) {
        continue;
      }

      try {
        const updates: any = {
          updated_at: new Date().toISOString()
        };

        // Update description
        if (listing.description) {
          updates.description = listing.description;
        }

        // Update costs
        if (listing.price) {
          updates.price = listing.price;
        }
        if (listing.warmRent) {
          updates.warm_rent = listing.warmRent;
        }
        if (listing.additionalCosts !== undefined) {
          updates.utilities = { amount: listing.additionalCosts };
        }
        if (listing.deposit) {
          updates.deposit = listing.deposit;
        }

        // Update property details
        if (listing.size) {
          updates.size_sqm = listing.size;
        }
        if (listing.rooms) {
          updates.rooms = listing.rooms;
        }
        if (listing.floor !== undefined) {
          updates.floor = listing.floor;
        }

        // Update dates
        if (listing.availableFrom) {
          updates.available_from = listing.availableFrom instanceof Date 
            ? listing.availableFrom.toISOString().split('T')[0]
            : listing.availableFrom;
        }
        if (listing.availableTo) {
          updates.available_to = listing.availableTo instanceof Date
            ? listing.availableTo.toISOString().split('T')[0]
            : listing.availableTo;
        }

        // Update contact
        if (listing.contact?.name) {
          updates.contact_name = listing.contact.name;
        }

        // Update images
        if (listing.images && listing.images.length > 0) {
          updates.images = listing.images;
        }

        // Update amenities
        if (listing.amenities && Object.keys(listing.amenities).length > 0) {
          updates.amenities = listing.amenities;
        }

        // Mark as detail scraped
        updates.detail_scraped = true;

        const { error } = await supabase
          .from('listings')
          .update(updates)
          .eq('id', listing.id);

        if (error) {
          console.error(`❌ Failed to update listing ${listing.id}:`, error.message);
          result.errors.push({
            listingId: listing.id,
            error: error.message
          });
        } else {
          updateCount++;
        }

      } catch (error) {
        console.error(`❌ Error updating listing ${listing.id}:`, error);
        result.errors.push({
          listingId: listing.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Updated ${updateCount} listings in database`);
  }

  /**
   * Enrich newly scraped listings that don't have details yet
   */
  async enrichNewListings(
    limit: number = 50,
    options: EnrichmentOptions = {}
  ): Promise<EnrichmentResult> {
    console.log(`🔍 Finding listings without details (limit: ${limit})...`);

    const supabase = await createServerClient();
    
    // Find listings that haven't been detail-scraped yet
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id')
      .eq('platform', 'wg_gesucht')
      .eq('is_active', true)
      .or('detail_scraped.is.null,detail_scraped.eq.false')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to find listings: ${error.message}`);
    }

    if (!listings || listings.length === 0) {
      console.log('✅ All listings already have details');
      return {
        totalListings: 0,
        successCount: 0,
        failedCount: 0,
        errors: []
      };
    }

    const listingIds = listings.map(l => l.id);
    console.log(`📋 Found ${listingIds.length} listings without details`);

    return this.enrichListingsByIds(listingIds, options);
  }
}

// CLI interface for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new DetailEnrichmentService();
  
  const command = process.argv[2];
  const limit = parseInt(process.argv[3]) || 10;

  async function run() {
    try {
      let result: EnrichmentResult;

      if (command === 'new') {
        console.log('🚀 Enriching new listings without details...');
        result = await service.enrichNewListings(limit, {
          maxConcurrent: 2,
          delayBetweenRequests: 3000,
          skipOnError: true,
          updateDatabase: true
        });
      } else if (command === 'ids') {
        const ids = process.argv.slice(3);
        console.log(`🚀 Enriching listings by IDs: ${ids.join(', ')}`);
        result = await service.enrichListingsByIds(ids, {
          maxConcurrent: 2,
          delayBetweenRequests: 3000,
          skipOnError: true,
          updateDatabase: true
        });
      } else {
        console.log('Usage:');
        console.log('  npx tsx src/features/scraping/services/detail-enrichment.ts new [limit]');
        console.log('  npx tsx src/features/scraping/services/detail-enrichment.ts ids <id1> <id2> ...');
        process.exit(1);
      }

      console.log('\n📊 Enrichment Results:');
      console.log(`Total listings: ${result.totalListings}`);
      console.log(`Successfully enriched: ${result.successCount}`);
      console.log(`Failed: ${result.failedCount}`);
      
      if (result.errors.length > 0) {
        console.log('\n❌ Errors:');
        result.errors.forEach(err => {
          console.log(`  - ${err.listingId}: ${err.error}`);
        });
      }

      process.exit(0);
    } catch (error) {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    }
  }

  run();
}