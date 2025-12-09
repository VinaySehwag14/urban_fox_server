const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// POST /api/v1/reviews
exports.addReview = asyncHandler(async (req, res, next) => {
    const { product_id, rating, comment } = req.body;
    const userId = req.user.uid;

    if (!product_id || !rating) {
        throw new ApiError(400, "Product ID and rating are required");
    }

    if (rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    // Verify purchase (Optional: Strict mode)
    // Check if user has an order with this product
    // Note: This requires complex join with order_items. 
    // Optimization: Just check order_items where order_id belongs to user.

    /* 
    const { data: hasPurchased, error: purchaseError } = await supabase.rpc('has_purchased', { p_user_id: userId, p_product_id: product_id });
    // Assuming we don't have an RPC, let's do a query:
    */

    const { data: orders, error: orderError } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", userId);

    let isVerifiedPurchase = false;
    if (orders && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const { data: items } = await supabase
            .from("order_items")
            .select("id") // Check variant -> product link if needed, but order_item schema stores product_name/variant_details. 
            // Wait, migration schema says order_items has variant_id.
            .in("order_id", orderIds);

        // We need to trace variant_id -> product_id. 
        // This is getting expensive for a simple check without a join helper or storing product_id in order_items.
        // Let's rely on client 'is_verified_purchase' logic or skip strict enforcement for MVP unless requested.
        // Actually, let's just mark it verified if we find it.

        // Better: Check reviews table unique constraint handles duplicates.
    }

    const { data: review, error } = await supabase
        .from("reviews")
        .insert({
            user_id: userId,
            product_id,
            rating,
            comment,
            is_verified_purchase: false // Placeholder for now
        })
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            throw new ApiError(400, "You have already reviewed this product");
        }
        throw new ApiError(500, `Failed to add review: ${error.message}`);
    }

    return res.status(201).json({
        success: true,
        message: "Review added",
        review
    });
});

// GET /api/v1/reviews/product/:productId
exports.getProductReviews = asyncHandler(async (req, res, next) => {
    const { productId } = req.params;

    const { data: reviews, error } = await supabase
        .from("reviews")
        .select(`
            *,
            user:users(id, name)
        `)
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, `Failed to fetch reviews: ${error.message}`);

    return res.status(200).json({
        success: true,
        reviews
    });
});

// DELETE /api/v1/reviews/:id
exports.deleteReview = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.uid;
    // Allow admin also? For now user only.

    const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", id)
        .eq("user_id", userId); // Strict ownership

    if (error) throw new ApiError(500, `Failed to delete review: ${error.message}`);
    return res.status(200).json({ success: true, message: "Review deleted" });
});
