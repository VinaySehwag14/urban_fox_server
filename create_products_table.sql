-- Create products table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  images jsonb not null default '[]'::jsonb, -- Array of { url, sort_order }
  sale_price numeric not null, -- INR
  market_price numeric not null, -- INR
  color jsonb not null default '{}'::jsonb, -- { hex, text }
  size text, -- S,M,L,XL,XXL
  description text, -- HTML
  category_id uuid references public.categories(id),
  stock integer not null default 0,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.products enable row level security;

-- Create policy to allow public read access (assuming products are public)
create policy "Enable read access for all users" on public.products
  for select using (true);

-- Create policies for authenticated users/admins
create policy "Enable insert for authenticated users only" on public.products
  for insert with check (true); 

create policy "Enable update for authenticated users only" on public.products
  for update using (true);

create policy "Enable delete for authenticated users only" on public.products
  for delete using (true);
