'use strict';

import { Router } from 'express';
import logger from '../routes/logger.js';
import kleur from 'kleur';
import BreakSlots from '../models/BreakSlots.js';

const submitBreakRoute = (io, BreakTrack, User) => {
  const router = Router();
  router.post("/", async function (req, res, next) {
    const user = req.user.username;
    const latestBreak = await BreakTrack.findOne({ user }).sort({ startTime: -1 });
    const breakDuration = req.body.duration;
    const currentUser = await User.findOne({ username: user });
    const breakDurationInSeconds = breakDuration * 60;
    if (latestBreak && !latestBreak.endTime) {
      req.session.message = 'Only 1 break at a time';
      logger.error(req.session.message);
      return res.redirect("/secret");
    } else if (currentUser.remainingBreakTime < breakDurationInSeconds) {
      if (currentUser.remainingBreakTime === 0) {
        req.session.message = 'Break time over';
      } else {
        req.session.message = 'Not enough';
      }
      logger.info(req.session.message);
      return res.redirect("/secret");
    } else {
      const availableSlots = (await BreakSlots.findOne()).slots;
      const activeBreaks = await BreakTrack.countDocuments({ status: 'active' });
      if (activeBreaks < availableSlots) {
        const breakTracker = new BreakTrack({
          user,
          startTime: new Date().toUTCString(),
          duration: breakDuration,
          date: new Date().toUTCString(),
          status: 'active'
        });
        try {
          await breakTracker.save();
          logger.info(`${kleur.magenta(user)} submitted a break of ${breakDuration} minute(s)`);
          io.emit('reload');
          return res.redirect("/secret");
        } catch (err) {
          return res.redirect("/secret");
        }
      } else {
        const breakTracker = new BreakTrack({
          user,
          startTime: new Date().toUTCString(),
          duration: breakDuration,
          date: new Date().toUTCString(),
          status: 'queued'
        });
        try {
          await breakTracker.save();
          req.session.message = 'Added to queue';
          logger.info(`${kleur.magenta(user)} submitted a break of ${breakDuration} minute(s) and added to the queue`);
          io.emit('reload');
          return res.redirect("/secret");
        } catch (err) {
          return res.redirect("/secret");
        }
      }
    }
  });
  return router;
}

export default submitBreakRoute;


