const mongoose = require('mongoose');
const breakTrackerSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('BreakTrack', breakTrackerSchema);