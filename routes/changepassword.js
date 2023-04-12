const express = require('express');
const kleur = require('kleur');
const router = express.Router();
const User = require('../models/user');
const logger = require('../serverjs/logger');
const { ensureAuthenticated } = require('../middleware/authentication');

router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { currentpassword, newpassword, confirmpassword } = req.body;

    const user = await User.findOne({ username: req.user.username });

    if (!user) {
      logger.error('User not found');
      req.session.passChange = 'Error';
      return renderError(res, 'User not found', 404, req.user);
    }

    if (!currentpassword) {
      logger.error('Current password empty');
      req.session.passChange = 'Wrong';
      return renderError(res, 'Current password empty!', 400, req.user);
    }

    if (newpassword !== confirmpassword) {
      logger.error('New password and confirm password do not match');
      req.session.passChange = 'Mismatch';
      return renderError(res, 'New password and confirm password do not match', 400, req.user);
    }

    const isValidPassword = await user.authenticate(currentpassword);

    if (!isValidPassword) {
      logger.error('Current password incorrect');
      req.session.passChange = 'Wrong';
      return renderError(res, 'Current password incorrect!', 401, req.user);
    }

    await user.setPassword(newpassword);
    await user.save();

    req.logIn(user, (err) => {
      if (err) {
        logger.error(err);
        req.session.passChange = 'Error';
        return renderError(res, 'Error, please try again', 500, req.user);
      }

      logger.warn(`Password change for ${kleur.magenta(user.username)} was successful`);
      req.session.passChange = 'Changed';
      return res.redirect('/secret');
    });
  } catch (err) {
    logger.error(err);
    req.session.passChange = 'Error';
    return renderError(res, 'Error, please try again', 500, req.user);
  }
});

router.get('/', ensureAuthenticated, (req, res) => {
  return res.render('account', { error: req.session.passChange || 'no error', currentUser: req.user });
});

function renderError(res, errorMsg, statusCode, user) {
  req.session.passChange = 'Error';
  return res.status(statusCode).render('account', { error: errorMsg, currentUser: user });
}

module.exports = router;