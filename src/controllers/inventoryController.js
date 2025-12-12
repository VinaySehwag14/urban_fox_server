const supabase = require("../config/supabase");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// POST /api/inventory/update
// Secure: Admin only
exports.updateInventory = asyncHandler(async (req, res, next) => {
    const { productId, variantId, stock } = req.body;

    if (!variantId || stock === undefined) {
        throw new ApiError(400, "Variant ID and stock quantity are required");
    }

    // Optional: Validate product ID matches variant if provided? 
    // It's a good integrity check but not strictly necessary if variantId is unique.
    // Let's do a simple check if productId is given.

    if (productId) {
        const { data: variantCheck, error: checkError } = await supabase
            .from("product_variants")
            .select("product_id")
            .eq("id", variantId)
            .single();

        if (checkError || !variantCheck) {
            throw new ApiError(404, "Variant not found");
        }

        // Ensure productId matches (assuming productId is int or string that matches)
        // Convert both to string for safe comparison
        if (String(variantCheck.product_id) !== String(productId)) {
            throw new ApiError(400, "Variant does not belong to the specified Product ID");
        }
    }

    // Update stock
    const { data: updatedVariant, error } = await supabase
        .from("product_variants")
        .update({ stock_quantity: stock })
        .eq("id", variantId)
        .select()
        .single();

    if (error) {
        throw new ApiError(500, `Failed to update inventory: ${error.message}`);
    }

    if (!updatedVariant) {
        throw new ApiError(404, "Variant not found");
    }

    return res.status(200).json({
        success: true,
        message: "Inventory updated successfully",
        variant: updatedVariant
    });
});
