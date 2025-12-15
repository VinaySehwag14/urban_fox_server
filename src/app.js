const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const requestLogger = require('./middleware/requestLogger');
const rateLimiter = require('./middleware/rateLimiter');
const routes = require('./routes/v1');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const app = express();

/**
 * ===============================
 * SECURITY & CORE MIDDLEWARE
 * ===============================
 */
app.use(helmet());

/**
 * ===============================
 * CORS (FINAL FIX)
 * ===============================
 */
app.use(
    cors({
        origin: (origin, callback) => {
            const allowedOrigins = process.env.CORS_ORIGIN
                ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
                : [];

            // Allow non-browser requests (Postman, curl, server-side)
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`CORS blocked for origin: ${origin}`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

/**
 * ✅ REQUIRED FOR PREFLIGHT REQUESTS
 */
app.options('*', cors());

app.use(rateLimiter);

/**
 * ===============================
 * DOCUMENTATION
 * ===============================
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

/**
 * ===============================
 * GENERAL MIDDLEWARE
 * ===============================
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(requestLogger);

/**
 * ===============================
 * ROUTES
 * ===============================
 */
app.use('/api/v1', routes);
app.use('/api', routes); // non-versioned support

/**
 * ===============================
 * ROOT & HEALTH
 * ===============================
 */
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hello! Welcome to Urban Fox API 🦊',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            documentation: '/api-docs',
            api: '/api/v1',
        },
        timestamp: new Date().toISOString(),
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        env: config.env,
    });
});

/**
 * ===============================
 * ERROR HANDLING
 * ===============================
 */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
