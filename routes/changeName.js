'use strict';

import { Router } from 'express';
import User from '../models/user.js';
import logger from './logger.js';
import kleur from 'kleur';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';
import mongoose from 'mongoose';

const changeNameRoute = Router();

changeNameRoute.post("/", isLoggedIn, isAdmin, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const userId = req.body.userId;
    const newName = req.body.newName;

    if (newName === null) {
      logger.error("Invalid username value");
      return res.status(400).json({ error: "Invalid username value" });
    }
    req.session.message = "Name changed";

    const user = await User.findById(userId).session(session);
    user.username = newName;

    await user.save({ session });

    await session.commitTransaction();

    logger.warn(`Username change for ${kleur.magenta(user.username)} was successful`);
    return res.status(200).json({ success: true, message: "Username changed successfully" });
  } catch (error) {
    await session.abortTransaction();
    logger.error(error);
    return res.status(500).json({ error: "Username changing name: " + error.message });
  } finally {
    session.endSession();
  }
});

changeNameRoute.get("/:id", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ error: "Error getting user: " + error.message });
  }
});

export default changeNameRoute;
