const mongoose = require("mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require('../models/user');
const express = require("express");
const http = require('http');
const app = express();
const server = http.createServer(app);
const firstRun = require("../models/firstRun.js");
const logger = require('../routes/logger.js');
const kleur = require('kleur');

module.exports = {
  connectMongoDB: async function (dbPath) {
    try {
      mongoose.set('strictQuery', false); 
      await mongoose.connect(dbPath, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      logger.info("MongoDB connected successfully!");
      await firstRun();
    } catch (err) {
      logger.error("MongoDB connection error:", err);
    }
  },
  initialize: function () {
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
  }
}
