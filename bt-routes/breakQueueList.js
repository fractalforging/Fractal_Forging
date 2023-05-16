'use strict';

import express from "express";
import BreakTrack from "../models/BreakTrack.js";
import BreakSlots from "../models/BreakSlots.js";

const breakQueueList = (User, io, location) => {
  const router = express.Router();

  async function processBreakQueue(req, res, next) {
    const availableSlots = (await BreakSlots.findOne()).slots;
    const activeBreaks = await BreakTrack.countDocuments({ hasStarted: true });

    if (activeBreaks < availableSlots) {
      const nextInQueue = await BreakTrack.findOne({ waitingInQueue: true }).sort({ startTime: 1 });

      if (nextInQueue) {
        nextInQueue.waitingInQueue = false;
        nextInQueue.queuePosition = undefined;
        await nextInQueue.save();

        await BreakTrack.updateMany(
          { waitingInQueue: true },
          { $inc: { queuePosition: -1 } },
        );
      }
    }

    next();
  }

  router.use(processBreakQueue);

  return router;
};

export default breakQueueList;
