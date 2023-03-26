const BreakTracker = require('../models/BreakTrack.js');
const BreakSlots = require('../models/BreakSlots.js');

async function getBreakTrackerData() {
  try {
    const breakTracker = await BreakTracker.find({});
    return breakTracker;
  } catch (error) {
    console.error('Error retrieving break tracker data:', error);
    return [];
  }
}

async function getBreakSlotsData() {
  try {
    const breakSlots = await BreakSlots.findOne({});
    return breakSlots;
  } catch (error) {
    console.error('Error retrieving break slots data:', error);
    return null;
  }
}

module.exports = {
  getBreakTrackerData,
  getBreakSlotsData,
};
