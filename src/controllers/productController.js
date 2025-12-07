const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { generateSlug } = require("../utils/slugify");

// GET /api/v1/products/all
exports.getAllProducts = asyncHandler(async (req, res, next) => {
    const { data: products, error } = await supabase
        .from("products")
        .select(`
            *,
            category:categories(id, name)
        `)
        .order("created_at", { ascending: false });

    if (error) {
        throw new ApiError(500, `Failed to fetch products: ${error.message}`);
    }

    return res.status(200).json({
        success: true,
        count: products.length,
        products
    });
});

// GET /api/v1/products/:slug
exports.getProductBySlug = asyncHandler(async (req, res, next) => {
    const { slug } = req.params;

    const { data: product, error } = await supabase
        .from("products")
        .select(`
            *,
            category:categories(id, name)
        `)
        .eq("slug", slug)
        .single();

    if (error || !product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json({
        success: true,
        product
    });
});

<<<<<<< HEAD
// POST /api/v1/products/add
exports.addProduct = asyncHandler(async (req, res, next) => {
    // We expect the body to match the DB schema roughly or be mapped here
    // Fields: name, images, sale_price, market_price, color, size, description, category_id, stock, is_active
    const productData = req.body;

    if (!productData.name || !productData.sale_price) {
        throw new ApiError(400, "Product name and sale price are required");
    }

    // Map fields
    if (productData.category) {
        productData.category_id = productData.category;
        delete productData.category;
    }

    // Auto-generate slug from product name
    productData.slug = generateSlug(productData.name);

    const { data: product, error } = await supabase
        .from("products")
        .insert(productData)
        .select()
        .single();

    if (error) {
        throw new ApiError(500, `Failed to add product: ${error.message}`);
    }

    return res.status(201).json({
        success: true,
        message: "Product added successfully",
=======
/**
 * @desc    Create new product
 * @route   POST /api/v1/products
 * @access  Admin
 */
exports.createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body);

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
>>>>>>> 672ad7a08fa3fe83984c0481ac497906c2e4b238
        product
    });
});

<<<<<<< HEAD
// PATCH /api/v1/products/edit/:id
exports.editProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
        throw new ApiError(400, "Product ID is required");
    }

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    // Map fields
    if (updates.category) {
        updates.category_id = updates.category;
        delete updates.category;
    }

    // Regenerate slug if name is being updated
    if (updates.name) {
        updates.slug = generateSlug(updates.name);
    }

    const { data: product, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new ApiError(500, `Failed to update product: ${error.message}`);
    }

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json({
        success: true,
        message: "Product updated successfully",
=======
/**
 * @desc    Update product
 * @route   PATCH /api/v1/products/:id
 * @access  Admin
 */
exports.updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);

    res.status(200).json({
        success: true,
        message: 'Product updated successfully',
>>>>>>> 672ad7a08fa3fe83984c0481ac497906c2e4b238
        product
    });
});

<<<<<<< HEAD
// DELETE /api/v1/products/delete/:id
exports.deleteProduct = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Product ID is required");
    }

    const { error, count } = await supabase
        .from("products")
        .delete({ count: 'exact' })
        .eq("id", id);

    if (error) {
        throw new ApiError(500, `Failed to delete product: ${error.message}`);
    }

    if (count === 0) {
        throw new ApiError(404, "Product not found");
    }

    return res.status(200).json({
        success: true,
        message: "Product deleted successfully"
=======
/**
 * @desc    Delete product (soft delete)
 * @route   DELETE /api/v1/products/:id
 * @access  Admin
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
    const result = await productService.deleteProduct(req.params.id);

    res.status(200).json({
        success: true,
        ...result
    });
});

/**
 * @desc    Get product variants
 * @route   GET /api/v1/products/:id/variants
 * @access  Public
 */
exports.getProductVariants = asyncHandler(async (req, res) => {
    const variants = await productService.getProductVariants(req.params.id);

    res.status(200).json({
        success: true,
        count: variants.length,
        variants
>>>>>>> 672ad7a08fa3fe83984c0481ac497906c2e4b238
    });
});
