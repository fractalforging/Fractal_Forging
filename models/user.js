const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: String, // Add the password field
    roles: { type: String, default: "user" },
});

// Add the passportLocalMongoose plugin
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
