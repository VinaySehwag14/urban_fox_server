// src/controllers/authController.js
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

// POST /api/v1/auth/register
exports.register = asyncHandler(async (req, res, next) => {
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

    // Check if user already exists
    const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("firebase_uid", uid)
        .single();

    if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
    }

    const { data: user, error } = await supabase
        .from("users")
        .insert({
            firebase_uid: uid,
            email,
            name: displayName || name || null,
            avatar_url: photoURL || picture || null,
            phone_number: phone_number || null,
            last_login_at: now,
        })
        .select()
        .single();

    if (error) {
        throw new ApiError(500, `Failed to register user: ${error.message}`);
    }

    return res.status(201).json({
        message: "User registered successfully",
        user,
    });
});

// POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    // Check if user exists in admin_users table
    const { data: user, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("email", email)
        .single();

    if (error || !user) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError(401, "Invalid email or password");
    }

    // Generate JWT
    const token = jwt.sign(
        { id: user.id, email: user.email, role: "admin" },
        process.env.JWT_SECRET || "default_secret_change_me",
        { expiresIn: "1d" }
    );

    // Update last login
    await supabase
        .from("admin_users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id);

    return res.status(200).json({
        message: "Login successful",
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
        },
    });
});
