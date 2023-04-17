const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const logger = require('../serverjs/logger.js');
const kleur = require('kleur');
const { isLoggedIn, isAdmin } = require('../middleware/authentication.js');

router.post("/", isLoggedIn, isAdmin, async (req, res) => {
  console.log('Reset password route triggered:', req.body);
  try {
    const userId = req.body.userId;
    console.log("userId:", userId);
    const user = await User.findById(userId);

    if (req.body.newPassword !== req.body.confirmPassword) {
      req.session.message = "Mismatch";
      console.log(req.body.newPassword, req.body.confirmPassword)
      logger.error("New password and confirm password do not match");
      return res.render("users", { error: "New password and confirm password do not match", currentUser: req.user });
    } else {
      user.setPassword(req.body.newPassword, (err) => {
        if (err) {
          req.session.message = "Error";
          logger.error(err);
          return res.render("users", { error: "Error, please try again" });
        }
        user.save((err) => {
          if (err) {
            req.session.message = "Error";
            logger.error(err);
            return res.render("users", { error: "Error, please try again" });
          }
          req.session.message = "Changed";
          logger.warn("Password change for " + `${kleur.magenta(user.username)}` + " was successful");
          return res.redirect("/users");
        });
      });
    }

  } catch (error) {
    res.status(500).json({ message: "Error resetting password: " + error.message });
  }
});


module.exports = router;
