const productService = require('../services/productService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all products with filters
 * @route   GET /api/v1/products
 * @access  Public
 */
exports.getAllProducts = asyncHandler(async (req, res) => {
    const filters = {
        page: req.query.page,
        limit: req.query.limit,
        category: req.query.category,
        tag: req.query.tag,
        featured: req.query.featured,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        sort: req.query.sort,
        order: req.query.order,
        search: req.query.search
    };

    const result = await productService.getAllProducts(filters);

    res.status(200).json({
        success: true,
        ...result
    });
});

/**
 * @desc    Get single product by slug
 * @route   GET /api/v1/products/:slug
 * @access  Public
 */
exports.getProduct = asyncHandler(async (req, res) => {
    const product = await productService.getProductBySlug(req.params.slug);

    res.status(200).json({
        success: true,
        product
    });
});

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
        product
    });
});

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
        product
    });
});

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
    });
});
