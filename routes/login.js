import express from 'express';
import passport from 'passport';
import { ensureLoggedOut } from 'connect-ensure-login';
import logger from '../routes/logger.js';
import kleur from 'kleur';

const loginRoute = express.Router();

loginRoute.get('/', ensureLoggedOut('/secret'), (req, res) => {
  res.render('login', { layout: 'layouts/default', pageTitle: 'Login' });
});

loginRoute.post('/', ensureLoggedOut('/secret'), (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      logger.error(err);
      return res.status(500).json({ message: 'An internal error occurred' });
    }

    if (!user) {
      logger.error('Incorrect username or password');
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    req.logIn(user, (err) => {
      if (err) {
        logger.error(err);
        return res.status(500).json({ message: 'An internal error occurred' });
      }

      const username = user.username || 'unknown'; // provide a fallback
      logger.warn('Login successful for user: ' + kleur.magenta(username));
      return res.status(200).json({ message: 'Login successful', redirectURL: '/secret' });
    });
  })(req, res, next);
});

export default loginRoute;
