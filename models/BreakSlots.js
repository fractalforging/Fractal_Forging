const mongoose = require('mongoose');

const breakSlotsSchema = new mongoose.Schema({
  slots: {
    type: Number,
    required: true,
    default: 2
  }
});

module.exports = mongoose.model('BreakSlots', breakSlotsSchema);
