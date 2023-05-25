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
    const userId = req.body.userId;
    const user = await User.findById(userId).session(session);
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
          session.abortTransaction();
          session.endSession();
          return res.status(500).json({ error: "Error setting new password" });
        }
        user.save((err) => {
          if (err) {
            logger.error(err);
            session.abortTransaction();
            session.endSession();
            return res.status(500).json({ error: "Error saving new password" });
          }
          session.commitTransaction();
          session.endSession();
          req.session.message = "Changed";
          logger.warn("Password change for " + `${kleur.magenta(user.username)}` + " was successful");
          return res.status(200).json({ success: true, message: "Password changed successfully" });
        });        
      });
    }
  } catch (error) {
    session.abortTransaction();
    session.endSession();
    logger.error(error);
    return res.status(500).json({ error: "Error resetting password" });
  }
});

export default router;
