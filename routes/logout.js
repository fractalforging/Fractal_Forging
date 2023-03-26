const express = require('express');
const kleur = require('kleur');
const logger = require('../serverjs/logger');
const router = express.Router();

//HANDLING USER LOGOUT
router.get("/", function (req, res, next) {
  const username = req.user.username; // Get the username from the user object
  req.logout(function (err) {
    if (err) {
      logger.error(err);
    }
    logger.warn('Logout successful for user: ' + kleur.magenta(username)); // Use the username obtained from the user object
    req.session.destroy(function (err) {
      if (err) {
        logger.error(err);
      }
      return res.redirect("/");
    });
  });
});

module.exports = router;
