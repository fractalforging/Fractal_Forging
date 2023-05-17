'use strict';

import { Router } from "express";
import logger from '../routes/logger.js';
import kleur from 'kleur';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';
import BreakSlots from "../models/BreakSlots.js";
import BreakTrack from '../models/BreakTrack.js';

const moveQueuedBreaksToNormalList = async (availableSlots) => {
  let activeBreaks;
  try {
    activeBreaks = await BreakTrack.countDocuments({ status: 'active' });
  } catch (error) {
    return;
  }
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

const breakSlotsRoute = (io) => {
  const router = Router();
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
        await moveQueuedBreaksToNormalList(newSlotsValue);
        req.session.message = "Updated";
        io.emit('reload'); 
        logger.info(`${kleur.magenta(req.user.username)} updated the available slots to: ${kleur.grey(newSlotsValue)}`);
        return res.redirect("secret_admin");
      } else if (newSlotsValue == currentSlots.slots) {
        req.session.message = "Same value";
        logger.error("Slots were NOT updated, same value chosen");
        return res.redirect("secret_admin");
      }
    } catch (error) {
      logger.error(error);
      req.session.message = "Error";
      return res.redirect("secret_admin");
    }
  });
  return router;
}

export default breakSlotsRoute;