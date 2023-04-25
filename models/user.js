const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: String, 
    roles: { type: String, default: "user" },
    remainingBreakTime: { type: Number, default: 35 * 60 },
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
