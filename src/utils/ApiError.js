/**
 * Custom API Error class
 * Extends Error to include status code
 */
class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong") {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ApiError;
