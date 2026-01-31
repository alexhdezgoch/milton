-- Add trial_reminder_sent_at column to track when we sent the 2-day trial reminder
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS trial_reminder_sent_at TIMESTAMP WITH TIME ZONE;

-- Add comment for clarity
COMMENT ON COLUMN profiles.trial_reminder_sent_at IS 'Timestamp when trial ending reminder email was sent (to prevent duplicate emails)';
