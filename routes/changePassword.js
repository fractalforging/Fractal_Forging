'use strict';

import kleur from 'kleur';
import { Router } from 'express';
import User from '../models/user.js';
import logger from './logger.js';
import { isLoggedIn } from '../middleware/authentication.js';

const changepasswordRoute = Router();

changepasswordRoute.post("/", isLoggedIn, async (req, res, next) => {
  const userId = req.body.userId;
  const user = await User.findById(userId);

  User.findOne({ username: req.user.username }, (err, user) => {
    if (err || !user) {
      req.session.message = "Error";
      logger.error(err || `Error changing password for ${kleur.magenta(user.username)}: User not found`, { username: req.user.username });
      return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
    }

    if (!req.body.currentpassword) {
      req.session.message = "Current password empty";
      logger.error(`Error changing password for ${kleur.magenta(user.username)}: Current password empty`, { username: req.user.username });
      return res.render("changepassword", { error: "Current password empty!", currentUser: req.user });
    }

    user.authenticate(req.body.currentpassword, (err, valid) => {
      if (err || !valid) {
        req.session.message = "Current password wrong";
        logger.error(`Error changing password for ${kleur.magenta(user.username)}: Current password wrong`, { username: req.user.username });
        return res.render("changepassword", { error: "Current password incorrect!", currentUser: req.user });
      }

      if (!req.body.newpassword) {
        req.session.message = "New password empty";
        logger.error(`Error changing password for ${kleur.magenta(user.username)}: New password empty`, { username: req.user.username });
        return res.render("changepassword", { error: "New password empty", currentUser: req.user });
      }

      if (!req.body.confirmpassword) {
        req.session.message = "Confirm password empty";
        logger.error(`Error changing password for ${kleur.magenta(user.username)}: Confirm password empty`, { username: req.user.username });
        return res.render("changepassword", { error: "Confirm password empty", currentUser: req.user });
      }

      if (req.body.newpassword !== req.body.confirmpassword) {
        req.session.message = "Mismatch";
        logger.error(`Error changing password for ${kleur.magenta(user.username)}: New password and confirm password do not match`, { username: req.user.username });
        return res.render("changepassword", { error: "New password and confirm password do not match", currentUser: req.user });
      }

      user.setPassword(req.body.newpassword, (err) => {
        if (err) {
          req.session.message = "Error";
          logger.error(err, { username: req.user.username });
          return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
        }

        user.save((err) => {
          if (err) {
            req.session.message = "Error";
            logger.error(err, { username: req.user.username });
            return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
          }

          req.logIn(user, (err) => {
            if (err) {
              req.session.message = "Error";
              logger.error(err, { username: req.user.username });
              return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
            }

            req.session.message = "Changed";
            logger.warn(`${kleur.magenta(user.username)} changed password successfully`, { username: req.user.username });
            return res.redirect("/secret");
          });
        });
      });
    });
  });
});

//HANDLING ACCOUNT
changepasswordRoute.get("/", isLoggedIn, (req, res, next) => {
  return res.render("changepassword", { error: 'no error', currentUser: req.user });
});


export default changepasswordRoute;
