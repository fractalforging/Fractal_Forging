'use strict';

import express from 'express';
import kleur from 'kleur';
import logger from '../routes/logger.js';
import { isLoggedIn } from '../middleware/authentication.js';

const logoutRoute = express.Router();

logoutRoute.get("/", isLoggedIn, function (req, res, next) {
  const username = req.user.username;
  req.logout(async function (err) {
    if (err) {
      logger.error(err);
    }
    if (req.user) {
      req.user.isOnline = false;
      req.user.socketId = null; 
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


export default logoutRoute;
