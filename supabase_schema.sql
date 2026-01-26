-- Create country_stats table
CREATE TABLE IF NOT EXISTS country_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL,
  country_code TEXT NOT NULL UNIQUE,
  builder_count INTEGER NOT NULL DEFAULT 0,
  rank_score INTEGER NOT NULL DEFAULT 0,
  ranked_builders INTEGER NOT NULL DEFAULT 0,
  top_builders JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create builder_profiles table
CREATE TABLE IF NOT EXISTS builder_profiles (
  id TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  rank INTEGER,
  score INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  location TEXT,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  human_checkmark BOOLEAN NOT NULL DEFAULT false,
  relative_path TEXT,
  data_points JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_country_stats_country_code ON country_stats(country_code);
CREATE INDEX IF NOT EXISTS idx_country_stats_builder_count ON country_stats(builder_count DESC);
CREATE INDEX IF NOT EXISTS idx_country_stats_rank_score ON country_stats(rank_score DESC);
CREATE INDEX IF NOT EXISTS idx_builder_profiles_country_code ON builder_profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_builder_profiles_score ON builder_profiles(score DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE country_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to country_stats"
  ON country_stats FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public read access to builder_profiles"
  ON builder_profiles FOR SELECT
  TO public
  USING (true);

-- Create policies for authenticated write access (for sync operations)
-- You'll need to use service role key for write operations
CREATE POLICY "Allow service role write access to country_stats"
  ON country_stats FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role write access to builder_profiles"
  ON builder_profiles FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
