const moment = require('moment-timezone');
const express = require('express');
const router = express.Router();

const resetBreakTimeRoutes = (User, io, location) => {
  async function resetBreakTimes() {
    const now = moment.tz(new Date(), 'Europe/' + location).toDate();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const resetBreakTimeInSeconds = 35 * 60;
    if (now > startOfDay) {
      await User.updateMany({}, { remainingBreakTime: resetBreakTimeInSeconds });
    }
  }

  const resetTime = moment.tz(new Date(), 'Europe/' + location).toDate();
  resetTime.setHours(23, 0, 0, 0);
  const millisecondsUntilReset = resetTime.getTime() - moment.tz(new Date(), 'Europe/' + location).toDate().getTime();
  setTimeout(() => {
    resetBreakTimes();
    io.emit('reload');
    setInterval(resetBreakTimes, 24 * 60 * 60 * 1000); // Set interval to run every 24 hours
  }, millisecondsUntilReset);

  router.post("/", async (req, res, next) => {
    await resetBreakTimes();
    io.emit('reload');
    res.sendStatus(200);
  });

  return router;
};

module.exports = resetBreakTimeRoutes;
