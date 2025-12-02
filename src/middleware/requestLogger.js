const morgan = require('morgan');
const logger = require('../utils/logger');

/**
 * Morgan middleware configuration
 * Logs HTTP requests
 */
const requestLogger = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    }
);

module.exports = requestLogger;
