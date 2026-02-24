-- Migration 006: Experience Level
-- Adds experience_level column to profiles for adaptive UI complexity

ALTER TABLE public.profiles
ADD COLUMN experience_level TEXT
CHECK (experience_level IS NULL OR experience_level IN ('beginner', 'intermediate', 'advanced'))
DEFAULT NULL;
