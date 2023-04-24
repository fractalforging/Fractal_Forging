const User = require("./user");
const BreakSlots = require('./BreakSlots');
const logger = require('../routes/logger.js');
const kleur = require('kleur');

async function createAdminUser() {
    try {
        const existingAdmin = await User.findOne({ roles: "admin" });
        if (!existingAdmin) {
            const defaultAdmin = new User({ username: "admin", roles: "admin" });
            const adminPassword = process.env.ADMIN_PASS;
            await User.register(defaultAdmin, adminPassword);
            logger.info("1st Admin user created with > username: " + kleur.magenta("admin") + " and password: " + kleur.grey("xxx") + "(hidden), check .env variable");
        } else {
        }
    } catch (error) {
        logger.error("Error creating admin user:", error);
    }
}
async function createDefaultBreakSlots() {
    try {
        const existingBreakSlots = await BreakSlots.findOne();
        if (!existingBreakSlots) {
            const defaultBreakSlots = new BreakSlots({ slots: 2 });
            await defaultBreakSlots.save();
            logger.info("Default BreakSlots document created with slots: " + kleur.magenta("2"));
        } else {
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
