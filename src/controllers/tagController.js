const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// GET /api/v1/tags
exports.getAllTags = asyncHandler(async (req, res, next) => {
    const { data: tags, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");

    if (error) throw new ApiError(500, `Failed to fetch tags: ${error.message}`);

    return res.status(200).json({
        success: true,
        tags
    });
});

// POST /api/v1/tags (Admin)
exports.createTag = asyncHandler(async (req, res, next) => {
    const { name } = req.body;

    if (!name) throw new ApiError(400, "Tag name is required");

    const { data: tag, error } = await supabase
        .from("tags")
        .insert({ name })
        .select()
        .single();

    if (error) throw new ApiError(500, `Failed to create tag: ${error.message}`);

    return res.status(201).json({
        success: true,
        tag
    });
});

// DELETE /api/v1/tags/:id (Admin)
exports.deleteTag = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw new ApiError(500, `Failed to delete tag: ${error.message}`);
    return res.status(200).json({ success: true, message: "Tag deleted" });
});
