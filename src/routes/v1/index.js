const express = require('express');
const router = express.Router();
const healthRoute = require('./healthRoute');
const itemRoute = require('./itemRoute');
const authRoute = require('./auth');
const userRoute = require('./userRoute');
const categoryRoute = require('./categoryRoute');
<<<<<<< HEAD
const bannerRoute = require('./bannerRoute');
const productRoute = require('./productRoute');
=======
const productRoute = require('./productRoute');
const cartRoute = require('./cartRoute');
>>>>>>> 672ad7a08fa3fe83984c0481ac497906c2e4b238

router.use('/health', healthRoute);
router.use('/items', itemRoute);
router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/categories', categoryRoute);
<<<<<<< HEAD
router.use('/banners', bannerRoute);
router.use('/products', productRoute);
=======
router.use('/products', productRoute);
router.use('/cart', cartRoute);
>>>>>>> 672ad7a08fa3fe83984c0481ac497906c2e4b238

module.exports = router;
