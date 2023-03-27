const express = require('express');
const router = express.Router();
const logger = require('../serverjs/logger.js');
const kleur = require('kleur');

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
      req.session.message = 'Break submitted';
      // Update the user's remaining break time
      await currentUser.save(); // Save the updated remaining break time
      logger.info(`${kleur.magenta(user)} submitted a break of ${breakDuration} minute(s)`);
      io.emit('reload');
      const breakTracker = new BreakTrack({
        user,
        startTime: new Date().toUTCString(),
        duration: breakDuration,
        date: new Date().toUTCString(),
      });
      try {
        await breakTracker.save();
        return res.redirect("/secret");
      } catch (err) {
        return res.redirect("/secret");
      }
    }
  });
  
  return router;
};

module.exports = submitBreaks;
