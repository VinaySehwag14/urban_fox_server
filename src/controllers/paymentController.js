const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const { PAYMENT_STATUS, ORDER_STATUS } = require("../utils/types");

// POST /api/v1/payments/create-order
exports.createPaymentOrder = asyncHandler(async (req, res, next) => {
    const { amount, currency = "INR" } = req.body;

    // In a real app, integrate Razorpay SDK here
    // const razorpay = new Razorpay(...)
    // const order = await razorpay.orders.create(...)

    // Mock response
    return res.status(200).json({
        success: true,
        orderId: `order_${Date.now()}`,
        amount,
        currency
    });
});

// POST /api/v1/payments/webhook
exports.handleWebhook = asyncHandler(async (req, res, next) => {
    // Verify signature
    // Handle events: payment.captured, payment.failed

    const event = req.body;

    // Example logic
    /*
    if (event.event === 'payment.captured') {
        const paymentId = event.payload.payment.entity.id;
        const orderId = event.payload.payment.entity.notes.order_id; // Custom note passed during creation
        
        // Update order status
        await supabase.from("orders").update({ status: ORDER_STATUS.PROCESSING }).eq("id", orderId);
        // Record payment
        await supabase.from("payments").insert({...});
    }
    */

    return res.status(200).json({ received: true });
});
