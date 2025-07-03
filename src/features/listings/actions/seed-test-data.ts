'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function seedTestListings() {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return {
      success: false,
      error: 'Unauthorized - please log in'
    };
  }

  // Test listings data
  const testListings = [
    {
      platform: 'wg_gesucht',
      external_id: 'test-1',
      url: 'https://www.wg-gesucht.de/test-1.html',
      title: 'Bright 2-room apartment in Prenzlauer Berg',
      description: 'Beautiful renovated apartment with balcony in the heart of Prenzlauer Berg. Close to public transport and shopping.',
      price: 1200,
      warm_rent: 1400,
      size_sqm: 65,
      rooms: 2,
      floor: 3,
      total_floors: 5,
      available_from: '2024-02-01',
      district: 'Prenzlauer Berg',
      address: 'Kastanienallee',
      images: [
        'https://via.placeholder.com/800x600?text=Living+Room',
        'https://via.placeholder.com/800x600?text=Bedroom',
        'https://via.placeholder.com/800x600?text=Kitchen'
      ],
      amenities: {
        balcony: true,
        elevator: true,
        furnished: false,
        kitchen: true,
        parking: false,
        nearTransport: true
      },
      contact_name: 'Max Mustermann',
      contact_email: 'max@example.com',
      allows_auto_apply: true,
      scraped_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_active: true
    },
    {
      platform: 'wg_gesucht',
      external_id: 'test-2',
      url: 'https://www.wg-gesucht.de/test-2.html',
      title: 'Cozy studio in Kreuzberg',
      description: 'Modern studio apartment perfect for singles or couples. Newly renovated with high-quality fixtures.',
      price: 900,
      warm_rent: 1050,
      size_sqm: 40,
      rooms: 1,
      floor: 2,
      total_floors: 4,
      available_from: '2024-03-01',
      district: 'Kreuzberg',
      address: 'Oranienstraße',
      images: [
        'https://via.placeholder.com/800x600?text=Studio+Overview',
        'https://via.placeholder.com/800x600?text=Bathroom'
      ],
      amenities: {
        balcony: false,
        elevator: false,
        furnished: true,
        kitchen: true,
        parking: false,
        nearTransport: true
      },
      contact_name: 'Anna Schmidt',
      contact_email: 'anna@example.com',
      allows_auto_apply: false,
      scraped_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_active: true
    },
    {
      platform: 'wg_gesucht',
      external_id: 'test-3',
      url: 'https://www.wg-gesucht.de/test-3.html',
      title: 'Spacious 3-room family apartment in Charlottenburg',
      description: 'Large apartment suitable for families. Good schools nearby, quiet neighborhood.',
      price: 1800,
      warm_rent: 2100,
      size_sqm: 95,
      rooms: 3,
      floor: 1,
      total_floors: 6,
      available_from: '2024-02-15',
      district: 'Charlottenburg',
      address: 'Kantstraße',
      images: [
        'https://via.placeholder.com/800x600?text=Living+Area',
        'https://via.placeholder.com/800x600?text=Master+Bedroom',
        'https://via.placeholder.com/800x600?text=Kids+Room',
        'https://via.placeholder.com/800x600?text=Kitchen+Dining'
      ],
      amenities: {
        balcony: true,
        elevator: true,
        furnished: false,
        kitchen: true,
        parking: true,
        nearTransport: true
      },
      contact_name: 'Thomas Weber',
      contact_email: 'thomas@example.com',
      allows_auto_apply: true,
      scraped_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_active: true
    }
  ];

  try {
    // Insert test listings
    const { data: insertedListings, error } = await supabase
      .from('listings')
      .upsert(testListings, { 
        onConflict: 'platform,external_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('Error inserting test listings:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Get user preferences to create matches
    const { data: preferences } = await supabase
      .from('search_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .single();

    if (preferences && insertedListings) {
      // Create matches for the test listings
      const matches = insertedListings.map(listing => ({
        user_id: user.id,
        listing_id: listing.id,
        match_score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
        matched_at: new Date().toISOString()
      }));

      await supabase
        .from('user_matches')
        .upsert(matches, { 
          onConflict: 'user_id,listing_id',
          ignoreDuplicates: true 
        });
    }

    revalidatePath('/dashboard/listings');
    
    return {
      success: true,
      count: insertedListings?.length || 0
    };

  } catch (error) {
    console.error('Error seeding test listings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}