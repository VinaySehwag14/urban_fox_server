const express = require("express");
const router = express.Router();
const tagController = require("../../controllers/tagController");
const { protect, authorize } = require("../../middleware/auth");

router.get("/", tagController.getAllTags);
router.post("/", protect, authorize("admin"), tagController.createTag);
router.delete("/:id", protect, authorize("admin"), tagController.deleteTag);

module.exports = router;
