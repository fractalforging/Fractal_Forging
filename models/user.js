'use strict';

import mongoose from 'mongoose';
import passportLocalMongoose from 'passport-local-mongoose';
import config from '../config.js';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: String,
  roles: { type: String, default: "user" },
  remainingBreakTime: { type: Number, default: config.breakTime.totalMinutes * 60 },
  isOnline: { type: Boolean, default: false },
  socketId: { type: String, default: null },
  lastHeartbeat: { type: Date, default: null },
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

export default User;
