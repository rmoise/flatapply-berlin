import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

async function getListingId() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title')
    .limit(1)
    .single();

  if (listing) {
    console.log('Listing ID:', listing.id);
    console.log('Title:', listing.title);
    console.log('');
    console.log('Visit: http://localhost:3000/dashboard/listings/' + listing.id);
  } else {
    console.log('No listings found in database');
  }
}

getListingId();