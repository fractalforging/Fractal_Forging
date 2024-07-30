'use strict';

import moment from 'moment-timezone';
import express from 'express';
import logger from '../routes/logger.js';
import kleur from 'kleur';
import LastResetTimestamp from '../models/LastResetTimestamp.js';
import mongoose from 'mongoose';
import config from '../config.js';

const resetBreakTime = (io, User, location) => {
  const router = express.Router();
  const resetHour = config.breakTime.resetTime.hour;
  const resetMinute = config.breakTime.resetTime.minute;
  const isProduction = config.breakTime.environment === 'production';
  const isDevelopment = config.breakTime.environment === 'development';
  const developmentOverrideEnabled = isDevelopment && config.breakTime.developmentOverride.enabled;
  const developmentResetInterval = config.breakTime.developmentOverride.resetIntervalMinutes * 60 * 1000;

  async function getMillisecondsUntilReset() {
    let lastResetTimestampObj = await LastResetTimestamp.findOne();
    if (!lastResetTimestampObj) {
      lastResetTimestampObj = new LastResetTimestamp({ timestamp: new Date() });
      await lastResetTimestampObj.save();
      logger.info(kleur.yellow(`No last reset timestamp found. Created new timestamp: ${lastResetTimestampObj.timestamp}`));
    }
    const lastResetTimestamp = lastResetTimestampObj.timestamp;
    const now = moment.tz(new Date(), 'Europe/' + location);
    const lastResetTime = moment.tz(new Date(lastResetTimestamp), 'Europe/' + location);
  
    if (isDevelopment && developmentOverrideEnabled) {
      const nextResetTime = moment(lastResetTime).add(config.breakTime.developmentOverride.resetIntervalMinutes, 'minutes');
      if (now.isAfter(nextResetTime)) {
        logger.warn(kleur.yellow('Development override: Immediate reset needed.'));
        await resetBreakTimes(true);
        return config.breakTime.developmentOverride.resetIntervalMinutes * 60 * 1000;
      }
      const millisecondsUntilReset = nextResetTime.diff(now);
      logger.info(kleur.cyan(`Development override: Next reset scheduled for ${nextResetTime.format()} (in ${millisecondsUntilReset / 1000 / 60} minutes)`));
      return millisecondsUntilReset;
    }
  
    const nextResetTime = moment(now).set({ hour: resetHour, minute: resetMinute, second: 0, millisecond: 0 });
  
    if (isProduction) {
      if (now.isSame(lastResetTime, 'day') || now.isAfter(nextResetTime)) {
        nextResetTime.add(1, 'days');
      }
    } else if (isDevelopment) {
      if (now.isAfter(nextResetTime)) {
        logger.warn(kleur.yellow('Development: Immediate reset needed.'));
        await resetBreakTimes(true);
        nextResetTime.add(1, 'days');
      }
    }
  
    const millisecondsUntilReset = nextResetTime.diff(now);
    logger.info(kleur.cyan(`Next reset scheduled for ${nextResetTime.format()} (in ${millisecondsUntilReset / 1000 / 60} minutes)`));
    return millisecondsUntilReset;
  }

  async function resetBreakTimes(triggerReload = false) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const resetBreakTimeInSeconds = config.breakTime.totalMinutes * 60;
      const updateResult = await User.updateMany({}, { remainingBreakTime: resetBreakTimeInSeconds }, { session });
      const now = moment.tz(new Date(), 'Europe/' + location).toDate();
      const lastResetTimestampObj = await LastResetTimestamp.findOne().session(session);
      if (lastResetTimestampObj) {
        lastResetTimestampObj.timestamp = now;
        await lastResetTimestampObj.save({ session });
      } else {
        const newLastResetTimestamp = new LastResetTimestamp({ timestamp: now });
        await newLastResetTimestamp.save({ session });
      }
      await session.commitTransaction();
      logger.info(kleur.green(`Break time reset completed at ${now.toLocaleString()}. Updated ${updateResult.modifiedCount} users.`));
      
      if (triggerReload) {
        io.emit('reload');
        logger.info(kleur.blue('Reload signal sent to all clients.'));
      }
    } catch (error) {
      await session.abortTransaction();
      logger.error(kleur.red(`Error occurred while resetting break times: ${error.message}`));
    } finally {
      session.endSession();
    }
  }

  async function scheduleNextReset() {
    const millisecondsUntilReset = await getMillisecondsUntilReset();
    setTimeout(async () => {
      logger.info(kleur.magenta('Scheduled reset time reached. Initiating reset...'));
      await resetBreakTimes(true);
      scheduleNextReset();
    }, millisecondsUntilReset);
  }

  (async () => {
    logger.info(kleur.blue('Initializing break time reset scheduler...'));
    logger.info(kleur.blue(`Environment: ${config.breakTime.environment}`));
    if (developmentOverrideEnabled) {
      logger.info(kleur.blue(`Development override enabled. Reset interval: ${config.breakTime.developmentOverride.resetIntervalMinutes} minutes`));
    }
    await scheduleNextReset();
  })();

  router.post("/", async (req, res) => {
    logger.info(kleur.magenta('Manual reset requested.'));
    await resetBreakTimes(true);
    res.sendStatus(200);
  });

  return router;
};

export default resetBreakTime;