const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// GET /api/v1/wishlist
exports.getWishlist = asyncHandler(async (req, res, next) => {
    const userId = req.user.uid;

    const { data: items, error } = await supabase
        .from("liked_products")
        .select(`
            product_id,
            product:products(*)
        `)
        .eq("user_id", userId);

    if (error) throw new ApiError(500, `Failed to get wishlist: ${error.message}`);

    // Flatten structure
    const products = items.map(item => item.product);

    return res.status(200).json({
        success: true,
        count: products.length,
        products
    });
});

// POST /api/v1/wishlist/:productId
exports.addToWishlist = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.uid;

    const { error } = await supabase
        .from("liked_products")
        .insert({
            user_id: userId,
            product_id: productId
        });

    if (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(200).json({ success: true, message: "Already in wishlist" });
        }
        throw new ApiError(500, `Failed to add to wishlist: ${error.message}`);
    }

    return res.status(201).json({
        success: true,
        message: "Added to wishlist"
    });
});

// DELETE /api/v1/wishlist/:productId
exports.removeFromWishlist = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;
    const userId = req.user.uid;

    const { error } = await supabase
        .from("liked_products")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);

    if (error) throw new ApiError(500, `Failed to remove from wishlist: ${error.message}`);

    return res.status(200).json({
        success: true,
        message: "Removed from wishlist"
    });
});
