const asyncHandler = require('../utils/asyncHandler');
const config = require('../config');

/**
 * @desc    Get server health status
 * @route   GET /api/v1/health
 * @access  Public
 */
exports.getHealth = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: 'active',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: config.env,
            version: process.version,
        },
    });
});
