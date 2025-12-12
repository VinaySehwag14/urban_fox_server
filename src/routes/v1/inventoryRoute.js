const express = require("express");
const router = express.Router();
const inventoryController = require("../../controllers/inventoryController");
const verifyAdmin = require("../../middleware/verifyAdmin");

// Apply admin check to all routes in this file
router.use(verifyAdmin);

router.post("/update", inventoryController.updateInventory);

module.exports = router;
