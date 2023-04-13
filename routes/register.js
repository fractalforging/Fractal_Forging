const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { isLoggedIn, isAdmin } = require('../middleware/authentication');
const logger = require('../serverjs/logger');
const BreakSlots = require('../models/BreakSlots');

router.get('/', function(req, res, next) {
  res.render('register', { currentUser: req.user });
});

router.post('/', isAdmin, async function(req, res, next) {
  try {
    const breakSlots = await BreakSlots.findOne({});
    const { UserExistsError } = require('passport-local-mongoose');

    // check if passwords match
    if (req.body.password !== req.body.confirmpassword) {
      req.session.message = 'Mismatch';
      logger.error('Password and confirm password do not match');
      return res.redirect('/register');
    }

    const newUser = new User({ username: req.body.username, roles: 'user', breakSlots });
    await User.register(newUser, req.body.password);
    logger.info(`Registered new user: ${req.body.username}`);
    req.session.message = 'Ok';
    res.redirect('/secret_admin');
  } catch (error) {
    logger.error(error);
    if (error.name === 'UserExistsError') {
      req.session.message = 'Taken';
    } else if (error.name === 'MissingUsernameError') {
      req.session.message = 'NoUser';
    } else if (error.name === 'MissingPasswordError') {
      req.session.message = 'NoPass';
    } else {
      req.session.message = 'Error';
    }
    res.redirect('/register');
  }
});

module.exports = router;
