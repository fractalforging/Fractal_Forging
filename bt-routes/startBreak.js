import { Router } from 'express';
import mongoose from 'mongoose';
import logger from '../routes/logger.js';
import kleur from 'kleur';


const router = Router();

const startBreak = (io, BreakTrack, User) => {
  router.post('/:id', async (req, res, next) => {
    const handleBreakStart = async (req, res, next, retryCount = 0) => {
      const breakId = req.params.id;
      const breakStartTimeStamp = new Date().toISOString();
      const session = await mongoose.startSession();

      session.startTransaction();
      try {
        const breakEntry = await BreakTrack.findOne({ _id: breakId }).session(session);
        if (!breakEntry) {
          logger.error(`Break entry with ID ${breakId} not found.`, { username: req.user.username });
          await session.abortTransaction();
          return res.status(404).send("Break entry not found.");
        }
        if (breakEntry.lock) {
          logger.error(`Break entry with ID ${breakId} is locked.`, { username: req.user.username });
          await session.abortTransaction();
          return res.status(409).send("Break entry is locked. Please try again.");
        }

        breakEntry.hasStarted = true;
        breakEntry.breakStartTimeStamp = breakStartTimeStamp;
        await breakEntry.save({ session });

        const user = await User.findOne({ username: req.user.username }).session(session);
        const breakDurationInSeconds = breakEntry.duration * 60;

        if (user.remainingBreakTime < breakDurationInSeconds) {
          logger.info(`${kleur.magenta(user.username)} tried to start a break without enough remaining break time.`, { username: req.user.username });
          await session.abortTransaction();
          return res.status(400).send("Not enough remaining break time.");
        }

        req.session.message = 'Break started';
        user.remainingBreakTime -= breakDurationInSeconds;
        await user.save({ session });

        await session.commitTransaction();

        // Emit the 'reload' event here after confirming the break has started successfully
        io.emit('reload');
        
        logger.info(`${kleur.magenta(req.user.username)} started a break of ${breakEntry.duration} minutes`, { username: req.user.username });
        
        return res.status(200).send("Break status updated successfully.");
      } catch (error) {
        if (error.message.includes('WriteConflict') && retryCount < 5) {
          // If WriteConflict error, wait for 1 second then retry the operation
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await handleBreakStart(req, res, next, retryCount + 1);
        } else {
          await session.abortTransaction();
          logger.error(`Error occurred while starting the break: ${error}`, { username: req.user.username });
          return res.status(500).send("An error occurred.");
        }
      } finally {
        session.endSession();
      }
    };

    await handleBreakStart(req, res, next);
  });

  return router;
};

export default startBreak;
