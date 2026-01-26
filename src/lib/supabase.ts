import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client with fallback values for build time
// Runtime checks will happen in API routes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

// Types for database tables
export interface CountryStatsDB {
  id: string;
  country: string;
  country_code: string;
  builder_count: number;
  rank_score: number;
  ranked_builders: number;
  top_builders: Array<{
    name: string;
    rank: number | null;
    score: number;
    image_url: string;
  }>;
  last_updated: string;
}

export interface BuilderProfileDB {
  id: string;
  country_code: string;
  name: string;
  bio: string;
  rank: number | null;
  score: number;
  image_url: string;
  location: string;
  tags: string[];
  human_checkmark: boolean;
  relative_path: string;
  data_points: Record<string, string>; // credential_slug -> readable_value
  last_updated: string;
}
