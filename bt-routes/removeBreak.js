const express = require('express');
const router = express.Router();
const logger = require('../serverjs/logger.js');
const kleur = require('kleur');

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
