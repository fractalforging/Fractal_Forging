const express = require('express');
const router = express.Router();
const logger = require('../serverjs/logger.js');
const kleur = require('kleur');

const startBreak = (io, BreakTrack, User) => {
  router.post('/:id', async (req, res, next) => {
    const breakId = req.params.id;
    const breakStartTimeStamp = new Date().toISOString();
    const breakEntry = await BreakTrack.findOneAndUpdate({ _id: breakId }, { hasStarted: true, breakStartTimeStamp: breakStartTimeStamp }, { new: true });
    if (!breakEntry) {
      logger.error(`Break entry with ID ${breakId} not found.`);
      return res.status(404).send("Break entry not found.");
    }
    const user = await User.findOne({ username: req.user.username });
    const breakDurationInSeconds = breakEntry.duration * 60;
    if (user.remainingBreakTime < breakDurationInSeconds) {
      logger.info(`${kleur.magenta(user.username)} tried to start a break without enough remaining break time.`);
      return res.status(400).send("Not enough remaining break time.");
    }
    req.session.message = 'Break started';
    user.remainingBreakTime -= breakDurationInSeconds;
    await user.save();
    io.emit('reload');
    logger.info(`${kleur.magenta(req.user.username)} started a break of ${breakEntry.duration} minute(s)`);
    return res.status(200).send("Break status updated successfully.");
  });

  return router;
};

module.exports = startBreak;
