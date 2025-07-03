#!/usr/bin/env node
import { listingDatabaseService } from '../src/features/listings/database-service';

// Test listings data
const testListings = [
  {
    platform: 'wg_gesucht',
    externalId: 'test-1',
    url: 'https://www.wg-gesucht.de/test-1.html',
    title: 'Bright 2-room apartment in Prenzlauer Berg',
    description: 'Beautiful renovated apartment with balcony in the heart of Prenzlauer Berg. Close to public transport and shopping.',
    price: 1200,
    warmRent: 1400,
    size: 65,
    rooms: 2,
    floor: 3,
    totalFloors: 5,
    availableFrom: new Date('2024-02-01'),
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
    contactName: 'Max Mustermann',
    contactEmail: 'max@example.com',
    allowsAutoApply: true,
    scrapedAt: new Date()
  },
  {
    platform: 'wg_gesucht',
    externalId: 'test-2',
    url: 'https://www.wg-gesucht.de/test-2.html',
    title: 'Cozy studio in Kreuzberg',
    description: 'Modern studio apartment perfect for singles or couples. Newly renovated with high-quality fixtures.',
    price: 900,
    warmRent: 1050,
    size: 40,
    rooms: 1,
    floor: 2,
    totalFloors: 4,
    availableFrom: new Date('2024-03-01'),
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
    contactName: 'Anna Schmidt',
    contactEmail: 'anna@example.com',
    allowsAutoApply: false,
    scrapedAt: new Date()
  },
  {
    platform: 'wg_gesucht',
    externalId: 'test-3',
    url: 'https://www.wg-gesucht.de/test-3.html',
    title: 'Spacious 3-room family apartment in Charlottenburg',
    description: 'Large apartment suitable for families. Good schools nearby, quiet neighborhood.',
    price: 1800,
    warmRent: 2100,
    size: 95,
    rooms: 3,
    floor: 1,
    totalFloors: 6,
    availableFrom: new Date('2024-02-15'),
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
    contactName: 'Thomas Weber',
    contactEmail: 'thomas@example.com',
    allowsAutoApply: true,
    scrapedAt: new Date()
  }
];

async function seedTestListings() {
  console.log('🌱 Seeding test listings...');
  
  try {
    const result = await listingDatabaseService.saveScrapedListings(testListings);
    console.log(`✅ Successfully seeded ${result.saved} test listings`);
  } catch (error) {
    console.error('❌ Error seeding test listings:', error);
    process.exit(1);
  }
}

// Run the seeding
seedTestListings();