-- Milton Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'canceled', 'past_due')),
  stripe_customer_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  trial_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  weekly_digest_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  youtube_id TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  title TEXT,
  author TEXT,
  duration_seconds INTEGER,
  duration_formatted TEXT,
  thumbnail_url TEXT,
  transcript JSONB,
  transcript_raw TEXT,
  progress_seconds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Snips table
CREATE TABLE snips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  timestamp_seconds INTEGER NOT NULL,
  timestamp_formatted TEXT NOT NULL,
  bullets JSONB DEFAULT '[]',
  ai_generated BOOLEAN DEFAULT true,
  starred BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Summaries table
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID UNIQUE REFERENCES videos ON DELETE CASCADE NOT NULL,
  main_point TEXT,
  key_takeaways JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, name)
);

-- Video-Tags junction table
CREATE TABLE video_tags (
  video_id UUID REFERENCES videos ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (video_id, tag_id)
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_snips_user_id ON snips(user_id);
CREATE INDEX idx_snips_video_id ON snips(video_id);
CREATE INDEX idx_snips_created_at ON snips(created_at DESC);
CREATE INDEX idx_summaries_video_id ON summaries(video_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_chat_messages_video_id ON chat_messages(video_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE snips ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Videos: users can only access their own videos
CREATE POLICY "Users can view own videos" ON videos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own videos" ON videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own videos" ON videos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own videos" ON videos
  FOR DELETE USING (auth.uid() = user_id);

-- Snips: users can only access their own snips
CREATE POLICY "Users can view own snips" ON snips
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own snips" ON snips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own snips" ON snips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snips" ON snips
  FOR DELETE USING (auth.uid() = user_id);

-- Summaries: users can access summaries for their videos
CREATE POLICY "Users can view summaries for own videos" ON summaries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM videos WHERE videos.id = summaries.video_id AND videos.user_id = auth.uid())
  );

CREATE POLICY "Users can insert summaries for own videos" ON summaries
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM videos WHERE videos.id = summaries.video_id AND videos.user_id = auth.uid())
  );

CREATE POLICY "Users can update summaries for own videos" ON summaries
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM videos WHERE videos.id = summaries.video_id AND videos.user_id = auth.uid())
  );

-- Tags: users can only access their own tags
CREATE POLICY "Users can view own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- Video Tags: users can only access tags for their videos
CREATE POLICY "Users can view video tags for own videos" ON video_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM videos WHERE videos.id = video_tags.video_id AND videos.user_id = auth.uid())
  );

CREATE POLICY "Users can insert video tags for own videos" ON video_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM videos WHERE videos.id = video_tags.video_id AND videos.user_id = auth.uid())
  );

CREATE POLICY "Users can delete video tags for own videos" ON video_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM videos WHERE videos.id = video_tags.video_id AND videos.user_id = auth.uid())
  );

-- Chat Messages: users can only access their own chat messages
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user has active subscription or is in trial
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT subscription_status, trial_ends_at INTO profile_record
  FROM profiles WHERE id = user_id;

  IF profile_record IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Active subscription
  IF profile_record.subscription_status = 'active' THEN
    RETURN TRUE;
  END IF;

  -- Valid trial
  IF profile_record.subscription_status = 'trialing' AND profile_record.trial_ends_at > NOW() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
