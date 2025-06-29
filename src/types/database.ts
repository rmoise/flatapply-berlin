export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          job_title: string | null
          employer: string | null
          income_type: 'employed' | 'self_employed' | 'student' | 'other' | null
          monthly_income: number | null
          has_pets: boolean
          personality_traits: string[] | null
          move_in_date: string | null
          profile_photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          job_title?: string | null
          employer?: string | null
          income_type?: 'employed' | 'self_employed' | 'student' | 'other' | null
          monthly_income?: number | null
          has_pets?: boolean
          personality_traits?: string[] | null
          move_in_date?: string | null
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          job_title?: string | null
          employer?: string | null
          income_type?: 'employed' | 'self_employed' | 'student' | 'other' | null
          monthly_income?: number | null
          has_pets?: boolean
          personality_traits?: string[] | null
          move_in_date?: string | null
          profile_photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}