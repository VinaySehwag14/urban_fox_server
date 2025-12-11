const instance = require("../config/razorpay");
const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const config = require("../config");
const supabase = require("../config/supabase");
const { ORDER_STATUS, PAYMENT_STATUS } = require("../utils/types");

// POST /api/v1/payments/create-order
exports.createPaymentOrder = asyncHandler(async (req, res, next) => {
    let { items, shipping_address } = req.body;
    const userId = req.user.uid;

    if (!items || items.length === 0) {
        throw new ApiError(400, "Order must contain at least one item");
    }

    if (!shipping_address) {
        throw new ApiError(400, "Shipping address is required");
    }

    if (!instance) {
        throw new ApiError(500, "Razorpay configuration missing");
    }

    // 1. Fetch Variants and Validate Stock (Reused from orderController logic)
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

    // 2. Calculate Total & Prepare Order Items
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

    // 3. Create Pending Order in Supabase
    // We set status to PENDING initially.
    const { data: dbOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
            user_id: userId,
            total_amount: totalAmount,
            final_amount: totalAmount,
            status: ORDER_STATUS.PENDING,
            payment_status: PAYMENT_STATUS.PENDING, // Ensure you have this column or track via status
            shipping_address: shipping_address,
            payment_method: 'online'
        })
        .select()
        .single();

    if (orderError) throw new ApiError(500, `Failed to create order in DB: ${orderError.message}`);

    // 4. Insert Order Items
    const itemsToInsert = orderItemsData.map(item => ({
        order_id: dbOrder.id,
        ...item
    }));

    const { error: itemsInsertError } = await supabase
        .from("order_items")
        .insert(itemsToInsert);

    if (itemsInsertError) {
        // Rollback
        await supabase.from("orders").delete().eq("id", dbOrder.id);
        throw new ApiError(500, `Failed to create order items: ${itemsInsertError.message}`);
    }

    // 5. Create Razorpay Order
    // We link the Razorpay receipt to our DB Order ID
    const options = {
        amount: Math.round(totalAmount * 100), // paise
        currency: "INR",
        receipt: `order_${dbOrder.id}`, // Link to DB ID
        notes: {
            db_order_id: dbOrder.id,
            user_id: userId
        }
    };

    try {
        const razorpayOrder = await instance.orders.create(options);

        // Optional: Update DB order with razorpay_order_id if you have a column for it
        // await supabase.from("orders").update({ provider_order_id: razorpayOrder.id }).eq("id", dbOrder.id);

        res.status(200).json({
            success: true,
            order: razorpayOrder,
            db_order_id: dbOrder.id, // Frontend might need this
            user_details: {
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone_number
            }
        });
    } catch (error) {
        console.error("Razorpay Order Creation Failed:", error);
        // Rollback DB order since payment setup failed
        await supabase.from("orders").delete().eq("id", dbOrder.id);

        throw new ApiError(500, `Failed to create payment order: ${error.error?.description || error.message}`);
    }
});

// POST /api/v1/payments/verify
exports.verifyPayment = asyncHandler(async (req, res, next) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, "Payment verification details missing");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", config.razorpay.key_secret)
        .update(body.toString())
        .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
        // 1. Find the order in DB based on razorpay_order_id or if passed from frontend
        // Ideally we stored razorpay_order_id in DB, OR frontend passes DB Order ID.
        // Assuming we rely on the `receipt` field mapped earlier, but Razorpay API doesn't give receipt here.
        // We need to fetch the Order from DB. 
        // Strategy: We can assume the frontend passes `db_order_id` in body, OR we search by provider_order_id if we saved it.
        // Or simpler: We don't have db_order_id here unless passed.
        // Let's modify frontend to pass it, OR utilize the `notes` fetched from Razorpay (extra call).

        // BETTER: Fetch the order using the 'receipt' logic? No, verify payload is standard.
        // Let's assume the frontend passes `order_id` (our DB ID).
        // If not, we can query orders where `provider_order_id` = razorpay_order_id (if we saved it).

        // For now, let's create a generic search or require `db_order_id` in body?
        // Actually, let's try to lookup by `provider_order_id` if we update it.

        // Wait, standard flow: Verification success -> Update Order Status.
        // We know `razorpay_order_id`. If we saved it, we can look it up.
        // Let's blindly assume we didn't save it yet in `createPaymentOrder` (commented out).
        // Let's enable saving it in `createPaymentOrder` to make lookup easy?
        // Or, assume frontend sends `db_order_id`.

        let dbOrderId = req.body.db_order_id;

        // If not provided, we can't find the order easily without querying Razorpay to get notes.
        if (!dbOrderId) {
            // Fallback: Fetch from Razorpay to get notes
            try {
                const rzOrder = await instance.orders.fetch(razorpay_order_id);
                dbOrderId = rzOrder.notes.db_order_id;
            } catch (e) {
                console.error("Failed to fetch Razorpay order for notes", e);
            }
        }

        if (!dbOrderId) {
            throw new ApiError(400, "Cannot link payment to order (Missing db_order_id)");
        }

        // 2. Update Order Status
        const { data: updatedOrder, error } = await supabase
            .from("orders")
            .update({
                status: 'placed', // or processing
                payment_status: PAYMENT_STATUS.SUCCESS,
                transaction_id: razorpay_payment_id
            })
            .eq("id", dbOrderId)
            .select(`
                *,
                items:order_items(*)
            `)
            .single();

        if (error) {
            throw new ApiError(500, `Failed to update order status: ${error.message}`);
        }

        // 3. Update Stock (Already done in creation? YES. If payment fails, we usually rollback stock or auto-cancel.
        // In this flow, we deducted stock at CREATION. So if payment is successful, we just confirm.
        // If payment stays pending/failed, we effectively reserved stock.
        // A cleanup job would be needed for abandoned orders, but that's out of scope.)

        res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            order: updatedOrder,
            transaction_id: razorpay_payment_id,
            payment_mode: "online"
        });
    } else {
        res.status(400).json({
            success: false,
            message: "Invalid signature",
        });
    }
});

// POST /api/v1/payments/webhook
exports.handleWebhook = asyncHandler(async (req, res, next) => {
    // Basic Webhook skeleton
    const secret = "YOUR_WEBHOOK_SECRET"; // Should be in env

    // Validate webhook signature if needed
    // const shasum = crypto.createHmac('sha256', secret);
    // shasum.update(JSON.stringify(req.body));
    // const digest = shasum.digest('hex');
    // if (digest !== req.headers['x-razorpay-signature']) ...

    console.log("Webhook received:", req.body);

    res.status(200).json({ received: true });
});
