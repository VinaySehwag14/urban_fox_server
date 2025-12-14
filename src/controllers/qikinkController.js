const qikinkService = require('../services/qikinkService');

const authorize = async (req, res) => {
    try {
        const tokenData = await qikinkService.getAccessToken();
        res.status(200).json({
            success: true,
            message: 'Authenticated with Qikink successfully',
            data: tokenData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    authorize
};
