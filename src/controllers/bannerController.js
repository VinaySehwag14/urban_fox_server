const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// GET /api/v1/banners/all
exports.getAllBanners = asyncHandler(async (req, res, next) => {
    const { data: banners, error } = await supabase
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        throw new ApiError(500, `Failed to fetch banners: ${error.message}`);
    }

    return res.status(200).json({
        success: true,
        count: banners.length,
        banners
    });
});

// POST /api/v1/banners/add
exports.addBanner = asyncHandler(async (req, res, next) => {
    // Assuming generic update, allowing flexibility for fields like title, image, link etc.
    // For now we take everything from body directly.
    const bannerData = req.body;

    if (Object.keys(bannerData).length === 0) {
        throw new ApiError(400, "Banner data is required");
    }

    const { data: banner, error } = await supabase
        .from("banners")
        .insert(bannerData)
        .select()
        .single();

    if (error) {
        throw new ApiError(500, `Failed to add banner: ${error.message}`);
    }

    return res.status(201).json({
        success: true,
        message: "Banner added successfully",
        banner
    });
});

// PATCH /api/v1/banners/edit/:id
exports.editBanner = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
        throw new ApiError(400, "Banner ID is required");
    }

    if (Object.keys(updates).length === 0) {
        throw new ApiError(400, "No fields to update");
    }

    const { data: banner, error } = await supabase
        .from("banners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new ApiError(500, `Failed to update banner: ${error.message}`);
    }

    if (!banner) {
        throw new ApiError(404, "Banner not found");
    }

    return res.status(200).json({
        success: true,
        message: "Banner updated successfully",
        banner
    });
});

// DELETE /api/v1/banners/delete/:id
exports.deleteBanner = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        throw new ApiError(400, "Banner ID is required");
    }

    const { error, count } = await supabase
        .from("banners")
        .delete({ count: 'exact' })
        .eq("id", id);

    if (error) {
        throw new ApiError(500, `Failed to delete banner: ${error.message}`);
    }

    if (count === 0) {
        throw new ApiError(404, "Banner not found");
    }

    return res.status(200).json({
        success: true,
        message: "Banner deleted successfully"
    });
});
