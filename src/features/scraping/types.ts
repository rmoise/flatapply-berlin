export interface RawListing {
  // Core listing information
  title: string;
  description: string;
  price: number;
  warmRent?: number;
  deposit?: number;
  additionalCosts?: number;
  size?: number;
  rooms?: number;
  floor?: number;
  totalFloors?: number;
  availableFrom?: Date;
  availableTo?: Date;
  
  // Location information
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  
  // Property details
  propertyType?: string;
  images: string[];
  amenities: Record<string, any>;
  
  // Contact information
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // WG-specific information
  wgSize?: number; // Number of people in shared apartment (2er WG, 3er WG, etc.)
  
  // Platform-specific
  platform: string;
  externalId: string;
  url: string;
  allowsAutoApply: boolean;
  
  // Metadata
  scrapedAt: Date;
  detailsScraped?: boolean;
}

export interface NormalizedListing {
  id?: string;
  platform: 'wg_gesucht' | 'immoscout24' | 'kleinanzeigen' | 'immowelt' | 'immonet';
  externalId: string;
  url: string;
  title: string;
  description: string;
  price: number;
  warmRent?: number;
  deposit?: number;
  additionalCosts?: number;
  sizeSquareMeters?: number;
  rooms?: number;
  floor?: number;
  totalFloors?: number;
  availableFrom?: Date;
  availableTo?: Date;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  images: string[];
  amenities: Record<string, any>;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  wgSize?: number; // Number of people in shared apartment
  allowsAutoApply: boolean;
  scrapedAt: Date;
  lastSeenAt: Date;
  isActive: boolean;
  detailsScraped?: boolean;
}

export interface ScrapingResult {
  listings: RawListing[];
  errors: string[];
  totalFound: number;
  newListings: number;
  processingTime: number;
}

export interface ScraperConfig {
  baseUrl: string;
  searchUrl: string;
  listingSelector: string;
  detailSelectors: {
    title: string;
    price: string;
    size?: string;
    rooms?: string;
    description?: string;
    images?: string;
    contact?: string;
    availability?: string;
    location?: string;
  };
  userAgent?: string;
  delayBetweenRequests?: number;
  maxRetries?: number;
}

export interface ScraperOptions {
  supabaseUrl?: string;
  supabaseKey?: string;
  [key: string]: any;
}

export interface SearchFilters {
  minRent?: number;
  maxRent?: number;
  minSize?: number;
  maxSize?: number;
  minRooms?: number;
  maxRooms?: number;
  districts?: string[];
  propertyTypes?: string[];
}