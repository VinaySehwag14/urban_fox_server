// src/routes/v1/auth.js
const express = require("express");
const authController = require("../../controllers/authController");
const verifyFirebaseToken = require("../../middleware/auth");

const router = express.Router();

// Sync Firebase user into Supabase
router.post("/sync", verifyFirebaseToken, authController.syncUser);

// Get current logged-in user (from Supabase)
router.get("/me", verifyFirebaseToken, authController.getMe);

module.exports = router;
