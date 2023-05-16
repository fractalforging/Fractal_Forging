import express from 'express';
import kleur from 'kleur';
import { Router } from 'express';
import User from '../models/user.js';
import logger from '../routes/logger.js';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';

const router = Router();

//HANDLING PASSWORD CHANGE
router.post("/", isLoggedIn, function (req, res, next) {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err || !user) {
      req.session.message = "Error";
      logger.error(err || "User not found");
      return res.render("account", { error: "Error, please try again", currentUser: req.user });
    }

    if (!req.body.currentpassword) {
      req.session.message = "Wrong";
      logger.error("Current password empty");
      return res.render("account", { error: "Current password empty!", currentUser: req.user });
    }

    if (req.body.newpassword !== req.body.confirmpassword) {
      req.session.message = "Mismatch";
      logger.error("New password and confirm password do not match");
      return res.render("account", { error: "New password and confirm password do not match", currentUser: req.user });
    }

    user.authenticate(req.body.currentpassword, (err, valid) => {
      if (err || !valid) {
        req.session.message = "Wrong";
        logger.error("Current password wrong 2");
        return res.render("account", { error: "Current password incorrect!", currentUser: req.user });
      }

      user.setPassword(req.body.newpassword, (err) => {
        if (err) {
          req.session.message = "Error";
          logger.error(err);
          return res.render("account", { error: "Error, please try again", currentUser: req.user });
        }

        user.save((err) => {
          if (err) {
            req.session.message = "Error";
            logger.error(err);
            return res.render("account", { error: "Error, please try again", currentUser: req.user });
          }

          req.logIn(user, (err) => {
            if (err) {
              req.session.message = "Error";
              logger.error(err);
              return res.render("account", { error: "Error, please try again", currentUser: req.user });
            }
            
            req.session.message = "Changed";
            logger.warn("Password change for " + `${kleur.magenta(user.username)}` + " was successfull");
            return res.redirect("/secret");
          });
        });
      });
    });
  });
});

//HANDLING ACCOUNT
router.get("/", isLoggedIn, function (req, res, next) {
  return res.render("account", { error: 'no error', currentUser: req.user });
});

export default router;