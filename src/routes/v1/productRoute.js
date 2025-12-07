const express = require("express");
const productController = require("../../controllers/productController");
const verifyAdmin = require("../../middleware/verifyAdmin");

const router = express.Router();

// Get all products (Public - no authentication required)
router.get("/all", productController.getAllProducts);

// Get single product by slug (Public - no authentication required)
router.get("/:slug", productController.getProductBySlug);

// Add product
router.post("/add", verifyAdmin, productController.addProduct);

// Edit product
router.patch("/edit/:id", verifyAdmin, productController.editProduct);

// Delete product
router.delete("/delete/:id", verifyAdmin, productController.deleteProduct);

module.exports = router;
