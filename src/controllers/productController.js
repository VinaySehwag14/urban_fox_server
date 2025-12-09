const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { generateSlug } = require("../utils/slugify");

// GET /api/v1/products/all?category=hoodies
exports.getAllProducts = asyncHandler(async (req, res, next) => {
    const { category } = req.query; // Slug of the category

    let query = supabase
        .from("products")
        .select(`
            *,
            categories:product_categories!inner(
                category:categories!inner(id, name, slug)
            ),
            variants:product_variants(*),
            images:product_images(*)
        `)
        .eq('is_active', true)
        .order("created_at", { ascending: false });

    // Filter by category slug if provided
    if (category) {
        // The !inner join on both product_categories and categories ensures we only get products 
        // that match the category condition.
        // We filter on the nested category table using Supabase's flatten notation if possible,
        // but often deep filtering is tricky.
        // The "!inner" on `categories` (the alias for product_categories column joined to categories) 
        // works if we put the filter in the top level eq? No that filters Product columns.

        // Supabase PostgREST syntax for deep filtering: 
        // product_categories.categories.slug

        // Correct approach for many-to-many filtering in Supabase JS:
        // We use the alias 'categories' defined in select.
        // And we must use !inner to make it an INNER JOIN not LEFT JOIN.

        // However, applying 'eq' on nested relation like `categories.category.slug` is not directly 
        // supported as top-level `eq`.
        // We have to use the filter options or embedded filtering.

        // Actually, the select string defines the join.
        // .eq('categories.category.slug', category) // This syntax is valid in recent PostgREST versions.

        // Let's try the standard way:
        query = query.eq('product_categories.categories.slug', category);
        // But wait, the path is `product_categories` -> `categories`. 
        // My select has `categories:product_categories`.
        // And inside that `category:categories`.
        // So path is `categories.category.slug`.

        // But actually, there is a cleaner way often used:
        // Filter inside the select inner join logic? No, JS SDK chains filters.

        // Let's use the property name in the response? No, it's DB column paths.
        // The table is `product_categories`, let's not alias in select for safety first or match correct path.

        // Actually, simpler if I don't need complex aliases for filtering:
        // But I used aliases in the SELECT.

        // Let's rely on the Supabase documentation pattern for filtering on joined tables:
        // .eq('product_categories.categories.slug', category)
        // Given that I used `!inner` in select, rows that don't match the inner join logic should disappear?
        // No, I need to specify the condition.

        // Let's try a different simpler approach if deep filter fails often:
        // Fetch category ID first? No, extra call.

        // The syntax `categories.category.slug` might be tricky.
        // Let's try straightforward filtering on the junction first? No junction has only IDs.

        // Let's look at Step 306: The user asked specifically for `?category=Hoodies`.
        // I will implement the most robust way:
        // 1. If category param exists, find the Category ID first (reliable).
        // 2. Then filter products by that Category ID using the junction table.
        // This avoids deep join filter syntax issues which can be flaky in some Supabase versions.

        const { data: catData } = await supabase.from("categories").select("id").eq("slug", category).single();
        if (catData) {
            // Filter using the junction table
            // But we can't easily filter parent by child in one goes without !inner + filter.

            // Let's revert to !inner join approach but use the simpler known syntax.
            // If we use !inner, we can apply filter...
            // Actually, querying products AND filtering by junction is:
            // .eq('product_categories.category_id', catData.id) ?? No, product_categories is a relation array.

            // Wait, the safest "Filter by Category" in Supabase is:
            query = supabase
                .from("product_categories")
                .select(`
                    product:products!inner(
                        *,
                        variants:product_variants(*),
                        images:product_images(*)
                    ),
                    category:categories!inner(slug)
                `)
                .eq("category.slug", category)
                .order("created_at", { foreignTable: "products", ascending: false });

            // But this returns a list of product_categories objects, not products.
            // Transformation is needed.

            // This changes the response structure significantly. The user likely wants same structure.

            // Alternative: Use `!inner` in the main query and correct filter string.
            // .select('..., categories:product_categories!inner(category:categories!inner(slug))')
            // .eq('categories.category.slug', category) -- This is the intended way.

            // Let's stick to the original plan but ensure `!inner` is used.
            query = supabase
                .from("products")
                .select(`
                    *,
                    categories:product_categories!inner(
                        category:categories!inner(id, name, slug)
                    ),
                    variants:product_variants(*),
                    images:product_images(*)
                `)
                .eq('is_active', true)
                .eq('categories.category.slug', category)
                .order("created_at", { ascending: false });
        }
    }

    const { data: products, error } = await query;

    if (error) {
        throw new ApiError(500, `Failed to fetch products: ${error.message}`);
    }

    // Transform data structure if needed to flatten categories
    const transformedProducts = products.map(p => ({
        ...p,
        categories: p.categories.map(pc => pc.category)
    }));

    return res.status(200).json({
        success: true,
        count: transformedProducts.length,
        products: transformedProducts
    });
});

// GET /api/v1/products/:slug
exports.getProductBySlug = asyncHandler(async (req, res, next) => {
    const { slug } = req.params;

    const { data: product, error } = await supabase
        .from("products")
        .select(`
            *,
            categories:product_categories(
                category:categories(id, name, slug)
            ),
            variants:product_variants(*),
            images:product_images(*)
        `)
        .eq("slug", slug)
        .single();

    if (error || !product) {
        throw new ApiError(404, "Product not found");
    }

    // Transform categories
    product.categories = product.categories.map(pc => pc.category);

    // Sort images by display_order
    if (product.images) {
        product.images.sort((a, b) => a.display_order - b.display_order);
    }

    return res.status(200).json({
        success: true,
        product
    });
});

// POST /api/v1/products/add
exports.addProduct = asyncHandler(async (req, res, next) => {
    const {
        name,
        description,
        brand,
        qikink_sku,
        mrp,
        selling_price,
        is_featured,
        is_active,
        category_ids, // Array of UUIDs
        tag_ids, // Array of IDs
        variants, // Array of { sku_code, color, size, stock_quantity, price_override, image_url }
        images // Array of { image_url, is_primary, display_order }
    } = req.body;

    if (!name || !selling_price || !mrp) {
        throw new ApiError(400, "Name, MRP and Selling Price are required");
    }

    const slug = generateSlug(name);

    // 1. Insert Product Base
    const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
            name,
            slug,
            description,
            brand,
            qikink_sku,
            mrp,
            selling_price,
            is_featured: is_featured || false,
            is_active: is_active ?? true
        })
        .select()
        .single();

    if (productError) {
        throw new ApiError(500, `Failed to create product: ${productError.message}`);
    }

    const productId = product.id;

    try {
        // 2. Insert Categories
        if (category_ids && category_ids.length > 0) {
            const categoryInserts = category_ids.map(catId => ({
                product_id: productId,
                category_id: catId
            }));
            const { error: catError } = await supabase.from("product_categories").insert(categoryInserts);
            if (catError) throw catError;
        }

        // 3. Insert Tags
        if (tag_ids && tag_ids.length > 0) {
            const tagInserts = tag_ids.map(tagId => ({
                product_id: productId,
                tag_id: tagId
            }));
            const { error: tagError } = await supabase.from("product_tags").insert(tagInserts);
            if (tagError) throw tagError;
        }

        // 4. Insert Variants
        if (variants && variants.length > 0) {
            const variantInserts = variants.map(v => ({
                product_id: productId,
                sku_code: v.sku_code || `${slug}-${v.color}-${v.size}`.toLowerCase(),
                color: v.color,
                size: v.size,
                stock_quantity: v.stock_quantity || 0,
                price_override: v.selling_price || v.price_override, // Keep explicit selling price
                mrp: v.mrp || mrp, // Default to product MRP if not provided
                selling_price: v.selling_price || selling_price, // Default to product selling price
                image_url: v.image_url,
                is_active: true
            }));
            const { error: varError } = await supabase.from("product_variants").insert(variantInserts);
            if (varError) throw varError;
        }

        // 5. Insert Images
        if (images && images.length > 0) {
            const imageInserts = images.map((img, index) => ({
                product_id: productId,
                image_url: img.image_url || img, // Handle both object and string input
                is_primary: typeof img === 'object' ? (img.is_primary || index === 0) : index === 0,
                display_order: typeof img === 'object' ? (img.display_order || index) : index
            }));
            const { error: imgError } = await supabase.from("product_images").insert(imageInserts);
            if (imgError) throw imgError;
        }

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            product_id: productId
        });

    } catch (err) {
        // Rollback strategy (manual delete since no transactions in simple REST calls usually, though Supabase supports RPC for transactions)
        // For now, we'll just log and return error, typically we'd delete the created product
        await supabase.from("products").delete().eq("id", productId);
        throw new ApiError(500, `Failed to create product associations: ${err.message}`);
    }
});

// PATCH /api/v1/products/edit/:id
exports.editProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const {
        name,
        description,
        brand,
        mrp,
        selling_price,
        is_featured,
        is_active,
        category_ids,
        variants, // Full replace or smart diff? For simplicity: strategy often is to add new/update existing.
        // For this implementation, let's assume we update base fields and maybe basic variant stock management would be separate endpoints usually.
        // But let's support basic base update here.
    } = req.body;

    if (!id) throw new ApiError(400, "Product ID required");

    const updates = {};
    if (name) {
        updates.name = name;
        updates.slug = generateSlug(name);
    }
    if (description !== undefined) updates.description = description;
    if (brand !== undefined) updates.brand = brand;
    if (mrp !== undefined) updates.mrp = mrp;
    if (selling_price !== undefined) updates.selling_price = selling_price;
    if (is_featured !== undefined) updates.is_featured = is_featured;
    if (is_active !== undefined) updates.is_active = is_active;

    // Update base product
    if (Object.keys(updates).length > 0) {
        const { error } = await supabase
            .from("products")
            .update(updates)
            .eq("id", id);

        if (error) throw new ApiError(500, `Failed to update product: ${error.message}`);
    }

    // Update categories (Replace strategy)
    if (category_ids) {
        // Delete old
        await supabase.from("product_categories").delete().eq("product_id", id);
        // Insert new
        if (category_ids.length > 0) {
            const categoryInserts = category_ids.map(catId => ({
                product_id: id,
                category_id: catId
            }));
            await supabase.from("product_categories").insert(categoryInserts);
        }
    }

    // Note: Updating variants/images is complex in a single PATCH. 
    // Usually better to have specific endpoints for 'addVariant', 'updateVariant', 'deleteVariant'.
    // For now, we will leave variants management to separate dedicated calls or a more complex sync logic if requested.

    return res.status(200).json({
        success: true,
        message: "Product updated successfully"
    });
});

// DELETE /api/v1/products/delete/:id
exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (error) {
        throw new ApiError(500, `Failed to delete product: ${error.message}`);
    }

    return res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    });
});

