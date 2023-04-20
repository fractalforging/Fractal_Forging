const mongoose = require('mongoose');

const lastResetTimestampSchema = new mongoose.Schema({
  timestamp: Date
});

const LastResetTimestamp = mongoose.model('LastResetTimestamp', lastResetTimestampSchema);
module.exports = LastResetTimestamp;
