-- FitClub V3 Migration: AI Meal Logging Metadata
-- Run this in the Supabase Dashboard > SQL Editor before deploying the Edge Function.
-- Both columns are nullable — existing meal logs are completely unaffected.

ALTER TABLE public.meal_logs
  ADD COLUMN IF NOT EXISTS original_user_text text,
  ADD COLUMN IF NOT EXISTS detected_foods_json jsonb;
