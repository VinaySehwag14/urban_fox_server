-- Migration Script to update existing tables with new columns
-- Run this in Supabase SQL Editor

-- 1. Update Categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id);
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. Update Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS qikink_sku VARCHAR(100);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Update Users (If needed)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 4. Enable RLS on new entries if not already
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
