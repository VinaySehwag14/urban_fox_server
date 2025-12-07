const express = require('express');
const router = express.Router();
const healthRoute = require('./healthRoute');
const itemRoute = require('./itemRoute');
const authRoute = require('./auth');
const userRoute = require('./userRoute');
const categoryRoute = require('./categoryRoute');
const productRoute = require('./productRoute');
const cartRoute = require('./cartRoute');

router.use('/health', healthRoute);
router.use('/items', itemRoute);
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/categories', categoryRoute);
router.use('/products', productRoute);
router.use('/cart', cartRoute);

module.exports = router;
