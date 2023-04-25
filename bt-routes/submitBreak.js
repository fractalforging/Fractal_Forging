const express = require('express');
const router = express.Router();
const logger = require('../routes/logger.js');
const kleur = require('kleur');
const BreakTrack = require('../models/BreakTrack.js');
const BreakSlots = require('../models/BreakSlots.js');

const moveToNormalList = async (BreakTrack) => {
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
const moveQueuedBreaksToNormalList = async (BreakTrack, availableSlots) => {
  const activeBreaks = await BreakTrack.countDocuments({ status: 'active' });
  const remainingSlots = availableSlots - activeBreaks;
  if (remainingSlots > 0) {
    const queuedBreaks = await BreakTrack.find({ status: 'queued' })
      .sort({ date: 1 })
      .limit(remainingSlots);
    for (const queuedBreak of queuedBreaks) {
      queuedBreak.status = 'active';
      await queuedBreak.save();
    }
  }
};
const submitBreaks = (io, BreakTrack, User) => {
  router.post("/", async function (req, res, next) {
    const user = req.user.username;
    const latestBreak = await BreakTrack.findOne({ user }).sort({ startTime: -1 });
    const breakDuration = req.body.duration;
    const currentUser = await User.findOne({ username: user });
    const breakDurationInSeconds = breakDuration * 60;
    if (latestBreak && !latestBreak.endTime) {
      req.session.message = 'Only 1 break at a time';
      logger.info(req.session.message);
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
          await moveToNormalList(BreakTrack);
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
          await moveToNormalList(BreakTrack);
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

module.exports = { submitBreaks, moveToNormalList, moveQueuedBreaksToNormalList };


