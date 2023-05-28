'use strict';

import { Router } from 'express';
import User from '../models/user.js';
import logger from './logger.js'; 
import kleur from 'kleur';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';

const changeTimeRoute = Router();

changeTimeRoute.post("/", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const actionUser = req.user;
    const userId = req.body.userId;
    const user = await User.findById(userId);
    const newTime = parseInt(req.body.newTime);
    if (newTime === null || isNaN(newTime) || newTime < 0 || newTime > 35) {
      logger.error(`Invalid new break time value for ${kleur.magenta(user.username)} submited by ${kleur.magenta(actionUser.username)}`, { username: req.user.username });
      return res.status(400).json({ error: "Invalid break time value" });
    }
    req.session.message = "Time changed";
    user.remainingBreakTime = newTime * 60;
    await user.save();
    logger.warn(`Break time for ${kleur.magenta(user.username)} was changed successfully by ${kleur.magenta(actionUser.username)}`, { username: req.user.username });
    return res.status(200).json({ success: true, message: "Break time changed successfully" });
  } catch (error) {
    logger.error(error, { username: req.user.username });
    return res.status(500).json({ error: "Error changing break time: " + error.message});
  }
});

export default changeTimeRoute;