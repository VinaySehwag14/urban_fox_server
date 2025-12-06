const supabase = require("../src/config/supabase");
const bcrypt = require("bcrypt");

async function testAdminLogin() {
    const email = "testadmin@example.com";
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("1. Creating test admin user...");
    // Clean up first just in case
    await supabase.from("admin_users").delete().eq("email", email);

    const { data: user, error } = await supabase
        .from("admin_users")
        .insert({
            email,
            password: hashedPassword,
            name: "Test Admin",
            role: "admin"
        })
        .select()
        .single();

    if (error) {
        console.error("Failed to create admin user:", error.message);
        return;
    }
    console.log("User created:", user.id);

    console.log("2. Testing login endpoint...");
    try {
        const response = await fetch("http://localhost:8000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            console.log("Login successful!");
            console.log("Token:", data.token ? "Received" : "Missing");
            console.log("User:", data.user);
        } else {
            console.error("Login failed:", data);
        }
    } catch (err) {
        console.error("Request failed:", err.message);
    }

    console.log("3. Cleaning up...");
    await supabase.from("admin_users").delete().eq("email", email);
    console.log("Done.");
}

testAdminLogin();
