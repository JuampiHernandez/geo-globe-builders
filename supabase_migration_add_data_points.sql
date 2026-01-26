-- Migration: Add data_points column to builder_profiles table
-- Run this in Supabase SQL Editor if you already ran the initial schema

ALTER TABLE builder_profiles 
ADD COLUMN IF NOT EXISTS data_points JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Create index for faster data_points queries
CREATE INDEX IF NOT EXISTS idx_builder_profiles_data_points ON builder_profiles USING GIN (data_points);
