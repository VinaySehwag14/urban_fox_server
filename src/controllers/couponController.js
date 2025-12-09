const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { COUPON_TYPE } = require("../utils/types");

// POST /api/v1/coupons/validate (Public/User)
exports.validateCoupon = asyncHandler(async (req, res, next) => {
    const { code, cartTotal } = req.body;

    if (!code) throw new ApiError(400, "Coupon code is required");

    const { data: coupon, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .single();

    if (error || !coupon) {
        throw new ApiError(404, "Invalid or expired coupon");
    }

    // Check dates
    const now = new Date();
    if (new Date(coupon.start_date) > now) {
        throw new ApiError(400, "Coupon is not yet active");
    }
    if (coupon.end_date && new Date(coupon.end_date) < now) {
        throw new ApiError(400, "Coupon has expired");
    }

    // Check usage limits
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
        throw new ApiError(400, "Coupon usage limit reached");
    }

    // Check min cart value
    if (cartTotal < coupon.min_cart_value) {
        throw new ApiError(400, `Minimum cart value of ${coupon.min_cart_value} required`);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === COUPON_TYPE.PERCENTAGE) {
        discountAmount = (cartTotal * coupon.value) / 100;
        if (coupon.max_discount && discountAmount > coupon.max_discount) {
            discountAmount = coupon.max_discount;
        }
    } else if (coupon.type === COUPON_TYPE.FIXED) {
        discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed total
    if (discountAmount > cartTotal) {
        discountAmount = cartTotal;
    }

    return res.status(200).json({
        success: true,
        coupon_id: coupon.id,
        code: coupon.code,
        discount_amount: discountAmount
    });
});

// POST /api/v1/coupons (Admin)
exports.createCoupon = asyncHandler(async (req, res, next) => {
    const {
        code,
        type,
        value,
        min_cart_value,
        max_discount,
        start_date,
        end_date,
        usage_limit
    } = req.body;

    if (!code || !type || !value) {
        throw new ApiError(400, "Code, type, and value are required");
    }

    const { data: coupon, error } = await supabase
        .from("coupons")
        .insert({
            code,
            type,
            value,
            min_cart_value: min_cart_value || 0,
            max_discount,
            start_date: start_date || new Date(),
            end_date,
            usage_limit,
            is_active: true
        })
        .select()
        .single();

    if (error) throw new ApiError(500, `Failed to create coupon: ${error.message}`);

    return res.status(201).json({
        success: true,
        message: "Coupon created",
        coupon
    });
});

// GET /api/v1/coupons (Admin)
exports.listCoupons = asyncHandler(async (req, res, next) => {
    const { data: coupons, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, `Failed to list coupons: ${error.message}`);

    return res.status(200).json({
        success: true,
        coupons
    });
});

// DELETE /api/v1/coupons/:id
exports.deleteCoupon = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) throw new ApiError(500, `Failed to delete coupon: ${error.message}`);
    return res.status(200).json({ success: true, message: "Coupon deleted" });
});

// PATCH /api/v1/coupons/:id
exports.updateCoupon = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { is_active } = req.body; // Usually only simple toggles allowed, but could expand.

    // For now allow is_active toggle
    if (is_active === undefined) throw new ApiError(400, "Only is_active update supported for now");

    const { data: coupon, error } = await supabase
        .from("coupons")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

    if (error) throw new ApiError(500, `Failed to update coupon: ${error.message}`);
    return res.status(200).json({ success: true, coupon });
});
