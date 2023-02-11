const mongoose = require('mongoose');
const todoTaskSchema = new mongoose.Schema({
  // content: {
  //   type: String,
  //   required: true
  // },
  user: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
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
module.exports = mongoose.model('TodoTask', todoTaskSchema);