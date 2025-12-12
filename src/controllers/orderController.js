const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { ORDER_STATUS } = require("../utils/types");

// POST /api/v1/orders
exports.createOrder = asyncHandler(async (req, res, next) => {
    let {
        items, // Array of { variant_id, quantity }
        shipping_address,
        payment_method,
        from_cart
    } = req.body;

    const userId = req.user.uid;

    // Handle Buy from Cart logic
    if (from_cart) {
        const { data: cartItems, error: cartError } = await supabase
            .from("cart_items")
            .select("variant_id, quantity")
            .eq("user_id", userId);

        if (cartError) {
            throw new ApiError(500, `Failed to fetch cart: ${cartError.message}`);
        }

        if (!cartItems || cartItems.length === 0) {
            throw new ApiError(400, "Cart is empty");
        }

        items = cartItems;
    }

    if (!items || items.length === 0) {
        throw new ApiError(400, "Order must contain at least one item");
    }

    if (!shipping_address) {
        throw new ApiError(400, "Shipping address is required");
    }

    // 1. Fetch Variants to validate stock and prices
    const variantIds = items.map(i => i.variant_id);
    const { data: variants, error: varError } = await supabase
        .from("product_variants")
        .select(`
            *,
            product:products(name, selling_price)
        `)
        .in("id", variantIds);

    if (varError) throw new ApiError(500, `Failed to fetch variants: ${varError.message}`);

    if (variants.length !== variantIds.length) {
        throw new ApiError(400, "One or more products not found");
    }

    // 2. Calculate Totals & Validate Stock
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
        const variant = variants.find(v => v.id === item.variant_id);

        if (!variant.is_active) {
            throw new ApiError(400, `Product ${variant.product.name} (${variant.sku_code}) is not active`);
        }

        if (variant.stock_quantity < item.quantity) {
            throw new ApiError(400, `Insufficient stock for ${variant.product.name} (${variant.sku_code})`);
        }

        const price = variant.price_override || variant.product.selling_price;
        totalAmount += price * item.quantity;

        orderItemsData.push({
            variant_id: variant.id,
            product_name: variant.product.name,
            variant_details: {
                color: variant.color,
                size: variant.size,
                sku: variant.sku_code
            },
            price: price,
            quantity: item.quantity
        });
    }

    // 3. Create Order
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
            user_id: userId,
            total_amount: totalAmount,
            final_amount: totalAmount, // Logic for discounts/coupons can be added here
            status: ORDER_STATUS.PENDING,
            shipping_address: shipping_address
        })
        .select()
        .single();

    if (orderError) throw new ApiError(500, `Failed to create order: ${orderError.message}`);

    // 4. Create Order Items
    const itemsToInsert = orderItemsData.map(item => ({
        order_id: order.id,
        ...item
    }));

    const { error: itemsInsertError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

    if (itemsInsertError) {
        // Rollback order (manual)
        await supabase.from("orders").delete().eq("id", order.id);
        throw new ApiError(500, `Failed to create order items: ${itemsInsertError.message}`);
    }

    // 5. Update Stock
    for (const item of items) {
        const variant = variants.find(v => v.id === item.variant_id);
        const newStock = variant.stock_quantity - item.quantity;

        await supabase
            .from("product_variants")
            .update({ stock_quantity: newStock })
            .eq("id", variant.id);
    }

    // 6. Clear Cart if order was from cart
    if (from_cart) {
        await supabase
            .from("cart_items")
            .delete()
            .eq("user_id", userId);
    }

    return res.status(201).json({
        success: true,
        message: "Order created successfully",
        order_id: order.id
    });
});

// GET /api/v1/orders
exports.getUserOrders = asyncHandler(async (req, res, next) => {
    const userId = req.user.uid;

    const { data: orders, error } = await supabase
        .from("orders")
        .select(`
            *,
            items:order_items(*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, `Failed to fetch orders: ${error.message}`);

    return res.status(200).json({
        success: true,
        orders
    });
});

// GET /api/v1/orders/:id
exports.getOrderById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user.uid;

    const { data: order, error } = await supabase
        .from("orders")
        .select(`
            *,
            items:order_items(*)
        `)
        .eq("id", id)
        .single();

    if (error || !order) throw new ApiError(404, "Order not found");

    // Check ownership
    if (order.user_id !== userId) {
        throw new ApiError(403, "Not authorized to view this order");
    }

    return res.status(200).json({
        success: true,
        order
    });
});

// PATCH /api/v1/orders/:id/status (Admin only - middleware needed in route)
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!Object.values(ORDER_STATUS).includes(status)) {
        throw new ApiError(400, "Invalid order status");
    }

    const { data: order, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

    if (error) throw new ApiError(500, `Failed to update order: ${error.message}`);
    if (!order) throw new ApiError(404, "Order not found");

    return res.status(200).json({
        success: true,
        message: "Order status updated",
        order
    });
});
// GET /api/v1/orders/admin/:id (Admin only)
exports.getAdminOrderById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const { data: order, error } = await supabase
        .from("orders")
        .select(`
            *,
            items:order_items(*),
            user:users(id, name, email, phone_number)
        `)
        .eq("id", id)
        .single();

    if (error || !order) throw new ApiError(404, "Order not found");

    return res.status(200).json({
        success: true,
        order
    });
});

// GET /api/v1/orders/admin (Admin only - List all orders)
exports.getAllAdminOrders = asyncHandler(async (req, res, next) => {
    const { data: orders, error } = await supabase
        .from("orders")
        .select(`
            *,
            items:order_items(*),
            user:users(id, name, email, phone_number)
        `)
        .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, `Failed to fetch orders: ${error.message}`);

    return res.status(200).json({
        success: true,
        orders
    });
});
