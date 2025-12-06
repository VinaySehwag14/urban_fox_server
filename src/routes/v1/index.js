const express = require('express');
const router = express.Router();
const healthRoute = require('./healthRoute');
const itemRoute = require('./itemRoute');
const authRoute = require('./auth');
const userRoute = require('./userRoute');
const categoryRoute = require('./categoryRoute');

router.use('/health', healthRoute);
router.use('/items', itemRoute);
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/categories', categoryRoute);

module.exports = router;
