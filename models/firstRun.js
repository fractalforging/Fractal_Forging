const User = require("./user");
const BreakSlots = require('./BreakSlots');
const logger = require('../serverjs/logger.js');
const kleur = require('kleur');

async function createAdminUser() {
    try {
        // Check if an admin user already exists
        const existingAdmin = await User.findOne({ roles: "admin" });

        // If there is no existing admin user, create a new one
        if (!existingAdmin) {
            const defaultAdmin = new User({ username: "admin", roles: "admin" });

            // Replace "yourAdminPassword" with the desired default admin password
            const adminPassword = process.env.ADMIN_PASS;
            await User.register(defaultAdmin, adminPassword);

            logger.info("1st Admin user created with > username: " + kleur.magenta("admin") + " and password: " + kleur.grey("xxx") + "(hidden), check .env variable");
        } else {
            //console.log("1st Admin user already exists. Skipping creation.");
        }
    } catch (error) {
        logger.error("Error creating admin user:", error);
    }
}

async function createDefaultBreakSlots() {
    try {
        // Check if a BreakSlots document already exists
        const existingBreakSlots = await BreakSlots.findOne();

        // If there is no existing BreakSlots document, create a new one
        if (!existingBreakSlots) {
            const defaultBreakSlots = new BreakSlots({ slots: 2 });
            await defaultBreakSlots.save();

            logger.info("Default BreakSlots document created with slots: " + kleur.magenta("2"));
        } else {
            //console.log("Default BreakSlots document already exists. Skipping creation.");
        }
    } catch (error) {
        logger.error("Error creating default BreakSlots document:", error);
    }
}

async function firstRun() {
    await createAdminUser();
    await createDefaultBreakSlots();
}

module.exports = firstRun;
