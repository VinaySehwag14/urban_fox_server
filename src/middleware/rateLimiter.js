const rateLimit = require('express-rate-limit');
const config = require('../config');

// Bypass rate limiting in development to avoid issues during testing/hot-reloading
if (config.env === 'development') {
    module.exports = (req, res, next) => next();
} else {
    /**
     * Rate limiting middleware
     * Prevents abuse by limiting requests per IP
     */
    const limiter = rateLimit({
        windowMs: config.rateLimit.windowMs,
        max: config.rateLimit.max,
        message: {
            success: false,
            error: {
                message: 'Too many requests from this IP, please try again later.',
            },
        },
        standardHeaders: true,
        legacyHeaders: false,
    });

    module.exports = limiter;
}
