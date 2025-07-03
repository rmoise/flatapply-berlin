'use server';

import { createClient } from '@/lib/supabase/server';
import { extractGalleryImages } from '@/features/scraping/scrapers/global-image-extractor';

export async function updateListingImages(listingId: string) {
  const supabase = await createClient();
  
  // Get the listing
  const { data: listing, error } = await supabase
    .from('listings')
    .select('url')
    .eq('id', listingId)
    .single();
    
  if (error || !listing) {
    return { success: false, error: 'Listing not found' };
  }
  
  try {
    // Extract images
    const images = await extractGalleryImages(listing.url);
    
    if (images.length === 0) {
      return { success: false, error: 'No images found' };
    }
    
    // Update the listing
    const { error: updateError } = await supabase
      .from('listings')
      .update({ 
        images,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);
      
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    return { success: true, images: images.length };
  } catch (error) {
    console.error('Error updating images:', error);
    return { success: false, error: 'Failed to extract images' };
  }
}

export async function updateAllMissingImages() {
  const supabase = await createClient();
  
  // Get listings without images
  const { data: listings, error } = await supabase
    .from('listings')
    .select('id, url')
    .or('images.is.null,images.eq.{}')
    .limit(10); // Process 10 at a time
    
  if (error || !listings) {
    return { success: false, error: 'Failed to fetch listings' };
  }
  
  let updated = 0;
  let failed = 0;
  
  for (const listing of listings) {
    const result = await updateListingImages(listing.id);
    if (result.success) {
      updated++;
    } else {
      failed++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return { 
    success: true, 
    updated, 
    failed,
    total: listings.length 
  };
}