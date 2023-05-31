import { Router } from 'express';
import mongoose from 'mongoose';
import logger from '../routes/logger.js';
import kleur from 'kleur';
import BreakSlots from '../models/BreakSlots.js';

const submitBreakRoute = (io, BreakTrack, User) => {
  const router = Router();
  
  router.post("/", async (req, res) => {
    const { username: user } = req.user;
    const breakDuration = Number(req.body.duration);
    const breakDurationInSeconds = breakDuration * 60;
    
    let session;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      const [latestBreak, currentUser, availableSlots, activeBreaks] = await Promise.all([
        BreakTrack.findOne({ user }).sort({ startTime: -1 }).session(session),
        User.findOne({ username: user }).session(session),
        BreakSlots.findOne().session(session),
        BreakTrack.countDocuments({ status: 'active' }).session(session)
      ]);

      if (latestBreak && !latestBreak.endTime) {
        req.session.message = 'Only 1 break at a time';
        logger.error(`${kleur.magenta(user)} tried submitting a second break unsuccessfully since only 1 break is allowed at a time.`, { username: req.user.username });
        return res.redirect("/secret");
      }

      if (currentUser.remainingBreakTime < breakDurationInSeconds) {
        req.session.message = currentUser.remainingBreakTime === 0 ? 'Break time over' : 'Not enough';
        logger.info(`${kleur.magenta(user)} tried submitting a break unsuccessfully since not enough break time is available.`, { username: req.user.username });
        return res.redirect("/secret");
      }

      const breakTracker = new BreakTrack({
        user,
        startTime: new Date().toUTCString(),
        duration: breakDuration,
        date: new Date().toUTCString(),
        status: activeBreaks < availableSlots.slots ? 'active' : 'queued',
        lock: false
      });

      await breakTracker.save({ session });

      logger.info(`${kleur.magenta(user)} submitted a break of ${breakDuration} minute(s) ${breakTracker.status === 'queued' ? 'and added to the queue' : ''}`, { username: req.user.username });
      io.emit('reload');

      await session.commitTransaction();

      return res.redirect("/secret");
    } catch (error) {
      logger.error(`Error occurred while submitting the break: ${error}`, { username: req.user.username });
      return res.redirect("/secret");
    } finally {
      if (session) {
        session.endSession();
      }
    }
  });

  return router;
}

export default submitBreakRoute;
