// src/controllers/userController.js
const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcrypt");

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

// POST /api/v1/users
exports.createUser = asyncHandler(async (req, res, next) => {
    const { name, email, role = "customer", password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    if (!["admin", "customer"].includes(role)) {
        throw new ApiError(400, "Invalid role. Must be 'admin' or 'customer'");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let newUser;
    let error;

    if (role === "admin") {
        const { data, error: dbError } = await supabase
            .from("admin_users")
            .insert({
                email,
                password: hashedPassword,
                name,
                role: "admin"
            })
            .select()
            .single();
        newUser = data;
        error = dbError;
    } else {
        // Customer
        const { data, error: dbError } = await supabase
            .from("users")
            .insert({
                email,
                password: hashedPassword,
                name,
                role: "customer",
                // firebase_uid is null for password-based users
            })
            .select()
            .single();
        newUser = data;
        error = dbError;
    }

    if (error) {
        if (error.code === "23505") { // Unique violation
            throw new ApiError(409, "User with this email already exists");
        }
        throw new ApiError(500, `Failed to create user: ${error.message}`);
    }

    return res.status(201).json({
        success: true,
        message: "User created successfully",
        user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role
        }
    });
});

// GET /api/v1/users
exports.getAllUsers = asyncHandler(async (req, res, next) => {
    // Fetch customers
    const { data: customers, error: customersError } = await supabase
        .from("users")
        .select("id, email, name, role, created_at");

    if (customersError) {
        throw new ApiError(500, `Failed to fetch customers: ${customersError.message}`);
    }

    // Fetch admins
    const { data: admins, error: adminsError } = await supabase
        .from("admin_users")
        .select("id, email, name, role, created_at");

    if (adminsError) {
        throw new ApiError(500, `Failed to fetch admins: ${adminsError.message}`);
    }

    // Combine lists
    const allUsers = [...(admins || []), ...(customers || [])];

    // Sort by created_at desc
    allUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.status(200).json({
        success: true,
        count: allUsers.length,
        users: allUsers
    });
});

// PATCH /api/v1/users/edit/:id
exports.updateUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    if (!id) {
        throw new ApiError(400, "User ID is required");
    }

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (password) {
        updates.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    // Try updating in users table (customer) first
    let { data: user, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    // If not found in users, try admin_users
    if (!user) {
        const { data: adminUser, error: adminError } = await supabase
            .from("admin_users")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        user = adminUser;
        error = adminError;
    }

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (error) {
        throw new ApiError(500, `Failed to update user: ${error.message}`);
    }

    return res.status(200).json({
        success: true,
        message: "User updated successfully",
        user
    });
});

// DELETE /api/v1/users/delete/:id
exports.deleteUser = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "User ID is required");
    }

    // Try deleting from users table
    const { error: userError, count: userCount } = await supabase
        .from("users")
        .delete({ count: 'exact' })
        .eq("id", id);

    let deleted = userCount > 0;

    // If not deleted from users, try admin_users
    if (!deleted) {
        const { error: adminError, count: adminCount } = await supabase
            .from("admin_users")
            .delete({ count: 'exact' })
            .eq("id", id);

        deleted = adminCount > 0;
    }

    if (!deleted) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json({
        success: true,
        message: "User deleted successfully"
    });
});
