const axios = require("axios");

async function testCreateUser() {
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
        console.log("Admin logged in. Token received.");
    } catch (err) {
        console.error("Admin login failed:", err.response ? err.response.data : err.message);
        return;
    }

    console.log("\n2. Creating a new customer...");
    const newCustomer = {
        name: "Jatin Singh",
        email: "jsgautam697@gmail.com",
        role: "customer",
        password: "password123"
    };

    try {
        const createRes = await axios.post(`${baseUrl}/users`, newCustomer, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Customer created successfully!");
        console.log("User:", createRes.data.user);
    } catch (err) {
        console.error("Create customer failed:", err.response ? err.response.data : err.message);
    }

    console.log("\n3. Creating a new admin...");
    const newAdmin = {
        name: "New Admin",
        email: "newadmin@urbanfox.com",
        role: "admin",
        password: "adminpassword456"
    };

    try {
        const createRes = await axios.post(`${baseUrl}/users`, newAdmin, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Admin created successfully!");
        console.log("User:", createRes.data.user);
    } catch (err) {
        console.error("Create admin failed:", err.response ? err.response.data : err.message);
    }
}

testCreateUser();
