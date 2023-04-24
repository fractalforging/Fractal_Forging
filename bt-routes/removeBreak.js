const express = require('express');
const router = express.Router();
const logger = require('../routes/logger.js');
const kleur = require('kleur');
const { moveToNormalList } = require('./submitBreak');

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
      
      // Calculate the remaining break time and add it back to the user's remaining break time for the day
      if (breakToRemove.hasStarted && !breakToRemove.hasEnded) {
        const currentTime = new Date();
        const breakStartTime = new Date(breakToRemove.breakStartTimeStamp);
        const timeEnjoyed = currentTime - breakStartTime;
        const remainingBreakTime = (breakToRemove.duration * 60 * 1000) - timeEnjoyed;

        // Convert remaining break time back to seconds
        const remainingBreakTimeInSeconds = remainingBreakTime / 1000;
        
        // Round the remaining break time according to the specified rules
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

module.exports = removeBreak;
