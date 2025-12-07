const productController = require('../src/controllers/productController');
const supabase = require('../src/config/supabase');
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

// Logging helper
function log(msg) {
    console.log(msg);
    fs.appendFileSync('run_products_log.txt', msg + '\n');
}

const next = (err) => {
    log("DEBUG: Next function called");
    if (err) {
        log("DEBUG: Error caught!");
        log("DEBUG MESSAGE: " + err.message);
        log("DEBUG DETAILS: " + JSON.stringify(err, null, 2));
    }
};

async function testProducts() {
    // Clear log file
    fs.writeFileSync('run_products_log.txt', 'Starting Product Test\n');
    log("Starting Product API Tests...");

    // Test 1: Add Product
    log("\nTesting Add Product...");
    const productData = {
        name: "Test T-Shirt",
        images: [{ url: "http://example.com/img1.jpg", sort_order: 1 }],
        sale_price: 999,
        market_price: 1499,
        color: { hex: "#FF0000", text: "Red" },
        size: "L",
        description: "<p>Best T-Shirt</p>",
        stock: 100,
        is_active: true
        // category_id: skipping as we might not have a valid id handy without fetching
    };

    const addReq = mockReq(productData);
    const addRes = mockRes();

    log("Calling addProduct...");
    try {
        await productController.addProduct(addReq, addRes, next);
    } catch (e) {
        log("Caught unexpected exception in addProduct: " + e.message);
    }

    if (addRes.statusCode === 201) {
        log("Add Product: SUCCESS " + JSON.stringify(addRes.data));
    } else {
        log("Add Product: FAILED StatusCode=" + addRes.statusCode);
    }

    let productId;
    if (addRes.data && addRes.data.product) {
        productId = addRes.data.product.id;
    }

    if (!productId) {
        log("Skipping further tests as product creation failed.");
        return;
    }

    // Test 2: Get All Products
    log("\nTesting Get All Products...");
    const getReq = mockReq();
    const getRes = mockRes();
    await productController.getAllProducts(getReq, getRes, next);

    if (getRes.statusCode === 200) {
        log("Get All Products: SUCCESS Count=" + getRes.data.count);
    } else {
        log("Get All Products: FAILED StatusCode=" + getRes.statusCode);
    }

    // Test 3: Edit Product
    log("\nTesting Edit Product...");
    const editReq = mockReq({ name: "Updated T-Shirt Name", stock: 90 }, { id: productId });
    const editRes = mockRes();
    await productController.editProduct(editReq, editRes, next);

    if (editRes.statusCode === 200) {
        log("Edit Product: SUCCESS " + JSON.stringify(editRes.data));
    } else {
        log("Edit Product: FAILED StatusCode=" + editRes.statusCode);
    }

    // Test 4: Delete Product
    log("\nTesting Delete Product...");
    const delReq = mockReq({}, { id: productId });
    const delRes = mockRes();
    await productController.deleteProduct(delReq, delRes, next);

    if (delRes.statusCode === 200) {
        log("Delete Product: SUCCESS " + JSON.stringify(delRes.data));
    } else {
        log("Delete Product: FAILED StatusCode=" + delRes.statusCode);
    }
}

testProducts().catch(err => {
    console.error(err);
    fs.appendFileSync('run_products_log.txt', 'Top level error: ' + err.message + '\n');
});
