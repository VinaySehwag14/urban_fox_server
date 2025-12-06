const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// GET /api/v1/categories
exports.getAllCategories = asyncHandler(async (req, res, next) => {
    const { data: categories, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        throw new ApiError(500, `Failed to fetch categories: ${error.message}`);
    }

    return res.status(200).json({
        success: true,
        count: categories.length,
        categories
    });
});

// POST /api/v1/categories/create
exports.createCategory = asyncHandler(async (req, res, next) => {
    const { name, image } = req.body;

    if (!name) {
        throw new ApiError(400, "Category name is required");
    }

    const { data: category, error } = await supabase
        .from("categories")
        .insert({ name, image })
        .select()
        .single();

    if (error) {
        if (error.code === "23505") { // Unique violation
            throw new ApiError(409, "Category with this name already exists");
        }
        throw new ApiError(500, `Failed to create category: ${error.message}`);
    }

    return res.status(201).json({
        success: true,
        message: "Category created successfully",
        category
    });
});

// PATCH /api/v1/categories/edit/:id
exports.updateCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { name, image } = req.body;

    if (!id) {
        throw new ApiError(400, "Category ID is required");
    }

    const updates = {};
    if (name) updates.name = name;
    if (image !== undefined) updates.image = image;

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const { data: category, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        if (error.code === "23505") {
            throw new ApiError(409, "Category with this name already exists");
        }
        throw new ApiError(500, `Failed to update category: ${error.message}`);
    }

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category
    });
});

// DELETE /api/v1/categories/delete/:id
exports.deleteCategory = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Category ID is required");
    }

    const { error, count } = await supabase
        .from("categories")
        .delete({ count: 'exact' })
        .eq("id", id);

    if (error) {
        throw new ApiError(500, `Failed to delete category: ${error.message}`);
    }

    if (count === 0) {
        throw new ApiError(404, "Category not found");
    }

    return res.status(200).json({
        success: true,
        message: "Category deleted successfully"
    });
});
