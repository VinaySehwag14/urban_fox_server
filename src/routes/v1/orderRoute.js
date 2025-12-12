const express = require("express");
const router = express.Router();
const orderController = require("../../controllers/orderController");
const { protect, authorize } = require("../../middleware/auth"); // Assuming authorize middleware exists for admin check
const verifyAdmin = require("../../middleware/verifyAdmin");

router.post("/", protect, orderController.createOrder);
router.get("/", protect, orderController.getUserOrders);
router.get("/admin", verifyAdmin, orderController.getAllAdminOrders);
router.get("/admin/:id", verifyAdmin, orderController.getAdminOrderById);
router.get("/:id", protect, orderController.getOrderById);
router.patch("/:id/status", protect, authorize("admin"), orderController.updateOrderStatus);

module.exports = router;
