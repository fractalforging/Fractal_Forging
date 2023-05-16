import express from 'express';
import { Router } from 'express';
import User from '../models/user.js';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';
import BreakSlots from '../models/BreakSlots.js';
import logger from '../routes/logger.js';
import kleur from 'kleur';
import passportLocalMongoose from 'passport-local-mongoose';

const { UserExistsError } = passportLocalMongoose;

const router = Router();

router.get('/', function(req, res, next) {
  res.render('register', { currentUser: req.user });
});

router.post('/', isAdmin, async function(req, res, next) {
  try {
    const breakSlots = await BreakSlots.findOne({});
    if (req.body.password !== req.body.confirmpassword) {
      req.session.message = 'Mismatch';
      logger.error('Password and confirm password do not match');
      return res.redirect('/register');
    }

    const newUser = new User({ username: req.body.username, roles: 'user', breakSlots });
    await User.register(newUser, req.body.password);
    logger.info(`Registered new user:  ${kleur.magenta(req.body.username)}`);
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

export default router;
