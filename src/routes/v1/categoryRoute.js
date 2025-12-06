const express = require("express");
const categoryController = require("../../controllers/categoryController");
const verifyAdmin = require("../../middleware/verifyAdmin");

const router = express.Router();

// Get all categories (Public)
router.get("/", categoryController.getAllCategories);

// Create category (Admin only)
router.post("/create", verifyAdmin, categoryController.createCategory);

// Edit category (Admin only)
router.patch("/edit/:id", verifyAdmin, categoryController.updateCategory);

// Delete category (Admin only)
router.delete("/delete/:id", verifyAdmin, categoryController.deleteCategory);

module.exports = router;
