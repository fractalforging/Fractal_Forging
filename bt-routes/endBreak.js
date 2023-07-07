import { Router } from 'express';
import logger from '../routes/logger.js';

const router = Router();

const endBreak = (BreakTrack) => {
  router.post("/:id/end", async (req, res, next) => {
    const id = req.params.id;
    try {
      const breakToEnd = await BreakTrack.findById(id);
      if (!breakToEnd) {
        logger.error(`Break entry with ID ${id} not found.`, { username: req.user.username });
        return res.status(404).send("Break entry not found.");
      }
      
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
