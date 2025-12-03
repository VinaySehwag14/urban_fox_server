// src/controllers/userController.js
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// GET /api/v1/users/verify
exports.verifyUser = asyncHandler(async (req, res, next) => {
    const { uid } = req.user || {};

    if (!uid) {
        throw new ApiError(401, "Unauthorized");
    }

    const { data: user, error } = await supabase
        .from("users")
        .select("id, firebase_uid, email")
        .eq("firebase_uid", uid)
        .single();

    if (error || !user) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: "User exists",
        user,
    });
});
