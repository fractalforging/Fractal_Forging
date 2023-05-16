'use strict';

import mongoose from 'mongoose';

const breakSlotsSchema = new mongoose.Schema({
  slots: {
    type: Number,
    required: true,
    default: 2
  }
});

const BreakSlots = mongoose.model('BreakSlots', breakSlotsSchema);

export default BreakSlots;
