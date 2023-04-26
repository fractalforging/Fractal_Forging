const express = require('express');
const kleur = require('kleur');
const logger = require('./logger');
const { isLoggedIn } = require('../middleware/authentication.js');
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

module.exports = router;
