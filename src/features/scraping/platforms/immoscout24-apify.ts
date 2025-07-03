import { ApifyBasedScraper, ApifyScraperOptions } from '../core/apify-base-scraper';
import { PlatformConfig } from '../core/platform-registry';
import { UniversalListing, PropertyType, ListingStatus, Location, Availability, Costs, ContactInfo, MediaAssets, StandardAmenities } from '../core/models';

export class ImmobilienScout24ApifyScraper extends ApifyBasedScraper {
  readonly platform = 'immoscout24';
  readonly baseUrl = 'https://www.immobilienscout24.de';
  readonly selectors = {
    listings: 'article[data-id]',
    title: 'h5',
    price: '[data-test="price"]',
    size: '[data-test="area"]',
    rooms: '[data-test="rooms"]',
    district: '[data-test="address"]'
  };
  
  constructor(config: PlatformConfig, options: ApifyScraperOptions) {
    super('immoscout24', config, options);
  }

  /**
   * Get input parameters for the IS24 actor
   */
  protected async getActorInput(params: any): Promise<any> {
    const input: any = {
      search: params.location || 'Berlin',
      maxItems: params.maxItems || 100,
      includeDetails: true,
    };

    // Add search filters
    if (params.propertyType) {
      input.propertyType = this.mapPropertyType(params.propertyType);
    }

    if (params.priceMin) {
      input.priceMin = params.priceMin;
    }

    if (params.priceMax) {
      input.priceMax = params.priceMax;
    }

    if (params.roomsMin) {
      input.roomsMin = params.roomsMin;
    }

    if (params.roomsMax) {
      input.roomsMax = params.roomsMax;
    }

    if (params.sizeMin) {
      input.livingSpaceMin = params.sizeMin;
    }

    if (params.sizeMax) {
      input.livingSpaceMax = params.sizeMax;
    }

    // Handle single URL scraping
    if (params.startUrls) {
      input.startUrls = params.startUrls;
      delete input.search;
    }

    return input;
  }

  /**
   * Map internal property types to IS24 types
   */
  private mapPropertyType(type: PropertyType): string {
    const typeMap: Record<PropertyType, string> = {
      [PropertyType.WG_ROOM]: 'shared-apartment',
      [PropertyType.STUDIO]: 'apartment',
      [PropertyType.APARTMENT]: 'apartment',
      [PropertyType.HOUSE]: 'house',
      [PropertyType.TEMPORARY]: 'apartment',
      [PropertyType.COMMERCIAL]: 'commercial',
      [PropertyType.OTHER]: 'apartment',
    };
    return typeMap[type] || 'apartment';
  }

  /**
   * Transform IS24 actor result to UniversalListing
   */
  protected transformActorResult(item: any): UniversalListing | null {
    try {
      const now = new Date();
      
      // Extract location data
      const location: Location = {
        district: item.district || item.quarter || null,
        address: item.address || null,
        zipCode: item.zipCode || null,
        city: item.city || 'Berlin',
        state: 'Berlin',
        country: 'Germany',
        coordinates: item.coordinates ? {
          lat: item.coordinates.latitude,
          lng: item.coordinates.longitude,
          accuracy: 'exact'
        } : null
      };
      
      // Extract availability
      const availability: Availability = {
        from: this.parseDateToDate(item.availableFrom || item.freeFrom),
        to: null,
        immediately: item.availableFrom === 'sofort' || item.availableFrom?.toLowerCase()?.includes('immediately'),
        flexible: false
      };
      
      // Extract costs
      const costs: Costs = {
        baseRent: this.parsePrice(item.baseRent || item.price) || 0,
        utilities: this.parsePrice(item.serviceCharge),
        heatingCosts: this.parsePrice(item.heatingCosts),
        additionalCosts: this.parsePrice(item.additionalCosts),
        totalRent: this.parsePrice(item.totalRent || item.warmRent || item.price) || 0,
        deposit: this.parsePrice(item.deposit),
        commission: this.parsePrice(item.commission)
      };
      
      // Extract contact info
      const contact: ContactInfo = {
        name: item.contactName || item.realtorCompanyName || null,
        phone: item.phoneNumber || null,
        email: item.email || null,
        company: item.realtorCompanyName || null,
        isPrivate: !item.realtorCompanyName
      };
      
      // Extract media
      const media: MediaAssets = {
        images: this.extractImages(item),
        floorPlans: [],
        virtualTour: item.virtualTourUrl || null,
        video: item.videoUrl || null
      };
      
      // Extract amenities
      const amenities: StandardAmenities = this.extractStandardAmenities(item);
      
      // Create the listing
      const listing: UniversalListing = {
        platform: 'immoscout24',
        externalId: item.id || this.extractIdFromUrl(item.url),
        url: item.url,
        
        title: item.title || '',
        status: ListingStatus.ACTIVE,
        scrapedAt: now,
        lastUpdatedAt: now,
        firstSeenAt: now,
        
        description: item.description || null,
        propertyType: this.detectPropertyType(item),
        size: this.parseNumber(item.livingSpace),
        rooms: this.parseNumber(item.numberOfRooms),
        floor: this.parseFloor(item.floor),
        totalFloors: this.parseNumber(item.totalFloors),
        yearBuilt: this.parseNumber(item.yearBuilt),
        
        location,
        availability,
        costs,
        contact,
        media,
        amenities,
        
        platformData: item,
        
        viewCount: item.viewCount,
        applicationCount: item.applicationCount,
        isFeatured: item.isFeatured || false,
        isVerified: item.isVerified || false,
        
        // Energy details if available
        energyDetails: item.energyCertificate ? {
          certificateType: item.energyCertificate.type,
          consumptionValue: item.energyCertificate.value,
          efficiencyClass: item.energyCertificate.class,
          heatingType: item.heatingType
        } : undefined
      };

      return listing;
    } catch (error) {
      console.error('[immoscout24] Error transforming listing:', error);
      return null;
    }
  }

  /**
   * Extract ID from URL
   */
  private extractIdFromUrl(url: string): string {
    const match = url.match(/expose\/(\d+)/);
    return match ? match[1] : '';
  }

  /**
   * Parse price string to number
   */
  private parsePrice(price: any): number | undefined {
    if (!price) return undefined;
    
    // Handle string prices like "1.200 €"
    if (typeof price === 'string') {
      const cleaned = price.replace(/[^\d,.-]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? undefined : parsed;
    }
    
    return typeof price === 'number' ? price : undefined;
  }

  /**
   * Parse number from various formats
   */
  private parseNumber(value: any): number | undefined {
    if (!value) return undefined;
    
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? undefined : parsed;
    }
    
    return undefined;
  }

  /**
   * Parse floor information
   */
  private parseFloor(floor: any): number | undefined {
    if (!floor) return undefined;
    
    if (typeof floor === 'number') return floor;
    
    if (typeof floor === 'string') {
      // Handle "EG", "1. OG", etc.
      if (floor.toLowerCase().includes('eg')) return 0;
      
      const match = floor.match(/(\d+)/);
      if (match) return parseInt(match[1]);
    }
    
    return undefined;
  }

  /**
   * Parse date string to Date object
   */
  private parseDateToDate(date: any): Date | null {
    if (!date) return null;
    
    try {
      // Handle various date formats
      if (date === 'sofort' || date?.toLowerCase()?.includes('immediately')) {
        return new Date();
      }
      
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  }

  /**
   * Detect property type from item data
   */
  private detectPropertyType(item: any): PropertyType {
    const type = item.propertyType?.toLowerCase() || item.type?.toLowerCase() || '';
    
    if (type.includes('wg') || type.includes('shared')) {
      return PropertyType.WG_ROOM;
    }
    if (type.includes('studio') || (item.numberOfRooms === 1 && !type.includes('wg'))) {
      return PropertyType.STUDIO;
    }
    if (type.includes('house') || type.includes('haus')) {
      return PropertyType.HOUSE;
    }
    if (type.includes('temporary') || type.includes('zeit')) {
      return PropertyType.TEMPORARY;
    }
    if (type.includes('commercial') || type.includes('gewerbe')) {
      return PropertyType.COMMERCIAL;
    }
    
    return PropertyType.APARTMENT;
  }

  /**
   * Extract features from item data
   */
  private extractFeatures(item: any): string[] {
    const features: string[] = [];
    
    // Check boolean features
    if (item.balcony) features.push('Balkon');
    if (item.garden) features.push('Garten');
    if (item.terrace) features.push('Terrasse');
    if (item.cellar || item.basement) features.push('Keller');
    if (item.elevator || item.lift) features.push('Aufzug');
    if (item.parkingSpace) features.push('Parkplatz');
    if (item.kitchen || item.builtInKitchen) features.push('Einbauküche');
    if (item.furnished) features.push('Möbliert');
    if (item.petsAllowed) features.push('Haustiere erlaubt');
    if (item.barrierFree) features.push('Barrierefrei');
    
    // Add from features array if exists
    if (Array.isArray(item.features)) {
      features.push(...item.features);
    }
    
    // Add from amenities if exists
    if (Array.isArray(item.amenities)) {
      features.push(...item.amenities);
    }
    
    return [...new Set(features)]; // Remove duplicates
  }

  /**
   * Extract images from item data
   */
  private extractImages(item: any): string[] {
    const images: string[] = [];
    
    // Check various image fields
    if (Array.isArray(item.images)) {
      images.push(...item.images.map((img: any) => 
        typeof img === 'string' ? img : img.url || img.src
      ).filter(Boolean));
    }
    
    if (Array.isArray(item.pictures)) {
      images.push(...item.pictures.map((pic: any) => 
        typeof pic === 'string' ? pic : pic.url || pic.src
      ).filter(Boolean));
    }
    
    if (item.titleImage) {
      images.unshift(item.titleImage);
    }
    
    if (item.mainImage) {
      images.unshift(item.mainImage);
    }
    
    // Remove duplicates and invalid URLs
    return [...new Set(images)].filter(url => 
      url && (url.startsWith('http') || url.startsWith('//'))
    );
  }

  /**
   * Extract standard amenities from item data
   */
  private extractStandardAmenities(item: any): StandardAmenities {
    return {
      // Kitchen
      kitchen: item.kitchen || item.builtInKitchen || null,
      kitchenEquipped: item.builtInKitchen || null,
      
      // Bathroom
      bathtub: item.bathtub || null,
      shower: item.shower || null,
      toiletSeparate: item.guestToilet || null,
      
      // Heating
      floorHeating: item.floorHeating || null,
      centralHeating: item.centralHeating || null,
      
      // Outdoor
      balcony: item.balcony || null,
      terrace: item.terrace || null,
      garden: item.garden || null,
      gardenUse: item.gardenUse || item.garden || null,
      
      // Building features
      elevator: item.elevator || item.lift || null,
      wheelchair: item.wheelchairAccessible || item.barrierFree || null,
      basement: item.cellar || item.basement || null,
      attic: item.attic || null,
      
      // Parking
      parkingAvailable: item.parkingSpace || item.garage || null,
      garage: item.garage || null,
      
      // Furniture
      furnished: item.furnished || null,
      furniturePartial: item.partiallyFurnished || null,
      
      // Internet
      internetSpeed: item.internetSpeed || null,
      cableTv: item.cableTv || null,
      
      // Room specifics
      bathroomWindows: null,
      bathroomShared: null,
      
      // Laundry
      washingMachine: item.washingMachine || null,
      
      // Utilities
      internetIncluded: null,
      heatingIncluded: null,
      electricityIncluded: null,
      
      // Rules
      petsAllowed: item.petsAllowed || null,
      smokingAllowed: item.smokingAllowed || null
    };
  }

  /**
   * Check if URL is an IS24 detail page
   */
  isDetailPage(url: string): boolean {
    return url.includes('immobilienscout24.de/expose/');
  }
}