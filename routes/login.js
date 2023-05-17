'use strict';

import { Router } from 'express';
import kleur from 'kleur';
import passport from 'passport';
import logger from './logger.js';

const loginRoute = new Router();

loginRoute.post('/', async function (req, res, next) {
  passport.authenticate('local', async function (err, user, info) {
    req.session.username = req.body.username;
    //req.session.message = "true";
    if (err) {
      req.session.message = "error1";
      logger.error('An error1 occurred while logging in:', err);
      return res.render("login", { message: "An error occurred while logging in" });
    }
    if (!user) {
      req.session.message = "false";
      logger.error('Incorrect username or password');
      return res.render("login", { message: "Incorrect email or password" });
    }
    if (err || !user) {
      req.session.message = "errorx";
      return;
    }
    req.logIn(user, async function (err) {
      if (err) {
        req.session.message = "error2";
        logger.error('An error2 occurred while logging in:', err);
        return res.render("login", { message: "An error occurred while logging in" });
      }
      user.isOnline = true;
      await user.save();
      logger.warn('Login successful for user: ' + kleur.magenta(user.username));
      //req.session.message = "true";
      return res.redirect("secret");
    });
  })(req, res, next);
});

export default loginRoute;
