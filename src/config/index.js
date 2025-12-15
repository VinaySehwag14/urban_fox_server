require('dotenv').config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',

    // CORS configuration
    cors: {
        origin: (origin, callback) => {
            const allowedOrigins = process.env.CORS_ORIGIN
                ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
                : ['*'];

            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin || allowedOrigins.includes('*')) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
    },

    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    },

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',

    // Razorpay
    razorpay: {
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    },

    // Add more configuration as needed
    // database: {
    //   url: process.env.DATABASE_URL,
    // },
    // jwt: {
    //   secret: process.env.JWT_SECRET,
    //   expire: process.env.JWT_EXPIRE || '7d',
    // },
};

module.exports = config;
