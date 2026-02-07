-- Notion Integration Schema Changes
-- Adds support for syncing snips to a user's Notion workspace

-- Add Notion integration columns to profiles table
ALTER TABLE profiles ADD COLUMN notion_access_token TEXT;
ALTER TABLE profiles ADD COLUMN notion_workspace_id TEXT;
ALTER TABLE profiles ADD COLUMN notion_workspace_name TEXT;
ALTER TABLE profiles ADD COLUMN notion_database_id TEXT;
ALTER TABLE profiles ADD COLUMN notion_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN notion_last_synced_at TIMESTAMPTZ;

-- Add Notion page tracking to videos table
ALTER TABLE videos ADD COLUMN notion_page_id TEXT;

-- Add sync tracking to snips table
ALTER TABLE snips ADD COLUMN notion_synced_at TIMESTAMPTZ;

-- OAuth state table for secure OAuth flow
CREATE TABLE oauth_states (
  state TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles NOT NULL,
  return_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Enable RLS on oauth_states
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

-- Only service role can access oauth_states (edge functions use service key)
-- No user-facing policies needed

-- Index for efficient sync queries (find unsynced snips)
CREATE INDEX idx_snips_unsynced ON snips(user_id, created_at) WHERE notion_synced_at IS NULL;

-- Index for finding users due for sync
CREATE INDEX idx_profiles_notion_sync ON profiles(notion_last_synced_at) WHERE notion_sync_enabled = true;
