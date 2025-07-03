/**
 * Universal data models for cross-platform rental listings
 */

export enum PropertyType {
  WG_ROOM = 'wg_room',          // Shared room in WG
  STUDIO = 'studio',            // Studio apartment (1 room)
  APARTMENT = 'apartment',      // Regular apartment (2+ rooms)
  HOUSE = 'house',              // House
  TEMPORARY = 'temporary',      // Temporary/sublet
  COMMERCIAL = 'commercial',    // Commercial property
  OTHER = 'other'
}

export enum ListingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
  EXPIRED = 'expired',
  RENTED = 'rented'
}

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: 'exact' | 'street' | 'district' | 'city';
}

export interface Location {
  district: string | null;
  address: string | null;
  zipCode: string | null;
  city: string;
  state?: string;
  country: string;
  coordinates: Coordinates | null;
}

export interface Availability {
  from: Date | null;
  to: Date | null;
  immediately: boolean;
  flexible: boolean;
  minimumDuration?: number; // in months
  maximumDuration?: number; // in months
}

export interface ContactInfo {
  name: string | null;
  phone: string | null;
  email: string | null;
  profileImage: string | null;
  companyName: string | null;
  isAgent: boolean;
  preferredContactMethod?: 'phone' | 'email' | 'message' | 'any';
  responseTime?: string; // e.g., "usually within 24 hours"
  languages?: string[];
}

export interface StandardAmenities {
  // Basic amenities
  furnished: boolean | null;
  kitchen: boolean | null;
  balcony: boolean | null;
  terrace: boolean | null;
  garden: boolean | null;
  basement: boolean | null;
  parking: boolean | null;
  
  // Building amenities
  elevator: boolean | null;
  accessibleDesign: boolean | null;
  concierge: boolean | null;
  
  // Appliances
  washingMachine: boolean | null;
  dryer: boolean | null;
  dishwasher: boolean | null;
  
  // Utilities
  internetIncluded: boolean | null;
  heatingIncluded: boolean | null;
  electricityIncluded: boolean | null;
  
  // Rules
  petsAllowed: boolean | null;
  smokingAllowed: boolean | null;
  
  // Additional
  [key: string]: boolean | null | undefined;
}

export interface Costs {
  baseRent: number;
  utilities?: number;
  heatingCosts?: number;
  additionalCosts?: number;
  totalRent: number;
  deposit?: number;
  commission?: number;
}

export interface MediaAssets {
  images: string[];
  floorPlans: string[];
  virtualTour: string | null;
  video: string | null;
}

/**
 * Universal listing format that all platform scrapers must convert to
 */
export interface UniversalListing {
  // Core identifiers (required)
  id?: string;                    // Our database ID
  platform: string;               // Platform identifier (wg_gesucht, immobilienscout24, etc.)
  externalId: string;             // Platform's listing ID
  url: string;                    // Direct URL to listing
  
  // Basic info (required)
  title: string;
  status: ListingStatus;
  scrapedAt: Date;
  lastUpdatedAt: Date;
  firstSeenAt: Date;
  
  // Property details (nullable but important)
  description: string | null;
  propertyType: PropertyType | null;
  size: number | null;            // in square meters
  rooms: number | null;           // Number of rooms
  floor: number | null;           // Floor number
  totalFloors: number | null;     // Total floors in building
  yearBuilt: number | null;
  
  // Location
  location: Location;
  
  // Availability
  availability: Availability;
  
  // Costs
  costs: Costs;
  
  // Contact information
  contact: ContactInfo;
  
  // Media
  media: MediaAssets;
  
  // Standardized amenities
  amenities: StandardAmenities;
  
  // Platform-specific data (stored as JSONB)
  platformData: Record<string, any>;
  
  // Metadata
  viewCount?: number;
  applicationCount?: number;
  isFeatured?: boolean;
  isVerified?: boolean;
  
  // For WG-specific data
  wgDetails?: {
    totalRooms: number;
    totalFlatmates: number;
    targetGender?: 'male' | 'female' | 'any';
    ageRange?: { min: number; max: number };
    languages?: string[];
    occupation?: string[];
    lifestyle?: string[];
  };
  
  // Energy efficiency (common in German listings)
  energyDetails?: {
    certificateType?: string;
    consumptionValue?: number;
    efficiencyClass?: string;
    heatingType?: string;
  };
}

/**
 * Normalized search parameters that work across all platforms
 */
export interface UniversalSearchParams {
  platforms: string[];
  location: {
    city: string;
    districts?: string[];
    radius?: number;          // km from center
    zipCodes?: string[];
  };
  price: {
    min?: number;
    max?: number;
    includeUtilities?: boolean;
  };
  size: {
    min?: number;
    max?: number;
  };
  rooms: {
    min?: number;
    max?: number;
  };
  propertyTypes?: PropertyType[];
  availability?: {
    moveInDate?: Date;
    flexible?: boolean;
  };
  amenities?: Partial<StandardAmenities>;
  wgPreferences?: {
    maxFlatmates?: number;
    targetGender?: 'male' | 'female' | 'any';
    ageRange?: { min: number; max: number };
  };
}

/**
 * Queue item for processing
 */
export interface QueueItem {
  id: string;
  platform: string;
  url: string;
  listingId?: string;
  priority: number;
  attempts: number;
  lastAttempt: Date | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  dataNeeded: {
    basic: boolean;
    description: boolean;
    contact: boolean;
    images: boolean;
    amenities: boolean;
  };
  metadata?: Record<string, any>;
}

/**
 * Platform adapter interface for converting platform-specific data
 */
export interface PlatformAdapter<T = any> {
  toUniversal(platformData: T): UniversalListing;
  fromUniversal(universal: UniversalListing): T;
  normalizeSearchParams(params: UniversalSearchParams): any;
  validateData(data: T): boolean;
}

/**
 * Scraping statistics
 */
export interface ScrapeStats {
  platform: string;
  startTime: Date;
  endTime?: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  listingsFound: number;
  listingsNew: number;
  listingsUpdated: number;
  captchasEncountered: number;
  errorsEncountered: string[];
  averageResponseTime: number;
}

/**
 * Match result between listing and user preferences
 */
export interface MatchResult {
  userId: string;
  listingId: string;
  platform: string;
  score: number;
  matchedCriteria: string[];
  missedCriteria: string[];
  createdAt: Date;
}