'use server';

import { createServerClient } from '@/lib/supabase/server';
import { saveScrapedListingsWithMatches } from '../save-listings-cli';
import { UniversalListing } from '../core/models';

export async function saveScrapedListings(listings: UniversalListing[]) {
  try {
    const supabase = await createServerClient();
    
    // Get the current session to ensure user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return {
        success: false,
        error: 'Not authenticated',
        saved: 0,
        matchesCreated: 0
      };
    }

    // Use the existing CLI function with the server client credentials
    const result = await saveScrapedListingsWithMatches(
      listings,
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    return result;
  } catch (error) {
    console.error('Error in saveScrapedListings action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      saved: 0,
      matchesCreated: 0
    };
  }
}