const supabase = require("../src/config/supabase");
const bcrypt = require("bcrypt");

async function createAdminUser() {
    const email = "admin@urbanfox.com";
    const password = "adminpassword123";
    const name = "Super Admin";

    console.log(`Creating admin user: ${email}`);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data: user, error } = await supabase
            .from("admin_users")
            .upsert({
                email,
                password: hashedPassword,
                name,
                role: "admin",
                created_at: new Date().toISOString()
            }, { onConflict: "email" })
            .select()
            .single();

        if (error) {
            console.error("Failed to create admin user:", error.message);
            return;
        }

        console.log("Admin user created successfully!");
        console.log("-----------------------------------");
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log("-----------------------------------");

    } catch (err) {
        console.error("Error:", err.message);
    }
}

createAdminUser();
