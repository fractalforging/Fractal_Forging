'use strict';

import mongoose from "mongoose";
import passport from "passport";
import LocalStrategy from "passport-local";
import User from '../models/user.js';
import firstRun from "./firstRun.js";
import logger from '../routes/logger.js';

const database = {
  connectMongoDB: async (dbPath) => {
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
  initialize: () => {
    passport.use(new LocalStrategy(User.authenticate()));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
  }
}

export default database;
