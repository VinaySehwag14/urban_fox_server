const axios = require("axios");

async function testCategories() {
    const adminEmail = "admin@urbanfox.com";
    const adminPassword = "adminpassword123";
    const baseUrl = "http://localhost:8000/api";

    console.log("1. Logging in as admin...");
    let token;
    try {
        const loginRes = await axios.post(`${baseUrl}/auth/login`, {
            email: adminEmail,
            password: adminPassword
        });
        token = loginRes.data.token;
        console.log("Admin logged in.");
    } catch (err) {
        console.error("Login failed:", err.message);
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    let categoryId;

    console.log("\n2. Creating a category...");
    try {
        const createRes = await axios.post(`${baseUrl}/categories/create`, {
            name: "Electronics",
            image: "https://example.com/electronics.jpg"
        }, { headers });
        categoryId = createRes.data.category.id;
        console.log("Category created:", categoryId);
    } catch (err) {
        console.error("Create failed:", err.response ? err.response.data : err.message);
        return;
    }

    console.log("\n3. Listing categories...");
    try {
        const listRes = await axios.get(`${baseUrl}/categories`);
        const categories = listRes.data.categories;
        console.log(`Found ${categories.length} categories.`);
        const found = categories.find(c => c.id === categoryId);
        console.log("New category found in list:", found ? "Yes" : "No");
    } catch (err) {
        console.error("List failed:", err.message);
    }

    console.log("\n4. Updating the category...");
    try {
        const updateRes = await axios.patch(`${baseUrl}/categories/edit/${categoryId}`, {
            name: "Gadgets"
        }, { headers });
        console.log("Update success:", updateRes.data.category.name === "Gadgets");
    } catch (err) {
        console.error("Update failed:", err.response ? err.response.data : err.message);
    }

    console.log("\n5. Deleting the category...");
    try {
        await axios.delete(`${baseUrl}/categories/delete/${categoryId}`, { headers });
        console.log("Delete success.");
    } catch (err) {
        console.error("Delete failed:", err.message);
    }

    console.log("\n6. Verifying deletion...");
    try {
        const listRes = await axios.get(`${baseUrl}/categories`);
        const found = listRes.data.categories.find(c => c.id === categoryId);
        console.log("Category still in list:", found ? "Yes" : "No");
    } catch (err) {
        console.error("Verify delete failed:", err.message);
    }
}

testCategories();
