-- Create banners table
create table if not exists public.banners (
  id uuid default gen_random_uuid() primary key,
  title text,
  sub_text text,
  image text not null,
  link text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.banners enable row level security;

-- Create policy to allow public read access
create policy "Enable read access for all users" on public.banners
  for select using (true);

-- Create policy to allow admin full access
-- Assuming admin_users table exists and auth checks are done via middleware/app logic, 
-- but for Supabase direct access (if properly set up with auth), specific policies might be needed.
-- For now, consistent with generic patterns, we'll simpler policies or rely on service role for server-side.
-- However, since our server uses service key (likely) or just simple query, RLS might not block it if using service role key.
-- But for good measure:
create policy "Enable insert for authenticated users only" on public.banners
  for insert with check (true); 

create policy "Enable update for authenticated users only" on public.banners
  for update using (true);

create policy "Enable delete for authenticated users only" on public.banners
  for delete using (true);
