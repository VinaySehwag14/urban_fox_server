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

async function testGetBySlug() {
    console.log("Testing Get Product by Slug...\n");

    // First, add a test product
    console.log("Step 1: Adding test product...");
    const productData = {
        name: "Test Product for Slug",
        images: [{ url: "https://example.com/img1.jpg", sort_order: 1 }],
        sale_price: 299,
        market_price: 599,
        color: { hex: "#FF5733", text: "Orange" },
        size: "M",
        description: "Test product",
        stock: 50,
        is_active: true
    };

    const addReq = mockReq(productData);
    const addRes = mockRes();

    try {
        await productController.addProduct(addReq, addRes, next);
        if (addRes.statusCode === 201) {
            const slug = addRes.data.product.slug;
            console.log(`✓ Product added with slug: ${slug}\n`);

            // Test: Get product by slug
            console.log("Step 2: Fetching product by slug...");
            const getReq = mockReq({}, { slug: slug });
            const getRes = mockRes();

            await productController.getProductBySlug(getReq, getRes, next);
            if (getRes.statusCode === 200) {
                console.log("✓ Product fetched successfully");
                console.log("  Product name:", getRes.data.product.name);
                console.log("  Product slug:", getRes.data.product.slug);
                console.log("  Sale price:", getRes.data.product.sale_price);
            }

            // Cleanup
            console.log("\nStep 3: Cleaning up...");
            const delReq = mockReq({}, { id: addRes.data.product.id });
            const delRes = mockRes();
            await productController.deleteProduct(delReq, delRes, next);
            console.log("✓ Test product deleted");
        }
    } catch (e) {
        console.error("Test failed:", e.message);
    }
}

testGetBySlug().catch(console.error);
