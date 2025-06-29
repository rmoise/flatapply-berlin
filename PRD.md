# FlatApply Berlin MVP - Product Requirements Document

## 🎯 Project Overview

FlatApply Berlin is a competitive apartment-hunting assistant that helps users find and apply to apartments faster than anyone else through:
- Real-time flat alerts from major platforms
- GPT-powered German application messages
- Professional rental CV generation
- Email-based auto-apply functionality

## 💳 Stripe Integration

Yes, we will integrate Stripe for:
- **Subscription Tiers:**
  - Free: 5 alerts/day, manual apply only
  - Basic (€9.99/mo): 50 alerts/day, AI messages
  - Pro (€19.99/mo): Unlimited alerts, auto-apply, priority scraping
- **Usage-based billing** for AI features beyond limits
- **Stripe Customer Portal** for self-service management

## 📁 Complete File Structure

```
flatapply-berlin/
├── src/
│   ├── app/                          # Next.js 15 App Router
│   │   ├── (auth)/                   # Auth group layout
│   │   │   ├── login/
│   │   │   │   └── page.tsx         # Login page
│   │   │   ├── signup/
│   │   │   │   └── page.tsx         # Signup page
│   │   │   └── layout.tsx           # Auth layout
│   │   ├── (dashboard)/              # Dashboard group
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx         # Dashboard home
│   │   │   │   ├── listings/
│   │   │   │   │   ├── page.tsx    # Matched listings
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx # Single listing view
│   │   │   │   ├── preferences/
│   │   │   │   │   └── page.tsx    # Search preferences
│   │   │   │   ├── profile/
│   │   │   │   │   └── page.tsx    # User profile
│   │   │   │   ├── documents/
│   │   │   │   │   └── page.tsx    # Document uploads
│   │   │   │   ├── applications/
│   │   │   │   │   └── page.tsx    # Application history
│   │   │   │   └── billing/
│   │   │   │       └── page.tsx    # Stripe billing
│   │   │   └── layout.tsx           # Dashboard layout
│   │   ├── api/
│   │   │   ├── webhooks/
│   │   │   │   ├── stripe/
│   │   │   │   │   └── route.ts    # Stripe webhooks
│   │   │   │   └── scraper/
│   │   │   │       └── route.ts    # Scraper webhooks
│   │   │   └── cron/
│   │   │       └── scrape/
│   │   │           └── route.ts    # Cron job endpoint
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   ├── globals.css               # Global styles
│   │   └── not-found.tsx             # 404 page
│   │
│   ├── features/                     # Feature-based modules
│   │   ├── auth/
│   │   │   ├── actions.ts           # Auth server actions
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── signup-form.tsx
│   │   │   │   └── auth-provider.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-user.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── listings/
│   │   │   ├── actions.ts           # Listing server actions
│   │   │   ├── components/
│   │   │   │   ├── listing-card.tsx
│   │   │   │   ├── listing-detail.tsx
│   │   │   │   ├── listing-grid.tsx
│   │   │   │   └── listing-filters.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-listings.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── preferences/
│   │   │   ├── actions.ts
│   │   │   ├── components/
│   │   │   │   ├── preference-form.tsx
│   │   │   │   ├── district-selector.tsx
│   │   │   │   └── price-range.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── profile/
│   │   │   ├── actions.ts
│   │   │   ├── components/
│   │   │   │   ├── profile-form.tsx
│   │   │   │   ├── document-uploader.tsx
│   │   │   │   └── cv-preview.tsx
│   │   │   └── types.ts
│   │   │
│   │   ├── applications/
│   │   │   ├── actions.ts
│   │   │   ├── components/
│   │   │   │   ├── application-form.tsx
│   │   │   │   ├── message-editor.tsx
│   │   │   │   ├── cv-generator.tsx
│   │   │   │   └── application-history.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-applications.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── notifications/
│   │   │   ├── actions.ts
│   │   │   ├── components/
│   │   │   │   └── notification-settings.tsx
│   │   │   ├── services/
│   │   │   │   ├── email.ts        # Resend/Postmark
│   │   │   │   ├── whatsapp.ts     # Twilio
│   │   │   │   ├── telegram.ts     # Telegram Bot API
│   │   │   │   └── sms.ts          # Twilio SMS
│   │   │   └── types.ts
│   │   │
│   │   ├── ai/
│   │   │   ├── actions.ts
│   │   │   ├── services/
│   │   │   │   ├── message-generator.ts
│   │   │   │   └── cv-generator.ts
│   │   │   ├── prompts/
│   │   │   │   └── application-message.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── billing/
│   │   │   ├── actions.ts
│   │   │   ├── components/
│   │   │   │   ├── pricing-table.tsx
│   │   │   │   ├── subscription-manager.tsx
│   │   │   │   └── usage-tracker.tsx
│   │   │   ├── services/
│   │   │   │   └── stripe.ts
│   │   │   └── types.ts
│   │   │
│   │   └── scraping/
│   │       ├── scrapers/
│   │       │   ├── base-scraper.ts
│   │       │   ├── wg-gesucht.ts
│   │       │   ├── immoscout24.ts
│   │       │   ├── kleinanzeigen.ts
│   │       │   ├── immowelt.ts
│   │       │   └── immonet.ts
│   │       ├── normalizer.ts
│   │       ├── matcher.ts
│   │       └── types.ts
│   │
│   ├── components/                   # Shared UI components
│   │   ├── ui/                      # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (other shadcn components)
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── mobile-nav.tsx
│   │   └── shared/
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       └── empty-state.tsx
│   │
│   ├── lib/                         # Utilities and configs
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   ├── middleware.ts       # Auth middleware
│   │   │   └── admin.ts            # Admin client
│   │   ├── stripe/
│   │   │   ├── client.ts
│   │   │   ├── products.ts         # Product definitions
│   │   │   └── webhooks.ts
│   │   ├── ai/
│   │   │   ├── openai.ts
│   │   │   └── anthropic.ts
│   │   ├── email/
│   │   │   └── resend.ts
│   │   ├── utils/
│   │   │   ├── cn.ts               # Class name helper
│   │   │   ├── format.ts           # Formatters
│   │   │   └── validation.ts       # Validators
│   │   └── constants.ts
│   │
│   ├── types/                       # Global TypeScript types
│   │   ├── database.ts             # Supabase types
│   │   ├── api.ts                  # API types
│   │   └── global.d.ts             # Global types
│   │
│   ├── hooks/                       # Global hooks
│   │   ├── use-media-query.ts
│   │   └── use-debounce.ts
│   │
│   └── middleware.ts                # Next.js middleware
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_functions.sql
│   │   └── 004_triggers.sql
│   └── seed.sql
│
├── scripts/
│   ├── generate-types.ts           # Generate DB types
│   └── test-scrapers.ts           # Test scraping
│
├── public/
│   ├── images/
│   └── fonts/
│
├── .env.local                      # Environment variables
├── .env.example                    # Example env file
├── next.config.js                  # Next.js config
├── tailwind.config.ts              # Tailwind config
├── tsconfig.json                   # TypeScript config
├── package.json
├── CLAUDE.md                       # Development guidelines
├── PRD.md                          # This file
└── README.md                       # Project documentation
```

## 🗄️ Database Schema (Supabase)

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  job_title TEXT,
  employer TEXT,
  income_type TEXT CHECK (income_type IN ('employed', 'self_employed', 'student', 'other')),
  monthly_income INTEGER,
  has_pets BOOLEAN DEFAULT false,
  personality_traits TEXT[],
  move_in_date DATE,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT CHECK (document_type IN ('schufa', 'id', 'income_proof', 'employment_contract', 'bank_statements')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search Preferences
CREATE TABLE search_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  min_rent INTEGER,
  max_rent INTEGER,
  min_rooms DECIMAL,
  max_rooms DECIMAL,
  min_size INTEGER,
  max_size INTEGER,
  districts TEXT[],
  apartment_types TEXT[],
  max_commute_minutes INTEGER,
  commute_address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Settings
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_number TEXT,
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_chat_id TEXT,
  sms_enabled BOOLEAN DEFAULT false,
  sms_number TEXT,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  max_notifications_per_day INTEGER DEFAULT 20,
  auto_apply_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scraped Listings
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('wg_gesucht', 'immoscout24', 'kleinanzeigen', 'immowelt', 'immonet')),
  external_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  warm_rent INTEGER,
  size_sqm INTEGER,
  rooms DECIMAL,
  floor INTEGER,
  total_floors INTEGER,
  available_from DATE,
  district TEXT,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  property_type TEXT,
  images JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '{}',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  allows_auto_apply BOOLEAN DEFAULT false,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(platform, external_id)
);

-- User Matches
CREATE TABLE user_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  match_score DECIMAL DEFAULT 0,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  UNIQUE(user_id, listing_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  match_id UUID REFERENCES user_matches(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('email', 'whatsapp', 'telegram', 'sms')),
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'clicked')),
  sent_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  message_content TEXT NOT NULL,
  cv_url TEXT,
  sent_via TEXT CHECK (sent_via IN ('manual', 'auto_email', 'platform')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_message_id TEXT,
  status TEXT CHECK (status IN ('draft', 'sent', 'viewed', 'replied', 'rejected')),
  landlord_response TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Usage Tracking
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  service TEXT CHECK (service IN ('message_generation', 'cv_generation')),
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (Stripe)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT CHECK (plan IN ('free', 'basic', 'pro')),
  status TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Limits
CREATE TABLE usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  notifications_sent INTEGER DEFAULT 0,
  ai_messages_generated INTEGER DEFAULT 0,
  cvs_generated INTEGER DEFAULT 0,
  auto_applies_sent INTEGER DEFAULT 0,
  UNIQUE(user_id, period_start)
);

-- Scraper Logs
CREATE TABLE scraper_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  listings_found INTEGER DEFAULT 0,
  new_listings INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  status TEXT CHECK (status IN ('running', 'completed', 'failed'))
);
```

## 🔑 Key Implementation Notes

### 1. Scraping Strategy
- Run scrapers every 10-15 minutes via Vercel Cron or Railway
- Use Playwright for dynamic sites (ImmoScout24)
- Use Cheerio for static sites (WG-Gesucht)
- Implement proxy rotation to avoid blocks
- Cache listings to prevent duplicates

### 2. Notification System
- Queue notifications to prevent overwhelming users
- Respect quiet hours settings
- Batch similar listings when possible
- Track delivery status for all channels

### 3. AI Integration
- Only generate content when user explicitly requests
- Cache generated messages/CVs for reuse
- Track token usage for billing
- Use Claude Instant or GPT-3.5 for cost optimization

### 4. Auto-Apply Logic
- Only available for listings with public email
- Requires explicit user consent
- BCC user on all sent emails
- Rate limit to prevent spam flags

### 5. Stripe Integration
- Use Stripe Checkout for subscriptions
- Implement Customer Portal for self-service
- Track usage for overage billing
- Handle webhooks for subscription changes

### 6. Security Considerations
- All user data encrypted at rest
- RLS policies on all tables
- Secure file uploads to Supabase Storage
- API rate limiting
- Input validation on all forms

## 🚀 MVP Launch Checklist

- [ ] Core authentication flow working
- [ ] User can set search preferences
- [ ] WG-Gesucht scraper running reliably
- [ ] Email notifications working
- [ ] Basic message generation working
- [ ] Stripe subscription flow complete
- [ ] Mobile-responsive UI
- [ ] Error tracking setup (Sentry)
- [ ] Analytics setup (Posthog/Plausible)
- [ ] Production deployment on Vercel