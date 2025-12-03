// src/routes/v1/userRoute.js
const express = require("express");
const userController = require("../../controllers/userController");
const verifyFirebaseToken = require("../../middleware/auth");

const router = express.Router();

// Verify if user exists in database
router.get("/verify", verifyFirebaseToken, userController.verifyUser);

module.exports = router;
