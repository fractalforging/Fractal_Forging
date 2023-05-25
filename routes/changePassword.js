'use strict';

import kleur from 'kleur';
import { Router } from 'express';
import User from '../models/user.js';
import logger from './logger.js';
import { isLoggedIn } from '../middleware/authentication.js';
import mongoose from 'mongoose';

const changepasswordRoute = Router();

// Function to handle repetitive error checks
const checkErrors = async (checks, req, res) => {
  for (const check of checks) {
    if (await check.condition()) {
      req.session.message = check.message;
      logger.error(check.error);
      return res.render("changepassword", { error: check.errorMessage, currentUser: req.user });
    }
  }
  return null;
};

// HANDLING PASSWORD CHANGE
changepasswordRoute.post("/", isLoggedIn, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const user = await User.findOne({ username: req.user.username }).session(session);

    const errorCheck = await checkErrors([
      { condition: async () => !user, message: "Error", error: "User not found", errorMessage: "Error, please try again" },
      { condition: async () => !req.body.currentpassword, message: "Wrong", error: "Current password empty", errorMessage: "Current password empty!" },
      { condition: async () => req.body.newpassword !== req.body.confirmpassword, message: "Mismatch", error: "New password and confirm password do not match", errorMessage: "New password and confirm password do not match" },
    ], req, res);

    if (errorCheck) return;

    const valid = await user.authenticate(req.body.currentpassword);

    if (!valid) {
      req.session.message = "Wrong";
      logger.error("Current password wrong 2");
      return res.render("changepassword", { error: "Current password incorrect!", currentUser: req.user });
    }

    await user.setPassword(req.body.newpassword);

    await user.save({ session });

    await session.commitTransaction();

    req.logIn(user, (err) => {
      if (err) {
        req.session.message = "Error";
        logger.error(err);
        return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
      }

      req.session.message = "Changed";
      logger.warn("Password change for " + `${kleur.magenta(user.username)}` + " was successful");
      return res.redirect("/secret");
    });

  } catch (err) {
    await session.abortTransaction();
    req.session.message = "Error";
    logger.error(err);
    return res.render("changepassword", { error: "Error, please try again", currentUser: req.user });
  } finally {
    session.endSession();
  }
});

// HANDLING ACCOUNT
changepasswordRoute.get("/", isLoggedIn, (req, res) => {
  return res.render("changepassword", { error: 'no error', currentUser: req.user });
});

export default changepasswordRoute;
