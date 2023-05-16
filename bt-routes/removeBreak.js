'use strict';

import { Router } from 'express';
import logger from '../routes/logger.js';
import kleur from 'kleur';
import BreakTrack from '../models/BreakTrack.js';
import BreakSlots from '../models/BreakSlots.js';

const router = Router();

const moveToNormalList = async () => {
  const availableSlotsData = await BreakSlots.findOne();
  const availableSlots = availableSlotsData.slots;
  const activeBreaks = await BreakTrack.countDocuments({ status: 'active' });

  if (activeBreaks < availableSlots) {
    const nextInQueue = await BreakTrack.findOne({ status: 'queued' }).sort({ date: 1 });
    if (nextInQueue) {
      nextInQueue.status = 'active';
      await nextInQueue.save();
    }
  }
};

const removeBreak = (io, BreakTrack, User) => {
  router.get("/:id", async (req, res, next) => {
    const id = req.params.id;
    const beforeStart = req.query.beforeStart === 'true';
    const isAdmin = req.query.isAdmin === 'true';
    try {
      const breakToRemove = await BreakTrack.findById(id);
      const userToUpdate = await User.findOne({ username: breakToRemove.user });
      let actionUser = req.user;
      await BreakTrack.findByIdAndRemove(id);
      await moveToNormalList(BreakTrack);
      
      if (breakToRemove.hasStarted && !breakToRemove.hasEnded) {
        const currentTime = new Date();
        const breakStartTime = new Date(breakToRemove.breakStartTimeStamp);
        const timeEnjoyed = currentTime - breakStartTime;
        const remainingBreakTime = (breakToRemove.duration * 60 * 1000) - timeEnjoyed;
        const remainingBreakTimeInSeconds = remainingBreakTime / 1000;
        
        let roundedRemainingBreakTime = 0;
        if (remainingBreakTimeInSeconds >= 0 && remainingBreakTimeInSeconds < 30) {
          roundedRemainingBreakTime = 0;
        } else if (remainingBreakTimeInSeconds >= 30 && remainingBreakTimeInSeconds < 90) {
          roundedRemainingBreakTime = 60;
        } else {
          roundedRemainingBreakTime = Math.floor((remainingBreakTimeInSeconds + 30) / 60) * 60;
        }

        userToUpdate.remainingBreakTime += roundedRemainingBreakTime;
        await userToUpdate.save();
      }
      
      let logMessage = '';
      if (isAdmin) {
        logMessage = `admin removed ${kleur.magenta(userToUpdate.username)}'s break `;
      } else {
        logMessage = `${kleur.magenta(userToUpdate.username)} removed break `;
      }
      if (beforeStart) {
        io.emit('reload');
        logger.info(`${kleur.magenta(actionUser.username)} removed ${kleur.magenta(userToUpdate.username)}'s break before break start`);
      } else if (breakToRemove.hasStarted && !breakToRemove.hasEnded) {
        io.emit('reload');
        logger.info(`${kleur.magenta(actionUser.username)} removed ${kleur.magenta(userToUpdate.username)}'s break after break start`);
      } else {
        io.emit('reload');
        logger.info(`${kleur.magenta(actionUser.username)} removed ${kleur.magenta(userToUpdate.username)}'s break after break end`);
      }
      return res.redirect("/secret");
    } catch (err) {
      logger.error("Error removing the break: ", err);
      return res.status(500).send(err);
    }
  });

  return router;
};

export default removeBreak;
