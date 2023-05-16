import mongoose from 'mongoose';

const lastResetTimestampSchema = new mongoose.Schema({
  timestamp: Date
});

const LastResetTimestamp = mongoose.model('LastResetTimestamp', lastResetTimestampSchema);
export default LastResetTimestamp;
