const express = require("express");
const router = express.Router();
const reviewController = require("../../controllers/reviewController");
const { protect } = require("../../middleware/auth");

router.post("/", protect, reviewController.addReview);
router.get("/product/:productId", reviewController.getProductReviews);
router.delete("/:id", protect, reviewController.deleteReview);

module.exports = router;
