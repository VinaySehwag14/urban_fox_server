// src/routes/v1/auth.js
const express = require("express");
const authController = require("../../controllers/authController");
const { protect, optionalProtect } = require("../../middleware/auth");

const router = express.Router();

// Sync Firebase user into Supabase
router.post("/sync", protect, authController.syncUser);

// Register new user
router.post("/register", optionalProtect, authController.register);

// Admin login
router.post("/login", authController.login);

// Get current logged-in user (from Supabase)
router.get("/me", protect, authController.getMe);

module.exports = router;
