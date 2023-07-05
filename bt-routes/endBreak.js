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
      logger.error("Error updating hasEnded field: ", err, { username: req.user.username });
      res.sendStatus(500);
    }
  });

  return router;
};

export default endBreak;
