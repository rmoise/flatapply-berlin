import { createClient } from '@supabase/supabase-js';

export class ImageMonitorService {
  private supabase: any;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Check for listings without images and log them
   */
  async checkMissingImages() {
    const { data: listings } = await this.supabase
      .from('listings')
      .select('id, title, url, created_at')
      .or('images.is.null,images.eq.[]')
      .eq('is_active', true);
      
    if (listings && listings.length > 0) {
      console.log(`⚠️  Found ${listings.length} active listings without images`);
      
      // Log to monitoring table
      await this.supabase
        .from('scraper_logs')
        .insert({
          scraper_type: 'image_monitor',
          status: 'warning',
          metadata: {
            missing_images_count: listings.length,
            listing_ids: listings.map((l: any) => l.id).slice(0, 10), // First 10
            check_time: new Date().toISOString()
          }
        });
    }
    
    return listings || [];
  }

  /**
   * Check for listings with only placeholder images
   */
  async checkPlaceholderImages() {
    const { data: allListings } = await this.supabase
      .from('listings')
      .select('id, title, images')
      .not('images', 'is', null)
      .eq('is_active', true);
      
    const placeholderListings = allListings?.filter((listing: any) => {
      const images = listing.images || [];
      return images.length > 0 && images.every((img: string) => 
        img.includes('icon') || img.includes('placeholder')
      );
    }) || [];
    
    if (placeholderListings.length > 0) {
      console.log(`⚠️  Found ${placeholderListings.length} listings with only placeholder images`);
    }
    
    return placeholderListings;
  }

  /**
   * Get listings that need image extraction
   */
  async getListingsNeedingImages(limit: number = 50) {
    // Get listings without any images
    const { data: noImages } = await this.supabase
      .from('listings')
      .select('*')
      .or('images.is.null,images.eq.[]')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit / 2);
      
    // Get listings with only placeholders
    const { data: withIcons } = await this.supabase
      .from('listings')
      .select('*')
      .not('images', 'is', null)
      .eq('is_active', true)
      .limit(limit);
      
    const placeholderOnly = withIcons?.filter((listing: any) => {
      const images = listing.images || [];
      return images.length > 0 && !images.some((img: string) => 
        img.includes('.sized.') || img.includes('.large.')
      );
    }) || [];
    
    return [...(noImages || []), ...placeholderOnly.slice(0, limit / 2)];
  }

  /**
   * Mark listings as needing image extraction
   */
  async flagListingsForImageExtraction(listingIds: string[]) {
    const { error } = await this.supabase
      .from('listings')
      .update({ 
        needs_image_extraction: true,
        image_extraction_attempted_at: null
      })
      .in('id', listingIds);
      
    if (error) {
      console.error('Error flagging listings:', error);
    }
    
    return !error;
  }
}