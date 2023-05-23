import { Router } from 'express';
import mongoose from 'mongoose';  // import mongoose
import logger from '../routes/logger.js';
import kleur from 'kleur';
import BreakSlots from '../models/BreakSlots.js';

const submitBreakRoute = (io, BreakTrack, User) => {
  const router = Router();
  router.post("/", async function (req, res, next) {
    const user = req.user.username;
    const session = await mongoose.startSession();  // start a session

    session.startTransaction();  // start a transaction
    try {
      const latestBreak = await BreakTrack.findOne({ user }).sort({ startTime: -1 }).session(session);  // pass the session here
      const breakDuration = req.body.duration;
      const currentUser = await User.findOne({ username: user }).session(session);  // pass the session here
      const breakDurationInSeconds = breakDuration * 60;
      if (latestBreak && !latestBreak.endTime) {
        req.session.message = 'Only 1 break at a time';
        logger.error(req.session.message);
        await session.abortTransaction();  // abort the transaction
        return res.redirect("/secret");
      } else if (currentUser.remainingBreakTime < breakDurationInSeconds) {
        if (currentUser.remainingBreakTime === 0) {
          req.session.message = 'Break time over';
        } else {
          req.session.message = 'Not enough';
        }
        logger.info(req.session.message);
        await session.abortTransaction();  // abort the transaction
        return res.redirect("/secret");
      } else {
        const availableSlots = (await BreakSlots.findOne().session(session)).slots;  // pass the session here
        const activeBreaks = await BreakTrack.countDocuments({ status: 'active' }).session(session);  // pass the session here
        const breakTracker = new BreakTrack({
          user,
          startTime: new Date().toUTCString(),
          duration: breakDuration,
          date: new Date().toUTCString(),
          status: activeBreaks < availableSlots ? 'active' : 'queued',
          lock: true  // set lock to true initially
        });
        await breakTracker.save({ session });  // pass the session here
        breakTracker.lock = false;  // remove lock before committing the transaction
        await breakTracker.save({ session });  // pass the session here
        //req.session.message = activeBreaks < availableSlots ? 'Break started' : 'Added to queue';
        logger.info(`${kleur.magenta(user)} submitted a break of ${breakDuration} minute(s) ${activeBreaks < availableSlots ? '' : 'and added to the queue'}`);
        io.emit('reload');
        await session.commitTransaction();  // commit the transaction
        return res.redirect("/secret");
      }
    } catch (err) {
      await session.abortTransaction();  // abort the transaction
      logger.error(`Error occurred while submitting the break: ${err}`);
      return res.redirect("/secret");
    } finally {
      session.endSession();  // end the session
    }
  });
  return router;
}

export default submitBreakRoute;
