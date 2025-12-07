# Database Setup Instructions

## Running the Schema

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `complete_schema.sql`
4. Paste and click **Run**
5. Verify all tables are created in the **Table Editor**

### Option 2: Command Line
```bash
# Make sure you have psql installed
psql "<your_supabase_connection_string>" -f complete_schema.sql
```

## Database Schema Overview

### Core Tables Created
- `users` - Firebase authenticated users
- `products` - Product catalog
- `product_variants` - SKUs with size/color/stock
- `product_images` - Product images
- `product_categories` - Product-category relationships
- `tags` & `product_tags` - Product tagging system
- `cart_items` - Shopping cart
- `liked_products` - User wishlists
- `orders` - Order records
- `order_items` - Order line items
- `payments` - Payment transactions
- `coupons` & `user_coupons` - Coupon system
- `reviews` - Product reviews
- `categories` - Extended with new columns
- `admin_users` - Already exists

### Features Included
✅ Foreign key relationships with proper cascading
✅ Indexes for optimal query performance
✅ Row Level Security (RLS) policies
✅ Automatic `updated_at` timestamp triggers
✅ Computed `discount_percent` column on products
✅ JSON fields for flexible data (address, variant details)
✅ Proper constraints and validation

## Next Steps

After running the schema:
1. Verify all tables exist in Supabase
2. Check RLS policies are enabled
3. Test basic queries
4. Proceed with API implementation

## Rollback (if needed)

To drop all tables:
```sql
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.user_coupons CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.liked_products CASCADE;
DROP TABLE IF EXISTS public.cart_items CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;
DROP TABLE IF EXISTS public.product_tags CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```

**Note**: This will delete all data. Use with caution!
