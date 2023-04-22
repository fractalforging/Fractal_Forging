const express = require('express');
const router = express.Router();
const logger = require('../serverjs/logger.js');

// const moveToNormalList = async (BreakTrack) => {
//   const availableSlotsData = await BreakSlots.findOne();
//   const availableSlots = availableSlotsData.slots;
//   const activeBreaks = await BreakTrack.countDocuments({ status: 'active' });

//   if (activeBreaks < availableSlots) {
//     const nextInQueue = await BreakTrack.findOne({ status: 'queued' }).sort({ date: 1 });

//     if (nextInQueue) {
//       nextInQueue.status = 'active';
//       await nextInQueue.save();
//     }
//   }
// };

const endBreak = (BreakTrack) => {
  router.post("/:id/end", async (req, res, next) => {
    const id = req.params.id;
    try {
      await BreakTrack.findByIdAndUpdate(id, { hasEnded: true });

      // Call the moveToNormalList function after ending a break
      // await moveToNormalList(BreakTrack);

      res.sendStatus(200);
    } catch (err) {
      logger.error("Error updating hasEnded field: ", err);
      res.sendStatus(500);
    }
  });

  return router;
};

module.exports = endBreak;
