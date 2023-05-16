'use strict';

import express from 'express';
import kleur from 'kleur';
import logger from '../routes/logger.js';
import { isLoggedIn } from '../middleware/authentication.js';

const router = express.Router();

// HANDLING USER LOGOUT
router.get("/", isLoggedIn, function (req, res, next) {
  const username = req.user.username;
  req.logout(async function (err) {
    if (err) {
      logger.error(err);
    }
    if (req.user) { // Check if the req.user object is not null
      req.user.isOnline = false;
      req.user.socketId = null; // Add this line
      await req.user.save();
    }
    logger.warn('Logout successful for user: ' + kleur.magenta(username));
    req.session.destroy(function (err) {
      if (err) {
        logger.error(err);
      }
      return res.redirect("/");
    });
  });
});


export default router;
