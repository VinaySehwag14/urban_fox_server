// src/config/firebase.js
const admin = require("firebase-admin");
const path = require("path");

let serviceAccount;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // If the environment variable is present (e.g. in Vercel), use it.
        // The value should be the stringified JSON content of the service account file.
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } else {
        // Fallback to local file for development
        const serviceAccountPath = path.join(__dirname, "..", "..", "serviceAccountKey.json");
        serviceAccount = require(serviceAccountPath);
    }
} catch (error) {
    console.error("Failed to load Firebase credentials:", error);
    // You might want to throw here if credentials are critical, OR let it fail downstream
    // depending on preference. For now, logging the error is helpful.
}

if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

module.exports = admin;
