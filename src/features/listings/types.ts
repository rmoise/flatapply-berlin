export interface DatabaseListing {
  id: string;
  platform: 'wg_gesucht' | 'immoscout24' | 'kleinanzeigen' | 'immowelt' | 'immonet';
  external_id: string;
  url: string;
  title: string;
  description: string;
  price: number;
  warm_rent?: number;
  size_sqm?: number;
  rooms?: number;
  floor?: number;
  total_floors?: number;
  available_from?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  property_type?: string;
  images: string[];
  amenities: Record<string, any>;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  wg_size?: number; // Number of people in shared apartment (2er WG, 3er WG, etc.)
  allows_auto_apply: boolean;
  scraped_at: string;
  last_seen_at: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserMatch {
  id: string;
  user_id: string;
  listing_id: string;
  match_score: number;
  matched_at: string;
  notified_at?: string;
  viewed_at?: string;
  dismissed_at?: string;
  listing?: DatabaseListing;
}

export interface ListingWithMatch extends DatabaseListing {
  match_score?: number;
  matched_at?: string;
  viewed_at?: string;
  dismissed_at?: string;
  is_saved?: boolean;
}

export interface SearchPreferences {
  id?: string;
  user_id: string;
  min_rent?: number;
  max_rent?: number;
  min_rooms?: number;
  max_rooms?: number;
  min_size?: number;
  max_size?: number;
  districts?: string[];
  apartment_types?: string[];
  max_commute_minutes?: number;
  commute_address?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationSettings {
  id?: string;
  user_id: string;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_number?: string;
  telegram_enabled: boolean;
  telegram_chat_id?: string;
  sms_enabled: boolean;
  sms_number?: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  max_notifications_per_day: number;
  auto_apply_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ListingApplication {
  id: string;
  user_id: string;
  listing_id: string;
  message_content: string;
  cv_url?: string;
  sent_via: 'manual' | 'auto_email' | 'platform';
  sent_at: string;
  email_message_id?: string;
  status: 'draft' | 'sent' | 'viewed' | 'replied' | 'rejected';
  landlord_response?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  listing?: DatabaseListing;
}

export interface ListingFilters {
  minRent?: number;
  maxRent?: number;
  minRooms?: number;
  maxRooms?: number;
  minSize?: number;
  maxSize?: number;
  districts?: string[];
  propertyTypes?: string[];
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'size_asc' | 'size_desc' | 'match_score';
  page?: number;
  limit?: number;
  showDismissed?: boolean;
}

export interface ListingStats {
  total_listings: number;
  new_today: number;
  high_matches: number;
  average_match_score: number;
  top_districts: Array<{
    district: string;
    count: number;
  }>;
  price_range: {
    min: number;
    max: number;
    average: number;
  };
}

export interface MatchingResult {
  listing_id: string;
  user_id: string;
  match_score: number;
  match_reasons: string[];
  created_at: string;
}

export interface ScrapingSession {
  id: string;
  platform: string;
  started_at: string;
  completed_at?: string;
  listings_found: number;
  new_listings: number;
  errors: string[];
  status: 'running' | 'completed' | 'failed';
}