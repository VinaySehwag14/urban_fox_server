const axios = require("axios");

async function testUserCRUD() {
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
    let userId;

    console.log("\n2. Creating a test user...");
    try {
        const createRes = await axios.post(`${baseUrl}/users/create`, {
            name: "CRUD Test User",
            email: "crudtest@example.com",
            role: "customer",
            password: "password123"
        }, { headers });
        userId = createRes.data.user.id;
        console.log("User created:", userId);
    } catch (err) {
        console.error("Create failed:", err.response ? err.response.data : err.message);
        return;
    }

    console.log("\n3. Listing all users...");
    try {
        const listRes = await axios.get(`${baseUrl}/users`, { headers });
        const users = listRes.data.users;
        console.log(`Found ${users.length} users.`);
        const found = users.find(u => u.id === userId);
        console.log("New user found in list:", found ? "Yes" : "No");
    } catch (err) {
        console.error("List failed:", err.message);
    }

    console.log("\n4. Updating the user...");
    try {
        const updateRes = await axios.patch(`${baseUrl}/users/edit/${userId}`, {
            name: "Updated Name"
        }, { headers });
        console.log("Update success:", updateRes.data.user.name === "Updated Name");
    } catch (err) {
        console.error("Update failed:", err.response ? err.response.data : err.message);
    }

    console.log("\n5. Deleting the user...");
    try {
        await axios.delete(`${baseUrl}/users/delete/${userId}`, { headers });
        console.log("Delete success.");
    } catch (err) {
        console.error("Delete failed:", err.message);
    }

    console.log("\n6. Verifying deletion...");
    try {
        const listRes = await axios.get(`${baseUrl}/users`, { headers });
        const found = listRes.data.users.find(u => u.id === userId);
        console.log("User still in list:", found ? "Yes" : "No");
    } catch (err) {
        console.error("Verify delete failed:", err.message);
    }
}

testUserCRUD();
