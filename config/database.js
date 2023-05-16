import mongoose from "mongoose";
import passport from "passport";
import LocalStrategy from "passport-local";
import User from '../models/user.js';
import express from "express";
import http from 'http';
import firstRun from "../models/firstRun.js";
import logger from '../routes/logger.js';
import kleur from 'kleur';

const app = express();
const server = http.createServer(app);

const database = {
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

export default database;
