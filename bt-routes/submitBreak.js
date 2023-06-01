import { Router } from 'express';
import mongoose from 'mongoose';
import logger from '../routes/logger.js';
import kleur from 'kleur';
import BreakSlots from '../models/BreakSlots.js';

const submitBreakRoute = (io, BreakTrack, User) => {
  const router = Router();

  const executeWithRetry = async (session, transactionFunction, retryCount = 3) => {
    for (let i = 0; i < retryCount; i++) {
      try {
        await transactionFunction(session);
        await session.commitTransaction();
        return;
      } catch (error) {
        console.error('Error occurred, retrying transaction', error);
        await session.abortTransaction();
      }
    }
    throw new Error('Transaction failed after retries');
  }

  router.post("/", async (req, res) => {
    const { username: user } = req.user;
    const breakDuration = Number(req.body.duration);
    const breakDurationInSeconds = breakDuration * 60;
  
    let session;
  
    try {
      session = await mongoose.startSession();
      session.startTransaction();
  
      try {
        const latestBreak = await BreakTrack.findOne({ user }).sort({ startTime: -1 }).session(session);
        const currentUser = await User.findOne({ username: user }).session(session);
        const availableSlots = await BreakSlots.findOne().session(session);
        const activeBreaks = await BreakTrack.countDocuments({ status: 'active' }).session(session);
  
        if (latestBreak && !latestBreak.endTime) {
          req.session.message = 'Only 1 break at a time';
          logger.error(`${kleur.magenta(user)} tried submitting a second break unsuccessfully since only 1 break is allowed at a time.`, { username: req.user.username });
          throw new Error('Only 1 break at a time');
        }
  
        if (currentUser.remainingBreakTime < breakDurationInSeconds) {
          req.session.message = currentUser.remainingBreakTime === 0 ? 'Break time over' : 'Not enough';
          logger.info(`${kleur.magenta(user)} tried submitting a break unsuccessfully since not enough break time is available.`, { username: req.user.username });
          throw new Error('Not enough break time available');
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
        console.error('Error occurred, retrying transaction', error);
        await session.abortTransaction();
  
        if (session) {
          session.endSession();
        }
  
        logger.error(`Error occurred while submitting the break: ${error}`, { username: req.user.username });
        return res.redirect("/secret");
      }
  
    } catch (error) {
      logger.error(`Failed to start transaction: ${error}`, { username: req.user.username });
      return res.redirect("/secret");
    }
  });  

  return router;
}

export default submitBreakRoute;
