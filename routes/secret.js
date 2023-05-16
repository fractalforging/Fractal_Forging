'use strict';

import express from 'express';
import { Router } from 'express';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';
import User from '../models/user.js';
import { getBreakTrackerData, getBreakSlotsData } from './helperFunctions.js';

const router = Router();

// USER LANDING PAGE
router.get("/", isLoggedIn, async function (req, res, next) {
  const breakTracker = await getBreakTrackerData();
  const breakSlots = await getBreakSlotsData();
  const user = await User.findOne({ username: req.user.username});

  if (req.user.roles === "admin") {
    return res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker, breakSlots: breakSlots, user: user, currentUser: req.user});
  } else if (req.user.roles === "user") {
    return res.render("secret", { name: req.user.username, breakTracker: breakTracker, breakSlots: breakSlots, user: user, currentUser: req.user});
  }
});

// ADMIN LANDING PAGE
router.get("/secret_admin", isLoggedIn, isAdmin, async function (req, res, next) {
  const breakSlots = await getBreakSlotsData();
  const breakTracker = await getBreakTrackerData();
  if (req.user.roles === "admin") {
    return res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker, role: res.locals.role, breakSlots: breakSlots, currentUser: req.user});
  } /*else {
    return res.redirect("/secret_admin", { name: req.user.username, breakTracker: breakTracker, role: res.locals.role, breakSlots: breakSlots, currentUser: req.user });
  }*/
});

export default router;
