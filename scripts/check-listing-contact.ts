import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkListingContacts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Get recent listings with contact info
  const { data: listings } = await supabase
    .from('listings')
    .select('title, url, contact_name, contact_phone, contact_email, description')
    .eq('platform', 'wg_gesucht')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('Recent WG-Gesucht listings with contact info:\n');
  
  listings?.forEach((listing, i) => {
    console.log(`${i + 1}. ${listing.title}`);
    console.log(`   URL: ${listing.url}`);
    console.log(`   Contact Name: ${listing.contact_name || '[None]'}`);
    console.log(`   Contact Phone: ${listing.contact_phone || '[None]'}`);
    console.log(`   Contact Email: ${listing.contact_email || '[None]'}`);
    
    // Check if description contains contact info
    if (listing.description) {
      const phoneMatches = listing.description.match(/(?:handy|mobile|telefon|tel|phone|whatsapp)[\s:]*\+?[\d\s\-\(\)]+/gi);
      const emailMatches = listing.description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      
      if (phoneMatches || emailMatches) {
        console.log('   📌 Found in description:');
        if (phoneMatches) {
          phoneMatches.forEach(p => console.log(`      Phone: ${p}`));
        }
        if (emailMatches) {
          emailMatches.forEach(e => console.log(`      Email: ${e}`));
        }
      }
    }
    console.log('');
  });
}

checkListingContacts();