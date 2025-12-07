-- Add slug column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
