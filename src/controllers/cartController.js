const cartService = require('../services/cartService');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get user's cart
 * @route   GET /api/v1/cart
 * @access  Private (User)
 */
exports.getCart = asyncHandler(async (req, res) => {
    const cart = await cartService.getUserCart(req.user.uid);

    res.status(200).json({
        success: true,
        cart
    });
});

/**
 * @desc    Add item to cart
 * @route   POST /api/v1/cart
 * @access  Private (User)
 */
exports.addToCart = asyncHandler(async (req, res) => {
    const { variant_id, quantity = 1 } = req.body;

    if (!variant_id) {
        throw new ApiError(400, 'Variant ID is required');
    }

    const cart = await cartService.addToCart(req.user.uid, variant_id, quantity);

    res.status(200).json({
        success: true,
        message: 'Item added to cart',
        cart
    });
});

/**
 * @desc    Update cart item quantity
 * @route   PATCH /api/v1/cart/:itemId
 * @access  Private (User)
 */
exports.updateCartItem = asyncHandler(async (req, res) => {
    const { quantity } = req.body;

    if (!quantity) {
        throw new ApiError(400, 'Quantity is required');
    }

    const cart = await cartService.updateCartItem(
        req.user.uid,
        req.params.itemId,
        quantity
    );

    res.status(200).json({
        success: true,
        message: 'Cart updated',
        cart
    });
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/v1/cart/:itemId
 * @access  Private (User)
 */
exports.removeFromCart = asyncHandler(async (req, res) => {
    const cart = await cartService.removeFromCart(req.user.uid, req.params.itemId);

    res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        cart
    });
});

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/v1/cart
 * @access  Private (User)
 */
exports.clearCart = asyncHandler(async (req, res) => {
    const result = await cartService.clearCart(req.user.uid);

    res.status(200).json({
        success: true,
        ...result
    });
});
