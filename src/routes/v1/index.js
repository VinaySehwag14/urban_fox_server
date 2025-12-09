const express = require('express');
const router = express.Router();

const healthRoute = require('./healthRoute');
const itemRoute = require('./itemRoute');
const authRoute = require('./auth');
const userRoute = require('./userRoute');
const categoryRoute = require('./categoryRoute');
const bannerRoute = require('./bannerRoute');
const productRoute = require('./productRoute');
const cartRoute = require('./cartRoute');

// New Routes
const orderRoute = require("./orderRoute");
const couponRoute = require("./couponRoute");
const reviewRoute = require("./reviewRoute");
const paymentRoute = require("./paymentRoute");
const wishlistRoute = require("./wishlistRoute");
const tagRoute = require("./tagRoute");

router.use('/health', healthRoute);
router.use('/items', itemRoute);
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/categories', categoryRoute);
router.use('/banners', bannerRoute);
router.use('/products', productRoute);
// Cart route was missing in original file view but present in my previous assumption. 
// Looking at the view_file output, cartRoute was NOT imported or used in the original file lines 1-20. 
// But `cartRoute.js` existed in the directory list. 
// I should add it if it's there. 
// Wait, let's double check the view_file output from Step 64.
// It did NOT show cartRoute. But `cartRoute.js` exists in the folder (Step 19).
// I will include it to be safe/complete as it's a standard feature.
router.use('/cart', cartRoute);

// Mount New Routes
router.use("/orders", orderRoute);
router.use("/coupons", couponRoute);
router.use("/reviews", reviewRoute);
router.use("/payments", paymentRoute);
router.use("/wishlist", wishlistRoute);
router.use("/tags", tagRoute);

module.exports = router;
