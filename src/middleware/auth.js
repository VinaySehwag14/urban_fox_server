// src/middleware/auth.js
const admin = require("../config/firebase");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

async function verifyFirebaseToken(req, res, next) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : null;

    if (!token) {
        return next(new ApiError(401, "Missing Authorization token"));
    }

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        // decoded: { uid, email, name, picture, phone_number, ... }
        req.user = decoded;
        return next();
    } catch (err) {
        logger.error("Firebase token verification failed", err);
        return next(new ApiError(401, "Invalid or expired token"));
    }
}

module.exports = verifyFirebaseToken;
