const axios = require("axios");

async function debugResponse() {
    const url = "http://localhost:8000/api/auth/login"; // The URL user is trying
    console.log(`Testing URL: ${url}`);

    try {
        const response = await axios.post(url, {
            email: "test@example.com",
            password: "password"
        });
        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);
        console.log("Response data:", response.data);
    } catch (err) {
        if (err.response) {
            console.log("Error status:", err.response.status);
            console.log("Error headers:", err.response.headers);
            console.log("Error data type:", typeof err.response.data);
            console.log("Error data:", err.response.data);
        } else {
            console.error("Request error:", err.message);
        }
    }
}

debugResponse();
