const supabase = require("../src/config/supabase");
const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:3000/api/v1"; // Adjust port if needed
// We need a valid admin token or bypass auth for this test. 
// Ideally, we should login as admin. But for now, let's assume we can hit it if we have credentials or middleware allows (which it might not without token).
// If auth is strict, we need to login first. 

// Let's assume we need to login or mock the request to controller function directly if server is running?
// Actually, running a script that calls the API requires the server to be running.
// Let's check if the server is running or if we can invoke the controller logic directly (harder due to req/res mocks).

// Better approach: Test by calling the controller logic effectively or ensuring we can run a request.
// Let's Try to login first? Or assume development environment might allow bypass?
// Based on file list, there is a `server.js` and `app.js`.

// Let's try to write a script that imports the app and runs a test against it using `supertest` if installed, or just simple fetch if server is running.
// If server is not running, we should start it or use creating a unit-test style verification.

// Simplest robust way: 
// 1. Create a dummy product directly in DB.
// 2. Call the `editProduct` logic by mocking req/res? No, that's flaky.
// 3. Use `node-fetch` against the running server? We need to know if it's running.
// Let's assume we need to start it or checking `server.js`.

// Actually, I can use the `run_command` tool to start the server in background if not running?
// But I saw `nodemon.json` so user might be running it.

// Let's write a script that uses direct Supabase DB access to creates a product, then tries to call the API.
// But calling API requires authentication.

// Plan B: Write a script that mocks the request and calls the controller function directly. 
// This avoids network/auth complexity for this verification task.

const { editProduct, addProduct } = require("../src/controllers/productController");

// Mock Express req/res
const mockResponse = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

const runVerification = async () => {
    console.log("Starting Verification...");
    const timestamp = Date.now();

    // 1. Create a Product via Supabase directly or Controller
    const productName = `Test Product ${timestamp}`;
    const productSlug = `test-product-${timestamp}`;

    console.log(`Creating product: ${productName}`);

    const { data: product, error: createError } = await supabase
        .from("products")
        .insert({
            name: productName,
            slug: productSlug,
            description: "Test Description",
            mrp: 200,
            selling_price: 100,
            is_active: true
        })
        .select()
        .single();

    if (createError) {
        console.error("Failed to create test product:", createError);
        process.exit(1);
    }
    console.log("Product Created:", product.id);

    // 2. Add initial variants manually
    const { data: v1 } = await supabase.from("product_variants").insert({
        product_id: product.id,
        color: "Red",
        size: "M",
        sku_code: `test-${timestamp}-red-m`,
        stock_quantity: 10
    }).select().single();

    const { data: v2 } = await supabase.from("product_variants").insert({
        product_id: product.id,
        color: "Blue",
        size: "L",
        sku_code: `test-${timestamp}-blue-l`,
        stock_quantity: 5
    }).select().single();

    console.log("Initial Variants:", [v1.id, v2.id]);

    // 3. Prepare Update Payload
    // - Modify v1 (Update stock)
    // - Delete v2 (Omit from list)
    // - Add v3 (New variant)
    const updatePayload = {
        variants: [
            {
                id: v1.id, // Update this
                color: "Red",
                size: "M",
                stock_quantity: 50, // Changed
                selling_price: 120
            },
            {
                // New Variant (No ID)
                color: "Green",
                size: "S",
                stock_quantity: 20,
                selling_price: 90
            }
        ]
    };

    // 4. Call Controller Logic
    const req = {
        params: { id: product.id },
        body: updatePayload
    };
    const res = mockResponse();

    try {
        await editProduct(req, res, (err) => { throw err; });
        console.log("Controller executed successfully");
    } catch (err) {
        console.error("Controller failed:", err);
        process.exit(1);
    }

    // 5. Verify Database State
    const { data: finalVariants } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id);

    console.log("Final Variants Count:", finalVariants.length);

    // Check v1 updated
    const updatedV1 = finalVariants.find(v => v.id === v1.id);
    if (updatedV1.stock_quantity === 50) {
        console.log("✅ Update Verified: stock updated to 50");
    } else {
        console.error("❌ Update Failed: stock is", updatedV1.stock_quantity);
    }

    // Check v2 deleted
    const deletedV2 = finalVariants.find(v => v.id === v2.id);
    if (!deletedV2) {
        console.log("✅ Delete Verified: v2 removed");
    } else {
        console.error("❌ Delete Failed: v2 still exists");
    }

    // Check v3 added
    const addedV3 = finalVariants.find(v => v.color === "Green");
    if (addedV3) {
        console.log("✅ Add Verified: Green variant added");
    } else {
        console.error("❌ Add Failed: Green variant not found");
    }

    // Cleanup
    await supabase.from("products").delete().eq("id", product.id);
    console.log("Cleanup done.");
};

runVerification();
