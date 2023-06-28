'use strict';

import express from "express";
import mongoose from 'mongoose';
import BreakTrack from "../models/BreakTrack.js";
import BreakSlots from "../models/BreakSlots.js";

const breakQueueList = (User, io, location) => {
  const router = express.Router();

  async function processBreakQueue(req, res, next) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const availableSlots = (await BreakSlots.findOne()).slots;
      const activeBreaks = await BreakTrack.countDocuments({ hasStarted: true });

      if (activeBreaks < availableSlots) {
        const nextInQueue = await BreakTrack.findOne({ waitingInQueue: true }).sort({ startTime: 1 });

        if (nextInQueue) {
          nextInQueue.waitingInQueue = false;
          nextInQueue.queuePosition = undefined;
          await nextInQueue.save({ session });

          await BreakTrack.updateMany(
            { waitingInQueue: true },
            { $inc: { queuePosition: -1 } },
            { session }
          );
        }
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error; // re-throw the error
    } finally {
      session.endSession();
    }

    next();
  }

  router.use(processBreakQueue);

  return router;
};

export default breakQueueList;
