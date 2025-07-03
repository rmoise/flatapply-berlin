import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeProfilePhoto() {
  // Find the listing
  const { data: listing, error } = await supabase
    .from('listings')
    .select('id, title, images')
    .eq('title', 'Lovely 3 room apartment in Körnerkiez, Neukölln')
    .single();
  
  if (error || !listing) {
    console.log('Listing not found');
    return;
  }
  
  console.log('Found listing:', listing.title);
  console.log('Current images:', listing.images?.length || 0);
  
  if (listing.images && listing.images.length > 0) {
    const lastImage = listing.images[listing.images.length - 1];
    console.log('Last image:', lastImage);
    
    // Remove the last image
    const updatedImages = listing.images.slice(0, -1);
    
    const { error: updateError } = await supabase
      .from('listings')
      .update({ images: updatedImages })
      .eq('id', listing.id);
    
    if (updateError) {
      console.log('Error updating:', updateError);
    } else {
      console.log('Successfully removed profile photo');
      console.log('New image count:', updatedImages.length);
    }
  }
}

removeProfilePhoto();