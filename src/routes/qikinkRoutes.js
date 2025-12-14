const express = require('express');
const router = express.Router();
const qikinkController = require('../controllers/qikinkController');

router.post('/auth', qikinkController.authorize);

module.exports = router;
