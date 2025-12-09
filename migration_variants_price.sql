-- Add explicit pricing to product_variants
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS mrp NUMERIC(10, 2);
ALTER TABLE public.product_variants ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10, 2);

-- Optional: You might want to drop price_override later, or keep it as a fallback.
-- For now, we will add the explicit columns.
