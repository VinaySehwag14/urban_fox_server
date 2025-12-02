const itemService = require('../services/itemService');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

/**
 * @desc    Get all items
 * @route   GET /api/v1/items
 * @access  Public
 */
exports.getItems = asyncHandler(async (req, res) => {
    const items = await itemService.getAllItems();
    res.status(200).json({
        success: true,
        count: items.length,
        data: items,
    });
});

/**
 * @desc    Get item by ID
 * @route   GET /api/v1/items/:id
 * @access  Public
 */
exports.getItem = asyncHandler(async (req, res) => {
    try {
        const item = await itemService.getItemById(req.params.id);
        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (error) {
        throw new ApiError('Item not found', 404);
    }
});

/**
 * @desc    Create new item
 * @route   POST /api/v1/items
 * @access  Public
 */
exports.createItem = asyncHandler(async (req, res) => {
    if (!req.body.name) {
        throw new ApiError('Please provide a name for the item', 400);
    }

    const newItem = await itemService.createItem(req.body);
    res.status(201).json({
        success: true,
        data: newItem,
    });
});
