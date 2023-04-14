const moment = require('moment-timezone');
const express = require('express');
const router = express.Router();

const resetBreakTimeRoutes = (User, io, location) => {
  const resetHour = 22;
  async function resetBreakTimes() {
    const now = moment.tz(new Date(), 'Europe/' + location).toDate();
    if (now.getHours() >= resetHour) {
      const resetBreakTimeInSeconds = 35 * 60;
      await User.updateMany({}, { remainingBreakTime: resetBreakTimeInSeconds });
    }
  }

  const resetTime = moment.tz(new Date(), 'Europe/' + location).toDate();
  resetTime.setHours(resetHour, 0, 0, 0);
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
