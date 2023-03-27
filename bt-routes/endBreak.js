const express = require('express');
const router = express.Router();
const logger = require('../serverjs/logger.js');

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

module.exports = endBreak;
