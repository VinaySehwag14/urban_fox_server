const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/cartController');
const { protect } = require('../../middleware/auth');

// All cart routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: Get user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's cart with items
 */
router.get('/', cartController.getCart);

/**
 * @swagger
 * /api/v1/cart:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - variant_id
 *             properties:
 *               variant_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item added to cart
 */
router.post('/', cartController.addToCart);

/**
 * @swagger
 * /api/v1/cart/{itemId}:
 *   patch:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cart updated
 */
router.patch('/:itemId', cartController.updateCartItem);

/**
 * @swagger
 * /api/v1/cart/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item removed
 */
router.delete('/:itemId', cartController.removeFromCart);

/**
 * @swagger
 * /api/v1/cart:
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */
router.delete('/', cartController.clearCart);

module.exports = router;
