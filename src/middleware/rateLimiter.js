const rateLimit = require('express-rate-limit');
const config = require('../config');

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
