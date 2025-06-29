// Platform constants
export const PLATFORMS = {
  WG_GESUCHT: 'wg_gesucht',
  IMMOSCOUT24: 'immoscout24',
  KLEINANZEIGEN: 'kleinanzeigen',
  IMMOWELT: 'immowelt',
  IMMONET: 'immonet',
} as const

export type Platform = typeof PLATFORMS[keyof typeof PLATFORMS]

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
} as const

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]

// Plan limits
export const PLAN_LIMITS = {
  [SUBSCRIPTION_PLANS.FREE]: {
    notifications_per_day: 5,
    ai_messages_per_month: 0,
    cv_generations_per_month: 0,
    auto_apply_enabled: false,
  },
  [SUBSCRIPTION_PLANS.BASIC]: {
    notifications_per_day: 50,
    ai_messages_per_month: 100,
    cv_generations_per_month: 5,
    auto_apply_enabled: false,
  },
  [SUBSCRIPTION_PLANS.PRO]: {
    notifications_per_day: -1, // unlimited
    ai_messages_per_month: -1, // unlimited
    cv_generations_per_month: -1, // unlimited
    auto_apply_enabled: true,
  },
} as const

// Notification channels
export const NOTIFICATION_CHANNELS = {
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
  TELEGRAM: 'telegram',
  SMS: 'sms',
} as const

export type NotificationChannel = typeof NOTIFICATION_CHANNELS[keyof typeof NOTIFICATION_CHANNELS]

// Document types
export const DOCUMENT_TYPES = {
  SCHUFA: 'schufa',
  ID: 'id',
  INCOME_PROOF: 'income_proof',
  EMPLOYMENT_CONTRACT: 'employment_contract',
  BANK_STATEMENTS: 'bank_statements',
} as const

export type DocumentType = typeof DOCUMENT_TYPES[keyof typeof DOCUMENT_TYPES]

// Income types
export const INCOME_TYPES = {
  EMPLOYED: 'employed',
  SELF_EMPLOYED: 'self_employed',
  STUDENT: 'student',
  OTHER: 'other',
} as const

export type IncomeType = typeof INCOME_TYPES[keyof typeof INCOME_TYPES]

// Application status
export const APPLICATION_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  VIEWED: 'viewed',
  REPLIED: 'replied',
  REJECTED: 'rejected',
} as const

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS]

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  LISTINGS: '/dashboard/listings',
  PREFERENCES: '/dashboard/preferences',
  PROFILE: '/dashboard/profile',
  DOCUMENTS: '/dashboard/documents',
  APPLICATIONS: '/dashboard/applications',
  BILLING: '/dashboard/billing',
  AUTH_CALLBACK: '/auth/callback',
} as const

// API endpoints
export const API_ENDPOINTS = {
  WEBHOOK_STRIPE: '/api/webhooks/stripe',
  WEBHOOK_SCRAPER: '/api/webhooks/scraper',
  CRON_SCRAPE: '/api/cron/scrape',
} as const

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  UNAUTHORIZED: 'You must be logged in to access this resource.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  NETWORK: 'Network error. Please check your connection.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully',
  PREFERENCES_SAVED: 'Preferences saved successfully',
  DOCUMENT_UPLOADED: 'Document uploaded successfully',
  APPLICATION_SENT: 'Application sent successfully',
  SUBSCRIPTION_UPDATED: 'Subscription updated successfully',
} as const