import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function findListingsWithNames() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get listings with real contact names
  const { data } = await supabase
    .from('listings')
    .select('url, title, contact_name, description')
    .eq('platform', 'wg_gesucht')
    .not('contact_name', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('Recent listings and their contact names:\n');
  
  data?.forEach((l, i) => {
    if (l.contact_name && l.contact_name !== 'public name') {
      console.log(`${i + 1}. Title: ${l.title}`);
      console.log(`   Contact: ${l.contact_name}`);
      console.log(`   URL: ${l.url}`);
      
      // Check if description has phone info
      if (l.description) {
        const phoneMatch = l.description.match(/(?:handy|telefon|tel|mobile)[\s:]*[\d\s\-\(\)+]+/gi);
        if (phoneMatch) {
          console.log(`   📱 Phone in description: ${phoneMatch[0]}`);
        }
      }
      console.log('');
    }
  });
  
  // Find a good test URL
  const goodListing = data?.find(l => 
    l.contact_name && 
    l.contact_name !== 'public name' &&
    l.contact_name.length > 3
  );
  
  if (goodListing) {
    console.log('\n✅ Good test URL with real contact name:');
    console.log(goodListing.url);
  }
}

findListingsWithNames();