import dotenv from 'dotenv';
import { WGGesuchtStealthScraper } from '../src/features/scraping/scrapers/wg-gesucht-stealth';
import { listingDatabaseService } from '../src/features/listings/database-service';

dotenv.config({ path: '.env.local' });

async function saveListingsToDatabase() {
  console.log('🚀 Scraping and saving listings to database...\n');
  
  // Configure scraper in headless mode
  const scraper = new WGGesuchtStealthScraper({
    headless: true // Run in headless mode
  });
  
  try {
    // Define search parameters
    const searchParams = {
      url: 'https://www.wg-gesucht.de/wg-zimmer-in-Berlin.8.0.1.0.html',
      forUserId: 'test-user',
      maxPages: 1
    };
    
    console.log('📋 Scraping listings from WG-Gesucht...');
    const listings = await scraper.scrapeListings(searchParams);
    console.log(`✅ Found ${listings.length} listings\n`);
    
    if (listings.length > 0) {
      // Enrich first 10 listings with details
      const listingsToEnrich = listings.slice(0, 10);
      console.log(`🔄 Enriching ${listingsToEnrich.length} listings with details...\n`);
      
      const enrichedListings = await scraper.enrichListingsWithDetails(
        listingsToEnrich,
        { 
          concurrency: 2,
          skipOnError: true
        }
      );
      
      // Show image extraction results
      const successfulEnrichments = enrichedListings.filter(l => l.detailsScraped);
      console.log(`\n✅ Successfully enriched: ${successfulEnrichments.length}/${listingsToEnrich.length}`);
      
      const listingsWithImages = enrichedListings.filter(l => l.images && l.images.length > 0);
      console.log(`📸 Listings with images: ${listingsWithImages.length}`);
      
      if (listingsWithImages.length > 0) {
        const totalImages = listingsWithImages.reduce((sum, l) => sum + l.images.length, 0);
        console.log(`📸 Total images extracted: ${totalImages}`);
        console.log(`📸 Average images per listing: ${(totalImages / listingsWithImages.length).toFixed(1)}`);
        
        // Show specific info about the problematic listing
        const problematicListing = enrichedListings.find(l => l.url.includes('10019752'));
        if (problematicListing) {
          console.log(`\n🔍 Problematic listing (10019752) images: ${problematicListing.images?.length || 0}`);
          if (problematicListing.images && problematicListing.images.length > 0) {
            console.log(`📸 Sample image URLs:`);
            problematicListing.images.slice(0, 3).forEach((img, i) => {
              console.log(`  ${i + 1}. ${img}`);
            });
          }
        }
      }
      
      // Save to database using the normalized format
      console.log('\n💾 Saving to database...');
      
      // Convert UniversalListing to RawListing format
      const rawListings = enrichedListings.map(listing => ({
        // Core listing information
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price || 0,
        warmRent: listing.warmRent,
        deposit: listing.deposit,
        additionalCosts: listing.additionalCosts,
        size: listing.size,
        rooms: listing.rooms,
        floor: listing.floor,
        totalFloors: listing.totalFloors,
        availableFrom: listing.availableFrom,
        availableTo: listing.availableTo,
        
        // Location information
        district: listing.location?.district || listing.district,
        address: listing.location?.address || listing.address,
        latitude: listing.location?.coordinates?.lat,
        longitude: listing.location?.coordinates?.lng,
        
        // Property details
        propertyType: listing.propertyType,
        images: listing.images || [],
        amenities: listing.amenities || {},
        
        // Contact information
        contactName: listing.contact?.name || listing.contactName,
        contactEmail: listing.contact?.email || listing.contactEmail,
        contactPhone: listing.contact?.phone || listing.contactPhone,
        
        // WG-specific information
        wgSize: listing.amenities?.wgSize || listing.wgSize,
        
        // Platform-specific
        platform: listing.platform,
        externalId: listing.externalId || listing.id,
        url: listing.url,
        allowsAutoApply: listing.allowsAutoApply || false,
        
        // Metadata
        scrapedAt: listing.scrapedAt || new Date(),
        detailsScraped: listing.detailsScraped || false
      }));
      
      // Debug: Check what we're sending
      console.log(`Sending ${rawListings.length} converted listings to database service`);
      if (rawListings.length > 0) {
        console.log('Sample converted listing:', {
          platform: rawListings[0].platform,
          externalId: rawListings[0].externalId,
          title: rawListings[0].title,
          price: rawListings[0].price,
          hasImages: rawListings[0].images?.length > 0,
          description: rawListings[0].description?.substring(0, 50) + '...'
        });
      }
      
      const result = await listingDatabaseService.saveScrapedListings(rawListings);
      
      console.log(`\n✅ Database save complete:`);
      console.log(`   - Saved: ${result.saved} listings`);
      console.log(`   - Total processed: ${result.total} listings`);
      
      // Show a sample of what was saved
      if (listingsWithImages.length > 0) {
        console.log('\n📋 Sample of saved listings with images:');
        listingsWithImages.slice(0, 3).forEach((listing, idx) => {
          console.log(`\n${idx + 1}. ${listing.title}`);
          console.log(`   💰 €${listing.price}/month`);
          console.log(`   📏 ${listing.size}m²`);
          console.log(`   📸 ${listing.images.length} images`);
        });
      }
    }
    
    console.log('\n✅ Complete!');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

// Run the script
saveListingsToDatabase().catch(console.error);