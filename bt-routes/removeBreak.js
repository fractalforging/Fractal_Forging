import { Router } from 'express';
import mongoose from 'mongoose';
import logger from '../routes/logger.js';
import kleur from 'kleur';
import BreakTrack from '../models/BreakTrack.js';
import BreakSlots from '../models/BreakSlots.js';

const router = Router();

const removeBreak = (io, BreakTrack, User) => {
  router.get("/:id", async (req, res, next) => {
    const id = req.params.id;
    const beforeStart = req.query.beforeStart === 'true';
    const isAdmin = req.query.isAdmin === 'true';
    
    const session = await mongoose.startSession();

    let hasCommitted = false;

    try {
      session.startTransaction();
      
      const breakToRemove = await BreakTrack.findById(id).session(session);
      const userToUpdate = await User.findOne({ username: breakToRemove.user }).session(session);
      
      await BreakTrack.findByIdAndRemove(id, { session });
      
      const availableSlotsData = await BreakSlots.findOne().session(session);
      const availableSlots = availableSlotsData.slots;
      const activeBreaks = await BreakTrack.countDocuments({ status: 'active' }).session(session);
  
      if (activeBreaks < availableSlots) {
        const nextInQueue = await BreakTrack.findOne({ status: 'queued' }).sort({ date: 1 }).session(session);
        if (nextInQueue) {
          nextInQueue.status = 'active';
          await nextInQueue.save({ session });
        }
      }
      
      let roundedRemainingBreakTime = 0;

      if (breakToRemove.hasStarted && !breakToRemove.hasEnded) {
        const currentTime = new Date();
        const breakStartTime = new Date(breakToRemove.breakStartTimeStamp);
        const timeEnjoyed = currentTime - breakStartTime;
        const remainingBreakTime = (breakToRemove.duration * 60 * 1000) - timeEnjoyed;
        const remainingBreakTimeInSeconds = remainingBreakTime / 1000;
        
        if (remainingBreakTimeInSeconds >= 0 && remainingBreakTimeInSeconds < 30) {
          roundedRemainingBreakTime = 0;
        } else if (remainingBreakTimeInSeconds >= 30 && remainingBreakTimeInSeconds < 90) {
          roundedRemainingBreakTime = 60;
        } else {
          roundedRemainingBreakTime = Math.floor((remainingBreakTimeInSeconds + 30) / 60) * 60;
        }

        userToUpdate.remainingBreakTime += roundedRemainingBreakTime;
        await userToUpdate.save({ session });
      }
      
      await session.commitTransaction();
      hasCommitted = true;

      let actionUser = req.user;

        if (breakToRemove.hasEnded) {
          logger.info(`${kleur.magenta(breakToRemove.user)} ended ${kleur.magenta(breakToRemove.user + '\'s')} break after break end.`, { username: req.user.username });
        } else {
          logger.info(`${kleur.magenta(actionUser.username)} ended ${kleur.magenta(breakToRemove.user + '\'s')} break with ${kleur.yellow(Math.floor(roundedRemainingBreakTime / 60) + ' minutes')} remaining. Remaining break time has been credited back to ${kleur.magenta(breakToRemove.user + '\'s')}'s total break time available.`, { username: req.user.username });
        }
      
      io.emit('removeBreak', { id: id, beforeStart: beforeStart });
      
      res.sendStatus(200);
    } catch (err) {
      logger.error("Error removing break: ", err, { username: req.user.username });
      
      if (!hasCommitted) {
        await session.abortTransaction();
      }

      res.sendStatus(500);
    } finally {
      session.endSession();
    }
  });

  return router;
};

export default removeBreak;


