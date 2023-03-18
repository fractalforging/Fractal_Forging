const User = require("./user");

async function createAdminUser() {
    try {
        // Check if an admin user already exists
        const existingAdmin = await User.findOne({ roles: "admin" });

        // If there is no existing admin user, create a new one
        if (!existingAdmin) {
            const defaultAdmin = new User({ username: "admin", roles: "admin" });

            // Replace "yourAdminPassword" with the desired default admin password
            const adminPassword = "123";
            await User.register(defaultAdmin, adminPassword);

            console.log("1st Admin user created with > username: 'admin' and password: '" + adminPassword + "'");
        } else {
            //console.log("1st Admin user already exists. Skipping creation.");
        }
    } catch (error) {
        console.error("Error creating admin user:", error);
    }
}

module.exports = createAdminUser;
