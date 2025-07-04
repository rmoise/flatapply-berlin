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
      gmail_credentials: {
        Row: {
          id: string
          user_id: string
          email: string
          access_token: string | null
          refresh_token: string
          token_expiry: string | null
          scope: string | null
          connected_at: string
          last_sync_at: string | null
          sync_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          access_token?: string | null
          refresh_token: string
          token_expiry?: string | null
          scope?: string | null
          connected_at?: string
          last_sync_at?: string | null
          sync_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          access_token?: string | null
          refresh_token?: string
          token_expiry?: string | null
          scope?: string | null
          connected_at?: string
          last_sync_at?: string | null
          sync_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          user_id: string
          listing_id: string
          message_content: string
          cv_url: string | null
          sent_via: 'manual' | 'auto_email' | 'platform'
          sent_at: string
          email_message_id: string | null
          status: 'draft' | 'sent' | 'viewed' | 'replied' | 'rejected'
          landlord_response: string | null
          notes: string | null
          gmail_thread_id: string | null
          gmail_message_id: string | null
          last_reply_at: string | null
          unread_count: number
          thread_subject: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          listing_id: string
          message_content: string
          cv_url?: string | null
          sent_via?: 'manual' | 'auto_email' | 'platform'
          sent_at?: string
          email_message_id?: string | null
          status?: 'draft' | 'sent' | 'viewed' | 'replied' | 'rejected'
          landlord_response?: string | null
          notes?: string | null
          gmail_thread_id?: string | null
          gmail_message_id?: string | null
          last_reply_at?: string | null
          unread_count?: number
          thread_subject?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          listing_id?: string
          message_content?: string
          cv_url?: string | null
          sent_via?: 'manual' | 'auto_email' | 'platform'
          sent_at?: string
          email_message_id?: string | null
          status?: 'draft' | 'sent' | 'viewed' | 'replied' | 'rejected'
          landlord_response?: string | null
          notes?: string | null
          gmail_thread_id?: string | null
          gmail_message_id?: string | null
          last_reply_at?: string | null
          unread_count?: number
          thread_subject?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      application_messages: {
        Row: {
          id: string
          application_id: string
          gmail_message_id: string
          gmail_thread_id: string
          from_email: string
          from_name: string | null
          to_email: string
          to_name: string | null
          subject: string | null
          body_text: string | null
          body_html: string | null
          sent_at: string
          is_unread: boolean
          is_from_user: boolean
          has_attachments: boolean
          attachments: Json
          raw_headers: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_id: string
          gmail_message_id: string
          gmail_thread_id: string
          from_email: string
          from_name?: string | null
          to_email: string
          to_name?: string | null
          subject?: string | null
          body_text?: string | null
          body_html?: string | null
          sent_at: string
          is_unread?: boolean
          is_from_user?: boolean
          has_attachments?: boolean
          attachments?: Json
          raw_headers?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_id?: string
          gmail_message_id?: string
          gmail_thread_id?: string
          from_email?: string
          from_name?: string | null
          to_email?: string
          to_name?: string | null
          subject?: string | null
          body_text?: string | null
          body_html?: string | null
          sent_at?: string
          is_unread?: boolean
          is_from_user?: boolean
          has_attachments?: boolean
          attachments?: Json
          raw_headers?: Json | null
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