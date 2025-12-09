/**
 * Order Status Constants
 */
const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED: 'failed'
};

/**
 * Payment Status Constants
 */
const PAYMENT_STATUS = {
    PENDING: 'pending',
    SUCCESS: 'success',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

/**
 * Coupon Type Constants
 */
const COUPON_TYPE = {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed'
};

module.exports = {
    ORDER_STATUS,
    PAYMENT_STATUS,
    COUPON_TYPE
};
