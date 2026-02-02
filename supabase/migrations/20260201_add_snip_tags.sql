-- Create snip_tags junction table
CREATE TABLE IF NOT EXISTS snip_tags (
  snip_id UUID REFERENCES snips ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (snip_id, tag_id)
);

-- Enable RLS
ALTER TABLE snip_tags ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only manage tags on their own snips
CREATE POLICY "Users can view their snip tags"
  ON snip_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM snips
      WHERE snips.id = snip_tags.snip_id
      AND snips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tags to their snips"
  ON snip_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM snips
      WHERE snips.id = snip_tags.snip_id
      AND snips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from their snips"
  ON snip_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM snips
      WHERE snips.id = snip_tags.snip_id
      AND snips.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_snip_tags_snip_id ON snip_tags(snip_id);
CREATE INDEX IF NOT EXISTS idx_snip_tags_tag_id ON snip_tags(tag_id);
