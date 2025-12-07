-- Urban Fox E-Commerce Complete Database Schema
-- This script creates all tables needed for the e-commerce platform
-- Run this in your Supabase SQL editor

-- ============================================
-- 1. USERS TABLE (for Firebase users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Firebase UID
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid()::text = id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- Policy: Service role has full access
CREATE POLICY "Service role full access on users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. CATEGORIES TABLE (hierarchical)
-- ============================================
-- Note: categories table already exists, we'll extend it
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for slug and parent lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON public.categories(parent_id);

-- ============================================
-- 3. TAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tags"
ON public.tags
FOR SELECT
TO public
USING (true);

CREATE POLICY "Service role full access on tags"
ON public.tags
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    qikink_sku VARCHAR(100),
    brand VARCHAR(100),
    mrp NUMERIC(10, 2) NOT NULL,
    selling_price NUMERIC(10, 2) NOT NULL,
    discount_percent INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN mrp > 0 THEN ROUND(((mrp - selling_price) / mrp * 100)::numeric)
            ELSE 0
        END
    ) STORED,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(selling_price);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active products"
ON public.products
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Service role full access on products"
ON public.products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 5. PRODUCT_CATEGORIES (junction table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_categories (
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_product_categories_product ON public.product_categories(product_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_category ON public.product_categories(category_id);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product categories"
ON public.product_categories
FOR SELECT
TO public
USING (true);

CREATE POLICY "Service role full access on product_categories"
ON public.product_categories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 6. PRODUCT_TAGS (junction table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_tags (
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_product_tags_product ON public.product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON public.product_tags(tag_id);

ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product tags"
ON public.product_tags
FOR SELECT
TO public
USING (true);

CREATE POLICY "Service role full access on product_tags"
ON public.product_tags
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 7. PRODUCT_IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON public.product_images(product_id, is_primary) WHERE is_primary = true;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product images"
ON public.product_images
FOR SELECT
TO public
USING (true);

CREATE POLICY "Service role full access on product_images"
ON public.product_images
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 8. PRODUCT_VARIANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    sku_code VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(50),
    size VARCHAR(20),
    stock_quantity INTEGER DEFAULT 0,
    price_override NUMERIC(10, 2), -- If null, use product's selling_price
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_variants_product ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON public.product_variants(sku_code);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON public.product_variants(stock_quantity);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active variants"
ON public.product_variants
FOR SELECT
TO public
USING (is_active = true);

CREATE POLICY "Service role full access on product_variants"
ON public.product_variants
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 9. CART_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.cart_items (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, variant_id) -- Prevent duplicate items in cart
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON public.cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_variant ON public.cart_items(variant_id);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
ON public.cart_items
FOR ALL
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Service role full access on cart_items"
ON public.cart_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 10. LIKED_PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.liked_products (
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_liked_user ON public.liked_products(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_product ON public.liked_products(product_id);

ALTER TABLE public.liked_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own likes"
ON public.liked_products
FOR ALL
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Service role full access on liked_products"
ON public.liked_products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 11. COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value NUMERIC(10, 2) NOT NULL,
    min_cart_value NUMERIC(10, 2) DEFAULT 0,
    max_discount NUMERIC(10, 2), -- For percentage coupons
    start_date TIMESTAMPTZ DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(is_active) WHERE is_active = true;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active coupons"
ON public.coupons
FOR SELECT
TO public
USING (is_active = true AND NOW() BETWEEN start_date AND COALESCE(end_date, NOW() + INTERVAL '100 years'));

CREATE POLICY "Service role full access on coupons"
ON public.coupons
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 12. USER_COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_coupons (
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    coupon_id INTEGER REFERENCES public.coupons(id) ON DELETE CASCADE,
    used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_user_coupons_user ON public.user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon ON public.user_coupons(coupon_id);

ALTER TABLE public.user_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coupons"
ON public.user_coupons
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access on user_coupons"
ON public.user_coupons
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 13. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    final_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed')),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    qikink_order_id VARCHAR(100),
    coupon_id INTEGER REFERENCES public.coupons(id) ON DELETE SET NULL,
    shipping_address JSONB NOT NULL, -- Store address as JSON
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access on orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 14. ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL, -- Snapshot at time of order
    variant_details JSONB, -- Store color, size as JSON snapshot
    price NUMERIC(10, 2) NOT NULL, -- Price at time of order
    quantity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items(variant_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
ON public.order_items
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()::text
    )
);

CREATE POLICY "Service role full access on order_items"
ON public.order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 15. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_gateway VARCHAR(50) DEFAULT 'razorpay',
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'success', 'failed', 'refunded')),
    payment_reference VARCHAR(100), -- razorpay_payment_id
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50), -- card, upi, netbanking, etc.
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = payments.order_id 
        AND orders.user_id = auth.uid()::text
    )
);

CREATE POLICY "Service role full access on payments"
ON public.payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- 16. REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id SERIAL PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id) -- One review per user per product
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reviews"
ON public.reviews
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create reviews"
ON public.reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own reviews"
ON public.reviews
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own reviews"
ON public.reviews
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

CREATE POLICY "Service role full access on reviews"
ON public.reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMPLETED!
-- ============================================
-- All tables created with:
-- ✅ Proper foreign key relationships
-- ✅ Indexes for performance
-- ✅ Row Level Security (RLS) policies
-- ✅ Automatic timestamp updates
-- ✅ Data validation constraints
