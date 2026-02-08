-- Backfill updated_at for existing summaries
UPDATE summaries SET updated_at = created_at WHERE updated_at IS NULL;
