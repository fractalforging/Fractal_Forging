import { Router } from "express";
import mongoose from 'mongoose';
import logger from '../routes/logger.js';
import kleur from 'kleur';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';
import BreakSlots from "../models/BreakSlots.js";
import BreakTrack from '../models/BreakTrack.js';

const moveQueuedBreaksToNormalList = async (availableSlots, session) => {
  const activeBreaks = await BreakTrack.countDocuments({ status: 'active' }).session(session);
  const remainingSlots = availableSlots - activeBreaks;
  if (remainingSlots > 0) {
    const queuedBreaks = await BreakTrack.find({ status: 'queued' })
      .sort({ date: 1 })
      .limit(remainingSlots)
      .session(session);
    for (const queuedBreak of queuedBreaks) {
      queuedBreak.status = 'active';
      await queuedBreak.save();
    }
  }
};

const breakSlotsRoute = (io) => {
  const router = Router();
  router.post("/", isAdmin, async function (req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const newSlotsValue = req.body.slotsavailable;
      const currentSlots = await BreakSlots.findOne().session(session);
      if (newSlotsValue != currentSlots.slots) {
        await BreakSlots.findOneAndUpdate(
          {},
          { $set: { slots: newSlotsValue } },
          { new: true, upsert: true, session }
        );
        await moveQueuedBreaksToNormalList(newSlotsValue, session);
        req.session.message = "Updated";
        logger.info(`${kleur.magenta(req.user.username)} updated the available slots to: ${kleur.grey(newSlotsValue)}`, { username: req.user.username });
        await session.commitTransaction();
        io.emit('reload');
        return res.redirect("secret_admin");
      } else {
        req.session.message = "Same value";
        logger.error(`Slots were NOT updated, same value chosen by ${kleur.magenta(req.user.username)}`, { username: req.user.username });
        await session.commitTransaction();
        return res.redirect("secret_admin");
      }
    } catch (error) {
      logger.error(error, { username: req.user.username });
      await session.abortTransaction();
      req.session.message = "Error";
      return res.redirect("secret_admin");
    } finally {
      session.endSession();
    }
  });
  return router;
};

export default breakSlotsRoute;
