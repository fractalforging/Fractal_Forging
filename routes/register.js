import { Router } from 'express';
import User from '../models/user.js';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';
import BreakSlots from '../models/BreakSlots.js';
import logger from '../routes/logger.js';
import kleur from 'kleur';

const registerRoute = Router();

registerRoute.get('/', function(req, res, next) {
  res.render('register', { currentUser: req.user });
});

registerRoute.post('/', isLoggedIn, isAdmin, async function(req, res, next) {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const breakSlots = await BreakSlots.findOne({}).session(session);
    if (req.body.password !== req.body.confirmpassword) {
      req.session.message = 'Mismatch';
      logger.error('Password and confirm password do not match', { username: req.user.username });
      return res.redirect('/register');
    }

    const newUser = new User({ username: req.body.username, roles: 'user', breakSlots });

    await User.register(newUser, req.body.password); // Register user directly

    await session.commitTransaction();
    session.endSession();

    logger.info(`Registered new user: ${kleur.magenta(req.body.username)}`, { username: req.user.username });
    req.session.message = 'Ok';
    res.redirect('/secret_admin');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    logger.error(error, { username: req.user.username });
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


export default registerRoute;
