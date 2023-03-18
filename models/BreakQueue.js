const mongoose = require('mongoose');

const breakQueueSchema = new mongoose.Schema({
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
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'queued'],
        required: true,
        default: 'queued'
    }
});

module.exports = mongoose.model('BreakQueue', breakQueueSchema);
