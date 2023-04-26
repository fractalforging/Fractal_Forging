const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: String,
    roles: { type: String, default: "user" },
    remainingBreakTime: { type: Number, default: 35 * 60 },
    isOnline: { type: Boolean, default: false },
    socketId: { type: String, default: null },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
