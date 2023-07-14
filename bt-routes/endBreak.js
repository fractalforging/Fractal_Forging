import { Router } from 'express';
import logger from '../routes/logger.js';

const router = Router();

const endBreak = (BreakTrack) => {
  router.post("/:id/end", async (req, res, next) => {
    const id = req.params.id;
    try {
      const breakToEnd = await BreakTrack.findById(id);
      breakToEnd.hasEnded = true;
      breakToEnd.endTime = new Date().toISOString();
      await breakToEnd.save();
      
      res.sendStatus(200);
    } catch (err) {
      // Log the full error object
      console.error("Full error object: ", err);

      // Log the error message, name and stack trace separately
      console.error("Error name: ", err.name);
      console.error("Error message: ", err.message);
      console.error("Error stack: ", err.stack);

      logger.error("Error updating hasEnded field: ", err, { username: req.user.username });
      res.sendStatus(500);
    }
  });

  return router;
};

export default endBreak;
