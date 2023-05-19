'use strict';

import kleur from 'kleur';
import { Router } from 'express';
import User from '../models/user.js';
import logger from './logger.js';
import { isLoggedIn } from '../middleware/authentication.js';

const changepasswordRoute = Router();

//HANDLING PASSWORD CHANGE-
changepasswordRoute.post("/", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      req.session.message = "Error";
      logger.error("User not found");
      return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
    }

    if (!req.body.currentpassword) {
      req.session.message = "Wrong";
      logger.error("Current password empty");
      return res.render("changepassword", { error: "Current password empty!", currentUser: req.user });
    }

    if (req.body.newpassword !== req.body.confirmpassword) {
      req.session.message = "Mismatch";
      logger.error("New password and confirm password do not match");
      return res.render("changepassword", { error: "New password and confirm password do not match", currentUser: req.user });
    }

    user.authenticate(req.body.currentpassword, (err, valid) => {
      if (err || !valid) {
        req.session.message = "Wrong";
        logger.error("Current password wrong 2");
        return res.render("changepassword", { error: "Current password incorrect!", currentUser: req.user });
      }

      user.setPassword(req.body.newpassword, (err) => {
        if (err) {
          req.session.message = "Error";
          logger.error(err);
          return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
        }

        user.save((err) => {
          if (err) {
            req.session.message = "Error";
            logger.error(err);
            return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
          }

          req.logIn(user, (err) => {
            if (err) {
              req.session.message = "Error";
              logger.error(err);
              return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
            }
            
            req.session.message = "Changed";
            logger.warn("Password change for " + `${kleur.magenta(user.username)}` + " was successfull");
            return res.redirect("/secret");
          });
        });
      });
    });
  } catch (err) {
    req.session.message = "Error";
    logger.error(err);
    return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
  }
});

//HANDLING ACCOUNT
changepasswordRoute.get("/", isLoggedIn, (req, res) => {
  return res.render("changepassword", { error: 'no error', currentUser: req.user });
});

export default changepasswordRoute;
