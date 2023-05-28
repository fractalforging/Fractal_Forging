import { Router } from 'express';
import User from '../models/user.js';
import logger from './logger.js';
import kleur from 'kleur';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';

const router = Router();

router.post("/", isLoggedIn, isAdmin, async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  
  try {
    const actionUser = req.user;
    const userId = req.body.userId;
    const user = await User.findById(userId).session(session);

    if (!req.body.newPassword) {
      logger.error(`Password reset for ${kleur.magenta(user.username)} failed by ${kleur.magenta(actionUser.username)}: New password empty`, { username: req.user.username });
      return res.status(400).json({ error: "New password cannot be empty" });
    } else if (req.body.newPassword !== req.body.confirmPassword) {
      logger.error(`Password reset for ${kleur.magenta(user.username)} failed by ${kleur.magenta(actionUser.username)}: Passwords do not match`, { username: req.user.username });
      return res.status(400).json({ error: "Passwords do not match" });
    } else {
      await new Promise((resolve, reject) => {
        user.setPassword(req.body.newPassword, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }).catch(err => {
        logger.error(err);
        throw new Error('Error setting new password');
      });

      await new Promise((resolve, reject) => {
        user.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      }).catch(err => {
        logger.error(err);
        throw new Error('Error saving new password');
      });

      await session.commitTransaction();
      session.endSession();

      req.session.message = "Changed";
      logger.warn(`Password for ${kleur.magenta(user.username)} was successfully reset by ${kleur.magenta(actionUser.username)}`, { username: req.user.username });
      return res.status(200).json({ success: true, message: "Password changed successfully" });
    }
  } catch (error) {
    session.abortTransaction();
    session.endSession();
    logger.error(error);
    return res.status(500).json({ error: "Error resetting password" });
  }
});


export default router;
