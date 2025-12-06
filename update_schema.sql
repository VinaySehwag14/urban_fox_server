-- Add password and role columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';

-- Make firebase_uid nullable (if it's not already, though usually constraints are explicit)
ALTER TABLE public.users
ALTER COLUMN firebase_uid DROP NOT NULL;
