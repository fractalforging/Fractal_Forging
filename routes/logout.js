const express = require('express');
const kleur = require('kleur');
const logger = require('./logger');
const router = express.Router();

//HANDLING USER LOGOUT
router.get("/", function (req, res, next) {
  const username = req.user.username;
  req.logout(function (err) {
    if (err) {
      logger.error(err);
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
