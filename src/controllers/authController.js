// src/controllers/authController.js
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// POST /api/v1/auth/sync
exports.syncUser = asyncHandler(async (req, res, next) => {
    const {
        uid,          // Firebase UID
        email,
        name,
        picture,
        phone_number,
    } = req.user || {};

    if (!uid || !email) {
        throw new ApiError(400, "Missing uid or email in Firebase token");
    }

    // Optional overrides from frontend body
    const { displayName, photoURL } = req.body || {};

    const now = new Date().toISOString();

    const { data: user, error } = await supabase
        .from("users")
        .upsert(
            {
                firebase_uid: uid,
                email,
                name: displayName || name || null,
                avatar_url: photoURL || picture || null,
                phone_number: phone_number || null,
                last_login_at: now,
            },
            { onConflict: "firebase_uid" }
        )
        .select()
        .single();

    if (error) {
        throw new ApiError(500, `Failed to sync user: ${error.message}`);
    }

    return res.status(200).json({
        message: "User synced successfully",
        user,
    });
});

// GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res, next) => {
    const { uid } = req.user || {};

    if (!uid) {
        throw new ApiError(401, "Unauthorized");
    }

    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("firebase_uid", uid)
        .single();

    if (error) {
        throw new ApiError(500, `Failed to fetch user: ${error.message}`);
    }

    return res.status(200).json({ user });
});
