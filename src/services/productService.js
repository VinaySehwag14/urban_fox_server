const supabase = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Product Service
 * Handles all business logic for products, variants, images, categories, and tags
 */

class ProductService {
    /**
     * Get all products with filters, pagination, and relations
     */
    async getAllProducts(filters = {}) {
        const {
            page = 1,
            limit = 20,
            category,
            tag,
            featured,
            minPrice,
            maxPrice,
            sort = 'created_at',
            order = 'desc',
            search
        } = filters;

        const offset = (page - 1) * limit;

        // Build query
        let query = supabase
            .from('products')
            .select(`
                id,
                name,
                slug,
                description,
                brand,
                mrp,
                selling_price,
                discount_percent,
                is_featured,
                created_at,
                product_images!inner(image_url, is_primary),
                product_categories!inner(
                    category_id,
                    categories(id, name, slug)
                )
            `, { count: 'exact' })
            .eq('is_active', true);

        // Apply filters
        if (featured !== undefined) {
            query = query.eq('is_featured', featured);
        }

        if (minPrice) {
            query = query.gte('selling_price', minPrice);
        }

        if (maxPrice) {
            query = query.lte('selling_price', maxPrice);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Category filter
        if (category) {
            // Get category by slug first
            const { data: categoryData } = await supabase
                .from('categories')
                .select('id')
                .eq('slug', category)
                .single();

            if (categoryData) {
                query = query.contains('product_categories.category_id', [categoryData.id]);
            }
        }

        // Sorting
        const sortMap = {
            price_asc: { column: 'selling_price', ascending: true },
            price_desc: { column: 'selling_price', ascending: false },
            name: { column: 'name', ascending: true },
            newest: { column: 'created_at', ascending: false },
            oldest: { column: 'created_at', ascending: true },
        };

        const sortConfig = sortMap[sort] || { column: 'created_at', ascending: order === 'asc' };
        query = query.order(sortConfig.column, { ascending: sortConfig.ascending });

        // Pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            throw new ApiError(500, `Failed to fetch products: ${error.message}`);
        }

        // Transform data to get primary image and flatten categories
        const products = data.map(product => {
            const primaryImage = product.product_images?.find(img => img.is_primary)?.image_url
                || product.product_images?.[0]?.image_url;

            const categories = product.product_categories?.map(pc => pc.categories) || [];

            return {
                id: product.id,
                name: product.name,
                slug: product.slug,
                description: product.description,
                brand: product.brand,
                mrp: product.mrp,
                selling_price: product.selling_price,
                discount_percent: product.discount_percent,
                is_featured: product.is_featured,
                primary_image: primaryImage,
                categories,
                created_at: product.created_at
            };
        });

        return {
            products,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
        };
    }

    /**
     * Get single product by slug with all relations
     */
    async getProductBySlug(slug) {
        // Get product with all relations
        const { data: product, error } = await supabase
            .from('products')
            .select(`
                *,
                product_images(id, image_url, is_primary, display_order),
                product_variants(
                    id, sku_code, color, size, stock_quantity, 
                    price_override, image_url, is_active
                ),
                product_categories(
                    categories(id, name, slug, image_url)
                ),
                product_tags(
                    tags(id, name)
                )
            `)
            .eq('slug', slug)
            .eq('is_active', true)
            .single();

        if (error || !product) {
            throw new ApiError(404, 'Product not found');
        }

        // Sort images by display_order
        product.product_images = product.product_images?.sort((a, b) => a.display_order - b.display_order) || [];

        // Flatten categories and tags
        product.categories = product.product_categories?.map(pc => pc.categories) || [];
        product.tags = product.product_tags?.map(pt => pt.tags) || [];

        // Remove junction tables
        delete product.product_categories;
        delete product.product_tags;

        return product;
    }

    /**
     * Create new product with images, variants, categories, and tags
     */
    async createProduct(productData) {
        const {
            name,
            slug,
            description,
            qikink_sku,
            brand,
            mrp,
            selling_price,
            is_featured = false,
            categories = [],
            tags = [],
            images = [],
            variants = []
        } = productData;

        // Validate required fields
        if (!name || !slug || !mrp || !selling_price) {
            throw new ApiError(400, 'Missing required fields: name, slug, mrp, selling_price');
        }

        // Create product
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert({
                name,
                slug,
                description,
                qikink_sku,
                brand,
                mrp,
                selling_price,
                is_featured
            })
            .select()
            .single();

        if (productError) {
            if (productError.code === '23505') {
                throw new ApiError(409, 'Product with this slug already exists');
            }
            throw new ApiError(500, `Failed to create product: ${productError.message}`);
        }

        const productId = product.id;

        // Add product images
        if (images.length > 0) {
            const imagesData = images.map((img, index) => ({
                product_id: productId,
                image_url: img.image_url,
                is_primary: img.is_primary || index === 0,
                display_order: img.display_order || index
            }));

            const { error: imagesError } = await supabase
                .from('product_images')
                .insert(imagesData);

            if (imagesError) {
                // Rollback: delete product
                await supabase.from('products').delete().eq('id', productId);
                throw new ApiError(500, `Failed to add images: ${imagesError.message}`);
            }
        }

        // Add product variants
        if (variants.length > 0) {
            const variantsData = variants.map(v => ({
                product_id: productId,
                sku_code: v.sku_code,
                color: v.color,
                size: v.size,
                stock_quantity: v.stock_quantity || 0,
                price_override: v.price_override,
                image_url: v.image_url,
                is_active: v.is_active !== false
            }));

            const { error: variantsError } = await supabase
                .from('product_variants')
                .insert(variantsData);

            if (variantsError) {
                // Rollback
                await supabase.from('products').delete().eq('id', productId);
                throw new ApiError(500, `Failed to add variants: ${variantsError.message}`);
            }
        }

        // Add product-category relationships
        if (categories.length > 0) {
            const categoriesData = categories.map(catId => ({
                product_id: productId,
                category_id: catId
            }));

            const { error: categoriesError } = await supabase
                .from('product_categories')
                .insert(categoriesData);

            if (categoriesError) {
                console.error('Failed to add categories:', categoriesError);
            }
        }

        // Add product-tag relationships
        if (tags.length > 0) {
            const tagsData = tags.map(tagId => ({
                product_id: productId,
                tag_id: tagId
            }));

            const { error: tagsError } = await supabase
                .from('product_tags')
                .insert(tagsData);

            if (tagsError) {
                console.error('Failed to add tags:', tagsError);
            }
        }

        // Fetch and return complete product
        return await this.getProductBySlug(slug);
    }

    /**
     * Update product
     */
    async updateProduct(productId, updates) {
        const {
            name,
            description,
            qikink_sku,
            brand,
            mrp,
            selling_price,
            is_featured,
            is_active,
            categories,
            tags
        } = updates;

        // Build update object
        const productUpdates = {};
        if (name !== undefined) productUpdates.name = name;
        if (description !== undefined) productUpdates.description = description;
        if (qikink_sku !== undefined) productUpdates.qikink_sku = qikink_sku;
        if (brand !== undefined) productUpdates.brand = brand;
        if (mrp !== undefined) productUpdates.mrp = mrp;
        if (selling_price !== undefined) productUpdates.selling_price = selling_price;
        if (is_featured !== undefined) productUpdates.is_featured = is_featured;
        if (is_active !== undefined) productUpdates.is_active = is_active;

        // Update product
        const { data: product, error } = await supabase
            .from('products')
            .update(productUpdates)
            .eq('id', productId)
            .select('slug')
            .single();

        if (error || !product) {
            throw new ApiError(404, 'Product not found or update failed');
        }

        // Update categories if provided
        if (categories !== undefined) {
            // Delete existing
            await supabase.from('product_categories').delete().eq('product_id', productId);

            // Insert new
            if (categories.length > 0) {
                const categoriesData = categories.map(catId => ({
                    product_id: productId,
                    category_id: catId
                }));
                await supabase.from('product_categories').insert(categoriesData);
            }
        }

        // Update tags if provided
        if (tags !== undefined) {
            // Delete existing
            await supabase.from('product_tags').delete().eq('product_id', productId);

            // Insert new
            if (tags.length > 0) {
                const tagsData = tags.map(tagId => ({
                    product_id: productId,
                    tag_id: tagId
                }));
                await supabase.from('product_tags').insert(tagsData);
            }
        }

        // Return updated product
        return await this.getProductBySlug(product.slug);
    }

    /**
     * Delete product (soft delete)
     */
    async deleteProduct(productId) {
        const { data, error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', productId)
            .select()
            .single();

        if (error || !data) {
            throw new ApiError(404, 'Product not found');
        }

        return { message: 'Product deleted successfully' };
    }

    /**
     * Get product variants
     */
    async getProductVariants(productId) {
        const { data, error } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .eq('is_active', true);

        if (error) {
            throw new ApiError(500, `Failed to fetch variants: ${error.message}`);
        }

        return data;
    }
}

module.exports = new ProductService();
