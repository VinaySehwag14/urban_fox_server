# Database Schema - Urban Fox E-Commerce

## Entity Relationship Diagram

```mermaid
erDiagram

    %% USERS
    users {
        INT id PK
        VARCHAR name
        VARCHAR email
        TEXT password_hash
        BOOLEAN is_verified
        TIMESTAMP created_at
    }

    admin_users {
        INT id PK
        VARCHAR name
        VARCHAR email
        TEXT password_hash
        TIMESTAMP created_at
    }

    %% CATEGORIES
    categories {
        INT id PK
        VARCHAR name
        VARCHAR slug
        TEXT description
        INT parent_id FK
        TEXT image_url
        BOOLEAN is_active
        TIMESTAMP created_at
    }

    %% PRODUCTS
    products {
        INT id PK
        VARCHAR name
        VARCHAR slug
        TEXT description
        VARCHAR qikink_sku
        VARCHAR brand
        NUMERIC mrp
        NUMERIC selling_price
        INT discount_percent
        BOOLEAN is_featured
        BOOLEAN is_active
        TIMESTAMP created_at
    }

    product_categories {
        INT product_id FK
        INT category_id FK
    }

    product_images {
        INT id PK
        INT product_id FK
        TEXT image_url
        BOOLEAN is_primary
    }

    tags {
        INT id PK
        VARCHAR name
    }

    product_tags {
        INT product_id FK
        INT tag_id FK
    }

    %% VARIANTS
    product_variants {
        INT id PK
        INT product_id FK
        VARCHAR sku_code
        VARCHAR color
        VARCHAR size
        INTEGER stock_quantity
        NUMERIC price_override
        TEXT image_url
        BOOLEAN is_active
    }

    %% CART + LIKED
    cart_items {
        INT id PK
        INT user_id FK
        INT variant_id FK
        INT quantity
    }

    liked_products {
        INT user_id FK
        INT product_id FK
    }

    %% ORDERS & PAYMENTS
    orders {
        INT id PK
        INT user_id FK
        NUMERIC total_amount
        VARCHAR status
        VARCHAR razorpay_payment_id
        VARCHAR qikink_order_id
        TIMESTAMP created_at
    }

    order_items {
        INT id PK
        INT order_id FK
        INT variant_id FK
        NUMERIC price
        INT quantity
    }

    payments {
        INT id PK
        INT order_id FK
        VARCHAR payment_gateway
        VARCHAR payment_status
        VARCHAR payment_reference
        TIMESTAMP paid_at
    }

    %% COUPONS
    coupons {
        INT id PK
        VARCHAR code
        VARCHAR type
        NUMERIC value
        NUMERIC min_cart_value
        TIMESTAMP start_date
        TIMESTAMP end_date
        INT usage_limit
    }

    user_coupons {
        INT user_id FK
        INT coupon_id FK
        BOOLEAN used
    }

    %% REVIEWS
    reviews {
        INT id PK
        INT user_id FK
        INT product_id FK
        INT rating
        TEXT comment
        TIMESTAMP created_at
    }

    %% RELATIONSHIPS
    users ||--o{ orders : places
    users ||--o{ cart_items : adds
    users ||--o{ liked_products : likes
    users ||--o{ reviews : writes
    users ||--o{ user_coupons : uses

    admin_users ||--o{ products : manages

    products ||--o{ product_variants : has
    products ||--o{ product_images : includes
    products ||--o{ product_categories : belongs_to
    products ||--o{ product_tags : tagged_with
    products ||--o{ reviews : reviewed_by
    products ||--o{ liked_products : liked_by

    product_variants ||--o{ cart_items : in_cart
    product_variants ||--o{ order_items : purchased_in

    categories ||--o{ product_categories : organizes
    tags ||--o{ product_tags : labels

    orders ||--o{ order_items : contains
    orders ||--|| payments : paid_with
    orders ||--o{ coupons : uses

    coupons ||--o{ user_coupons : claimed_by
```

## Database Tables

### Core Entities

#### **users**
Stores authenticated user information (Firebase UIDs)
- Primary authentication via Firebase
- Links to orders, cart, liked products, reviews

#### **admin_users**
Admin user accounts with separate authentication
- Manages products and system administration
- JWT-based authentication

#### **products**
Main product catalog
- Contains pricing, brand, SKU information
- Computed discount percentage
- Links to variants, images, categories, tags

#### **product_variants**
Product variations (size, color combinations)
- Individual SKUs with stock tracking
- Optional price overrides
- Links to cart items and order items

#### **categories**
Hierarchical product categorization
- Self-referencing for parent-child relationships
- Slug-based URLs

#### **product_images**
Product image gallery
- Primary image designation
- Display order

#### **tags**
Product tags for filtering

### Shopping Features

#### **cart_items**
User shopping carts
- Real-time stock validation
- Quantity management

#### **liked_products**
User wishlists/favorites

### Order Management

#### **orders**
Order records
- Payment integration (Razorpay)
- Fulfillment integration (Qikink)
- Order status tracking
- Shipping address stored as JSON

#### **order_items**
Order line items
- Snapshot of product/variant at purchase time
- Historical price records

#### **payments**
Payment transaction records
- Razorpay integration
- Payment status tracking

### Marketing

#### **coupons**
Discount coupons
- Percentage or fixed value
- Usage limits and date ranges

#### **user_coupons**
Coupon usage tracking per user

### Social

#### **reviews**
Product reviews and ratings
- 1-5 star rating system
- Verified purchase flag
- One review per user per product

## Implementation Status

- ✅ Schema created in `complete_schema.sql`
- ✅ All tables with foreign keys and indexes
- ✅ Row Level Security (RLS) policies configured
- ✅ Triggers for auto-updating timestamps

## Related Files

- Database Schema: `complete_schema.sql`
- Setup Guide: `DATABASE_SETUP.md`
- API Documentation: See artifacts in `.gemini/antigravity/brain/`
