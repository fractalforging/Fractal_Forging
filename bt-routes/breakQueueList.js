const express = require("express");
const router = express.Router();

module.exports = (User, io, location) => {
  const BreakTrack = require("../models/BreakTrack.js");
  const BreakSlots = require("../models/BreakSlots.js");

  async function processBreakQueue(req, res, next) {
    const availableSlots = (await BreakSlots.findOne()).slots;
    const activeBreaks = await BreakTrack.countDocuments({ hasStarted: true, /*hasEnded: false*/ });

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
