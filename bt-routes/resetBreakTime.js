'use strict';

import moment from 'moment-timezone';
import express from 'express';
import logger from '../routes/logger.js';
import kleur from 'kleur';
import LastResetTimestamp from '../models/LastResetTimestamp.js';
import mongoose from 'mongoose';

const resetBreakTime = (io, User, location) => {
  const router = express.Router();
  const resetHour = 22;

  async function getMillisecondsUntilReset() {
    let lastResetTimestampObj = await LastResetTimestamp.findOne();
    if (!lastResetTimestampObj) {
      lastResetTimestampObj = new LastResetTimestamp({ timestamp: new Date() });
      await lastResetTimestampObj.save();
    }
    const lastResetTimestamp = lastResetTimestampObj.timestamp;
    const now = moment.tz(new Date(), 'Europe/' + location);
    const lastResetTime = moment.tz(new Date(lastResetTimestamp), 'Europe/' + location);
    lastResetTime.set({ hour: resetHour, minute: 0, second: 0, millisecond: 0 });

    while (now.isAfter(lastResetTime)) {
      lastResetTime.add(1, 'days');
    }

    const millisecondsUntilReset = lastResetTime.diff(now);
    return millisecondsUntilReset;
  }

  async function resetBreakTimes() {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const resetBreakTimeInSeconds = 35 * 60;
      await User.updateMany({}, { remainingBreakTime: resetBreakTimeInSeconds }, { session });
      const now = moment.tz(new Date(), 'Europe/' + location).toDate();
      const lastResetTimestampObj = await LastResetTimestamp.findOne().session(session);
      lastResetTimestampObj.timestamp = now;
      await lastResetTimestampObj.save({ session });
      logger.info(`${kleur.blue("Total break time for all accounts has been reset")}`);
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error occurred while resetting break times:', error);
    } finally {
      session.endSession();
    }
  }

  (async () => {
    const millisecondsUntilReset = await getMillisecondsUntilReset();
    setTimeout(() => {
      resetBreakTimes();
      setInterval(() => resetBreakTimes(), 24 * 60 * 60 * 1000);
    }, millisecondsUntilReset);
  })();

  router.post("/", async (req, res) => {
    req.session.message = "Breaks reset";
    await resetBreakTimes();
    io.emit('reload');
    // setTimeout(() => {
    // }, 25);
    res.sendStatus(200);
  });

  return router;
};

export default resetBreakTime;
