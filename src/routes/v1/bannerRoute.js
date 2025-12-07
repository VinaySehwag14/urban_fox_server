const express = require("express");
const bannerController = require("../../controllers/bannerController");
const verifyAdmin = require("../../middleware/verifyAdmin");

const router = express.Router();

// Get all banners (Public - no authentication required)
router.get("/all", bannerController.getAllBanners);

// Add banner
router.post("/add", verifyAdmin, bannerController.addBanner);

// Edit banner
router.patch("/edit/:id", verifyAdmin, bannerController.editBanner);

// Delete banner
router.delete("/delete/:id", verifyAdmin, bannerController.deleteBanner);

module.exports = router;
