const productController = require('../src/controllers/productController');
const fs = require('fs');

// Mock request and response objects
const mockReq = (body = {}, params = {}) => ({
    body,
    params
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

const next = (err) => {
    if (err) {
        console.error("Error:", err.message);
    }
};

async function testSlug() {
    console.log("Testing Product Slug Generation...\n");

    // Test 1: Add Product with slug auto-generation
    console.log("Test 1: Adding product 'Supima T-Shirt'...");
    const productData = {
        name: "Supima T-Shirt",
        images: [{ url: "https://example.com/img1.jpg", sort_order: 1 }],
        sale_price: 120,
        market_price: 500,
        color: { hex: "#000000", text: "Black" },
        size: "S",
        description: "Description",
        stock: 1000,
        is_active: true
    };

    const addReq = mockReq(productData);
    const addRes = mockRes();

    try {
        await productController.addProduct(addReq, addRes, next);
        if (addRes.statusCode === 201) {
            console.log("✓ Product added successfully");
            console.log("  Generated slug:", addRes.data.product.slug);
            console.log("  Expected: 'supima-t-shirt'");

            const productId = addRes.data.product.id;

            // Test 2: Update product name and verify slug regeneration
            console.log("\nTest 2: Updating product name to 'Premium Cotton Shirt'...");
            const editReq = mockReq({ name: "Premium Cotton Shirt" }, { id: productId });
            const editRes = mockRes();

            await productController.editProduct(editReq, editRes, next);
            if (editRes.statusCode === 200) {
                console.log("✓ Product updated successfully");
                console.log("  New slug:", editRes.data.product.slug);
                console.log("  Expected: 'premium-cotton-shirt'");
            }

            // Cleanup
            console.log("\nCleaning up test product...");
            const delReq = mockReq({}, { id: productId });
            const delRes = mockRes();
            await productController.deleteProduct(delReq, delRes, next);
            console.log("✓ Test product deleted");
        }
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

testSlug().catch(console.error);
