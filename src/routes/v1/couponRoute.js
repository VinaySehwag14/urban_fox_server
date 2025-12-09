const express = require("express");
const router = express.Router();
const couponController = require("../../controllers/couponController");
const { protect, authorize } = require("../../middleware/auth");

router.post("/validate", couponController.validateCoupon);
router.post("/", protect, authorize("admin"), couponController.createCoupon);
router.get("/", protect, authorize("admin"), couponController.listCoupons);
router.delete("/:id", protect, authorize("admin"), couponController.deleteCoupon);
router.patch("/:id", protect, authorize("admin"), couponController.updateCoupon);

module.exports = router;
