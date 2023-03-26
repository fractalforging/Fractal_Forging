const express = require("express");
const router = express.Router();
const logger = require('../serverjs/logger.js');
const kleur = require('kleur');
const { isLoggedIn, isAdmin } = require('../middleware/authentication.js');
const BreakSlots = require("../models/BreakSlots.js");

module.exports = function(io) {
  router.post("/", isAdmin, async function (req, res, next) {
    try {
      const newSlotsValue = req.body.slotsavailable;
      const currentSlots = await BreakSlots.findOne();
      if (newSlotsValue != currentSlots.slots) {
        const breakSlots = await BreakSlots.findOneAndUpdate(
          {},
          { $set: { slots: newSlotsValue } },
          { new: true, upsert: true }
        );
        req.session.slotsAvailable = "Updated";
        io.emit('reload'); // use io object passed as a parameter
        logger.info(`${kleur.magenta(req.user.username)} updated the available slots to: ${newSlotsValue}`);
        return res.redirect("secret_admin");
      } else if (newSlotsValue == currentSlots.slots) {
        req.session.slotsAvailable = "Same value";
        logger.error("Slots were NOT updated, same value chosen");
        return res.redirect("secret_admin");
      }
    } catch (error) {
      logger.error(error);
      req.session.slotsAvailable = "Error";
      return res.redirect("secret_admin");
    }
  });
  return router;
}
