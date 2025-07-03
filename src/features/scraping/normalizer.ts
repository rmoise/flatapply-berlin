import { RawListing, NormalizedListing } from './types.ts';

export class ListingNormalizer {
  static normalize(rawListing: RawListing): NormalizedListing {
    return {
      platform: ListingNormalizer.normalizePlatform(rawListing.platform),
      externalId: rawListing.externalId,
      url: rawListing.url,
      title: ListingNormalizer.normalizeTitle(rawListing.title),
      description: ListingNormalizer.normalizeDescription(rawListing.description),
      price: rawListing.price,
      warmRent: rawListing.warmRent,
      deposit: rawListing.deposit,
      additionalCosts: rawListing.additionalCosts,
      sizeSquareMeters: rawListing.size,
      rooms: rawListing.rooms,
      floor: rawListing.floor,
      totalFloors: rawListing.totalFloors,
      availableFrom: rawListing.availableFrom,
      availableTo: rawListing.availableTo,
      district: ListingNormalizer.normalizeDistrict(rawListing.district),
      address: rawListing.address,
      latitude: rawListing.latitude,
      longitude: rawListing.longitude,
      propertyType: ListingNormalizer.normalizePropertyType(rawListing.propertyType),
      images: ListingNormalizer.normalizeImages(rawListing.images),
      amenities: rawListing.amenities,
      contactName: rawListing.contactName,
      contactEmail: rawListing.contactEmail,
      contactPhone: rawListing.contactPhone,
      wgSize: rawListing.wgSize,
      allowsAutoApply: rawListing.allowsAutoApply,
      scrapedAt: rawListing.scrapedAt,
      lastSeenAt: rawListing.scrapedAt,
      isActive: true,
      detailsScraped: rawListing.detailsScraped,
    };
  }

  private static normalizePlatform(platform: string): 'wg_gesucht' | 'immoscout24' | 'kleinanzeigen' | 'immowelt' | 'immonet' {
    const normalizedPlatform = platform.toLowerCase().replace(/[-_\s]/g, '_');
    
    switch (normalizedPlatform) {
      case 'wg_gesucht':
        return 'wg_gesucht';
      case 'immoscout24':
      case 'immoscout_24':
        return 'immoscout24';
      case 'kleinanzeigen':
      case 'ebay_kleinanzeigen':
        return 'kleinanzeigen';
      case 'immowelt':
        return 'immowelt';
      case 'immonet':
        return 'immonet';
      default:
        console.warn(`Unknown platform: ${platform}, defaulting to wg_gesucht`);
        return 'wg_gesucht';
    }
  }

  private static normalizeTitle(title: string): string {
    return title
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .substring(0, 255); // Limit length for database
  }

  private static normalizeDescription(description: string | undefined): string {
    if (!description) return '';
    
    // Preserve line breaks and paragraph structure
    return description
      .trim()
      .replace(/\n\s*\n\s*\n+/g, '\n\n') // Replace 3+ newlines with exactly 2
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space (but NOT newlines)
      .replace(/[ \t]+$/gm, '') // Remove trailing spaces on each line
      .replace(/^[ \t]+/gm, ''); // Remove leading spaces on each line
  }

  private static normalizeDistrict(district: string | undefined): string | undefined {
    if (!district) return undefined;

    // Normalize Berlin district names
    const districtMappings: Record<string, string> = {
      // Common variations and mappings
      'mitte': 'Mitte',
      'charlottenburg-wilmersdorf': 'Charlottenburg-Wilmersdorf',
      'charlottenburg': 'Charlottenburg-Wilmersdorf',
      'wilmersdorf': 'Charlottenburg-Wilmersdorf',
      'friedrichshain-kreuzberg': 'Friedrichshain-Kreuzberg',
      'friedrichshain': 'Friedrichshain-Kreuzberg',
      'kreuzberg': 'Friedrichshain-Kreuzberg',
      'pankow': 'Pankow',
      'prenzlauer berg': 'Pankow',
      'prenzlauer-berg': 'Pankow',
      'prenzlauerberg': 'Pankow',
      'neukölln': 'Neukölln',
      'neukoelln': 'Neukölln',
      'tempelhof-schöneberg': 'Tempelhof-Schöneberg',
      'tempelhof': 'Tempelhof-Schöneberg',
      'schöneberg': 'Tempelhof-Schöneberg',
      'schoeneberg': 'Tempelhof-Schöneberg',
      'steglitz-zehlendorf': 'Steglitz-Zehlendorf',
      'steglitz': 'Steglitz-Zehlendorf',
      'zehlendorf': 'Steglitz-Zehlendorf',
      'treptow-köpenick': 'Treptow-Köpenick',
      'treptow': 'Treptow-Köpenick',
      'köpenick': 'Treptow-Köpenick',
      'koepenick': 'Treptow-Köpenick',
      'marzahn-hellersdorf': 'Marzahn-Hellersdorf',
      'marzahn': 'Marzahn-Hellersdorf',
      'hellersdorf': 'Marzahn-Hellersdorf',
      'lichtenberg': 'Lichtenberg',
      'reinickendorf': 'Reinickendorf',
      'spandau': 'Spandau',
      'wedding': 'Mitte', // Wedding is part of Mitte
    };

    const normalized = district.toLowerCase().trim();
    return districtMappings[normalized] || ListingNormalizer.capitalizeFirst(normalized);
  }

  private static normalizePropertyType(propertyType: string | undefined): string | undefined {
    if (!propertyType) return undefined;

    const propertyMappings: Record<string, string> = {
      'wohnung': 'apartment',
      'apartment': 'apartment',
      'haus': 'house',
      'house': 'house',
      'studio': 'studio',
      'loft': 'loft',
      'penthouse': 'penthouse',
      'maisonette': 'maisonette',
      'dachgeschoss': 'attic',
      'erdgeschoss': 'ground_floor',
      'souterrain': 'basement',
    };

    const normalized = propertyType.toLowerCase().trim();
    return propertyMappings[normalized] || normalized;
  }

  private static normalizeImages(images: string[] | undefined): string[] {
    if (!images || !Array.isArray(images)) {
      return [];
    }
    return images
      .filter(img => img && img.trim() !== '') // Remove empty strings
      .map(img => img.trim())
      .filter((img, index, arr) => arr.indexOf(img) === index) // Remove duplicates
      .slice(0, 20); // Limit to 20 images
  }

  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static validateNormalizedListing(listing: NormalizedListing): boolean {
    // Basic validation rules
    if (!listing.title || listing.title.trim().length === 0) return false;
    if (!listing.url || !listing.url.startsWith('http')) return false;
    if (!listing.externalId || listing.externalId.trim().length === 0) return false;
    // Allow price to be 0 temporarily - we'll fix it in post-processing
    if (listing.price < 0) return false;
    if (listing.sizeSquareMeters && listing.sizeSquareMeters <= 0) return false;
    if (listing.rooms && listing.rooms <= 0) return false;

    return true;
  }

  static deduplicateListings(listings: NormalizedListing[]): NormalizedListing[] {
    const seen = new Set<string>();
    const deduped: NormalizedListing[] = [];

    for (const listing of listings) {
      const key = `${listing.platform}-${listing.externalId}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(listing);
      }
    }

    return deduped;
  }
}

/**
 * Convenience function for normalizing WG-Gesucht listings
 * This is an alias for ListingNormalizer.normalize with WG-Gesucht specific handling
 */
export function normalizeWGGesuchtListing(rawListing: RawListing): NormalizedListing {
  return ListingNormalizer.normalize(rawListing);
}