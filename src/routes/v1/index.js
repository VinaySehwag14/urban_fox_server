const express = require('express');
const router = express.Router();
const healthRoute = require('./healthRoute');
const itemRoute = require('./itemRoute');

router.use('/health', healthRoute);
router.use('/items', itemRoute);

module.exports = router;
