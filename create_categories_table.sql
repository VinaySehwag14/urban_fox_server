-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access"
ON public.categories
FOR SELECT
TO public
USING (true);

-- Policy: Allow service_role (backend) full access
CREATE POLICY "Allow full access to service_role"
ON public.categories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
