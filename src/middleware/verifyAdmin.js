const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const verifyAdmin = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
        throw new ApiError(401, "Missing Authorization token");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_change_me");

        if (decoded.role !== 'admin') {
            throw new ApiError(403, "Access denied. Admins only.");
        }

        // Verify user still exists in DB and is admin
        const { data: user, error } = await supabase
            .from("admin_users")
            .select("id, email, role")
            .eq("id", decoded.id)
            .single();

        if (error || !user) {
            throw new ApiError(401, "Invalid token or user no longer exists");
        }

        req.user = user; // Attach admin user to request
        next();
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw new ApiError(401, "Invalid or expired token");
    }
});

module.exports = verifyAdmin;
