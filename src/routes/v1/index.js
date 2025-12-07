const express = require('express');
const router = express.Router();
const healthRoute = require('./healthRoute');
const itemRoute = require('./itemRoute');
const authRoute = require('./auth');
const userRoute = require('./userRoute');
const categoryRoute = require('./categoryRoute');
const bannerRoute = require('./bannerRoute');
const productRoute = require('./productRoute');

router.use('/health', healthRoute);
router.use('/items', itemRoute);
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/categories', categoryRoute);
router.use('/banners', bannerRoute);
router.use('/products', productRoute);

module.exports = router;
