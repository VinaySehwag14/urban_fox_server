require('dotenv').config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',

    // CORS configuration
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
    },

    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',

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
