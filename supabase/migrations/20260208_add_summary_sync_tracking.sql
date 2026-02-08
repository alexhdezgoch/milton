-- Add sync tracking to summaries table
ALTER TABLE summaries ADD COLUMN notion_synced_at TIMESTAMPTZ;
ALTER TABLE summaries ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER summaries_updated_at_trigger
  BEFORE UPDATE ON summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index for finding summaries needing sync
CREATE INDEX idx_summaries_needs_sync ON summaries(video_id)
  WHERE notion_synced_at IS NULL OR updated_at > notion_synced_at;
