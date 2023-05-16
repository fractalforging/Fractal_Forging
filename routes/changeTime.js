import express from 'express';
import { Router } from 'express';
import User from '../models/user.js';
import logger from './logger.js';
import kleur from 'kleur';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';

const router = Router();

router.post("/", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const userId = req.body.userId;
    const newTime = parseInt(req.body.newTime);

    if (newTime === null || isNaN(newTime) || newTime < 0 || newTime > 35) {
      logger.error("Invalid break time value");
      return res.status(400).json({ error: "Invalid break time value" });
    }

    const user = await User.findById(userId);
    user.remainingBreakTime = newTime * 60;

    await user.save();

    logger.warn(`Break time change for ${kleur.magenta(user.username)} was successful`);
    return res.status(200).json({ success: true, message: "Break time changed successfully" });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: "Error changing break time: " + error.message });
  }
});

export default router;




