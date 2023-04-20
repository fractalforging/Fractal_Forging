// resetPassword.js
const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const logger = require('../serverjs/logger.js');
const kleur = require('kleur');
const { isLoggedIn, isAdmin } = require('../middleware/authentication.js');

router.post("/", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const userId = req.body.userId;
    const user = await User.findById(userId);
    if (!req.body.newPassword) {
      logger.error("New password empty");
      return res.status(400).json({ error: "New password cannot be empty" });
    } else if (req.body.newPassword !== req.body.confirmPassword) {
      logger.error("Passwords do not match");
      return res.status(400).json({ error: "Passwords do not match" });
    } else {
      user.setPassword(req.body.newPassword, (err) => {
        if (err) {
          logger.error(err);
          return res.status(500).json({ error: "Error setting new password" });
        }
        user.save((err) => {
          if (err) {
            logger.error(err);
            return res.status(500).json({ error: "Error saving new password" });
          }
          req.session.message = "Changed";
          logger.warn("Password change for " + `${kleur.magenta(user.username)}` + " was successful");
          return res.status(200).json({ success: true, message: "Password changed successfully" });
        });        
      });
    }
  } catch (error) {
    //res.status(500).json({ error: "Error resetting password: " + error.message });
  }
});

module.exports = router;