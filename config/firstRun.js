'use strict';

import User from '../models/user.js';
import BreakSlots from '../models/BreakSlots.js';
import logger from '../routes/logger.js';
import kleur from 'kleur';

const createAdminUser = async () => {
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
const createDefaultBreakSlots = async () => {
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
const firstRun = async () => {
    await createAdminUser();
    await createDefaultBreakSlots();
}

export default firstRun;
