import { z } from 'zod'
import { INCOME_TYPES, DOCUMENT_TYPES } from '@/lib/constants'

// Reusable schemas
export const emailSchema = z.string().email('Invalid email address')
export const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
export const urlSchema = z.string().url('Invalid URL')
export const dateSchema = z.string().datetime()

// Profile schemas
export const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: phoneSchema.optional(),
  job_title: z.string().optional(),
  employer: z.string().optional(),
  income_type: z.enum([
    INCOME_TYPES.EMPLOYED,
    INCOME_TYPES.SELF_EMPLOYED,
    INCOME_TYPES.STUDENT,
    INCOME_TYPES.OTHER,
  ]).optional(),
  monthly_income: z.number().min(0).optional(),
  has_pets: z.boolean(),
  personality_traits: z.array(z.string()).optional(),
  move_in_date: z.string().optional(),
})

// Search preferences schema
export const searchPreferencesSchema = z.object({
  min_rent: z.number().min(0).optional(),
  max_rent: z.number().min(0).optional(),
  min_rooms: z.number().min(0).optional(),
  max_rooms: z.number().min(0).optional(),
  min_size: z.number().min(0).optional(),
  max_size: z.number().min(0).optional(),
  districts: z.array(z.string()).optional(),
  apartment_types: z.array(z.string()).optional(),
  max_commute_minutes: z.number().min(0).max(180).optional(),
  commute_address: z.string().optional(),
  active: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.min_rent && data.max_rent) {
      return data.min_rent <= data.max_rent
    }
    return true
  },
  { message: 'Minimum rent must be less than maximum rent' }
).refine(
  (data) => {
    if (data.min_rooms && data.max_rooms) {
      return data.min_rooms <= data.max_rooms
    }
    return true
  },
  { message: 'Minimum rooms must be less than maximum rooms' }
).refine(
  (data) => {
    if (data.min_size && data.max_size) {
      return data.min_size <= data.max_size
    }
    return true
  },
  { message: 'Minimum size must be less than maximum size' }
)

// Notification settings schema
export const notificationSettingsSchema = z.object({
  email_enabled: z.boolean().default(true),
  whatsapp_enabled: z.boolean().default(false),
  whatsapp_number: phoneSchema.optional(),
  telegram_enabled: z.boolean().default(false),
  telegram_chat_id: z.string().optional(),
  sms_enabled: z.boolean().default(false),
  sms_number: phoneSchema.optional(),
  quiet_hours_start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  quiet_hours_end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  max_notifications_per_day: z.number().min(1).max(100).default(20),
  auto_apply_enabled: z.boolean().default(false),
}).refine(
  (data) => {
    if (data.whatsapp_enabled && !data.whatsapp_number) {
      return false
    }
    return true
  },
  { message: 'WhatsApp number is required when WhatsApp is enabled' }
).refine(
  (data) => {
    if (data.telegram_enabled && !data.telegram_chat_id) {
      return false
    }
    return true
  },
  { message: 'Telegram chat ID is required when Telegram is enabled' }
).refine(
  (data) => {
    if (data.sms_enabled && !data.sms_number) {
      return false
    }
    return true
  },
  { message: 'SMS number is required when SMS is enabled' }
)

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signupSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
})

// Document upload schema
export const documentUploadSchema = z.object({
  document_type: z.enum([
    DOCUMENT_TYPES.SCHUFA,
    DOCUMENT_TYPES.ID,
    DOCUMENT_TYPES.INCOME_PROOF,
    DOCUMENT_TYPES.EMPLOYMENT_CONTRACT,
    DOCUMENT_TYPES.BANK_STATEMENTS,
  ]),
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024,
    'File size must be less than 10MB'
  ),
})

// Application message schema
export const applicationMessageSchema = z.object({
  listing_id: z.string().uuid(),
  message: z.string().min(50, 'Message must be at least 50 characters'),
  include_cv: z.boolean().default(true),
})