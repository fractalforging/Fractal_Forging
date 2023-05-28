'use strict';

import express from 'express';
import User from '../models/user.js';
import { isLoggedIn } from '../middleware/authentication.js';
import logger from '../routes/logger.js';
import kleur from 'kleur';
import mongoose from 'mongoose';

const logoutRoute = express.Router();

logoutRoute.get("/", isLoggedIn, async (req, res, next) => {
  const session = await mongoose.startSession();

  // Get the username before calling req.logout()
  const username = req.user.username;

  req.logout(async function (err) {
    if (err) {
      logger.error(err, { username: username });
    }
    if (req.user) {
      req.user.isOnline = false;
      req.user.socketId = null; 
      await req.user.save();
    }
    logger.warn(`Logout successful for user: ${kleur.magenta(username)}`, { username: username });
    req.session.destroy((err) => {
      if (err) {
        logger.error(err, { username: username });
      }
      return res.redirect("/");
    });
  });
});

export default logoutRoute;
