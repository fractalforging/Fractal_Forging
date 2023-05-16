import express from 'express';
import { Router } from 'express';
import logger from '../routes/logger.js';

const router = Router();

const endBreak = (BreakTrack) => {
  router.post("/:id/end", async (req, res, next) => {
    const id = req.params.id;
    try {
      await BreakTrack.findByIdAndUpdate(id, { hasEnded: true });

      res.sendStatus(200);
    } catch (err) {
      logger.error("Error updating hasEnded field: ", err);
      res.sendStatus(500);
    }
  });

  return router;
};

export default endBreak;
