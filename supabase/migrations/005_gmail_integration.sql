-- Gmail Integration Schema

-- Gmail credentials for OAuth tokens
CREATE TABLE IF NOT EXISTS gmail_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ,
  scope TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Gmail fields to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS gmail_thread_id TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS gmail_message_id TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS thread_subject TEXT;

-- Create index for faster thread lookups
CREATE INDEX IF NOT EXISTS idx_applications_gmail_thread_id ON applications(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_applications_gmail_message_id ON applications(gmail_message_id);

-- Application messages table for caching Gmail conversations
CREATE TABLE IF NOT EXISTS application_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  gmail_message_id TEXT UNIQUE NOT NULL,
  gmail_thread_id TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  to_name TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  sent_at TIMESTAMPTZ NOT NULL,
  is_unread BOOLEAN DEFAULT false,
  is_from_user BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  raw_headers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for message queries
CREATE INDEX IF NOT EXISTS idx_application_messages_application_id ON application_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_gmail_thread_id ON application_messages(gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_sent_at ON application_messages(sent_at DESC);

-- Gmail sync status table
CREATE TABLE IF NOT EXISTS gmail_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sync_type TEXT CHECK (sync_type IN ('full', 'incremental', 'thread')),
  status TEXT CHECK (status IN ('started', 'completed', 'failed')),
  messages_synced INTEGER DEFAULT 0,
  new_messages INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_gmail_credentials_updated_at BEFORE UPDATE ON gmail_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_messages_updated_at BEFORE UPDATE ON application_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies

-- Gmail credentials policies
ALTER TABLE gmail_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gmail credentials" ON gmail_credentials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gmail credentials" ON gmail_credentials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gmail credentials" ON gmail_credentials
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own gmail credentials" ON gmail_credentials
  FOR DELETE USING (auth.uid() = user_id);

-- Application messages policies
ALTER TABLE application_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own application messages" ON application_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_messages.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own application messages" ON application_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_messages.application_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own application messages" ON application_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = application_messages.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Gmail sync logs policies
ALTER TABLE gmail_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs" ON gmail_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs" ON gmail_sync_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);