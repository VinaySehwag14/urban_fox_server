// src/routes/v1/userRoute.js
const express = require("express");
const userController = require("../../controllers/userController");
const { protect } = require("../../middleware/auth");
const verifyAdmin = require("../../middleware/verifyAdmin");

const router = express.Router();

// Verify if user exists in database
router.get("/verify", protect, userController.verifyUser);

// Create new user (Admin only)
router.post("/", verifyAdmin, userController.createUser);
router.post("/create", verifyAdmin, userController.createUser); // Alias

// Get all users (Admin only)
router.get("/", verifyAdmin, userController.getAllUsers);

// Edit user (Admin only)
router.patch("/edit/:id", verifyAdmin, userController.updateUser);

// Delete user (Admin only)
router.delete("/delete/:id", verifyAdmin, userController.deleteUser);

module.exports = router;
