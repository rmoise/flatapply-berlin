import { Database } from './database'

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Common types
export type Profile = Tables<'profiles'>

// Extended types with relations
export interface ListingWithMatches {
  id: string
  platform: string
  external_id: string
  url: string
  title: string
  description: string | null
  price: number
  warm_rent: number | null
  size_sqm: number | null
  rooms: number | null
  district: string | null
  address: string | null
  images: Array<{ url: string; alt?: string }>
  contact_email: string | null
  available_from: string | null
  match_score?: number
  matched_at?: string
  notified_at?: string | null
  viewed_at?: string | null
}

export interface ApplicationWithListing {
  id: string
  listing_id: string
  message_content: string
  cv_url: string | null
  sent_via: string
  sent_at: string
  status: string
  listing: {
    title: string
    platform: string
    url: string
    price: number
  }
}