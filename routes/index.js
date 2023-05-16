'use strict';

import express from 'express';
const router = express.Router();
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';

// INDEX > LOGIN
router.get("/", async function (req, res, next) {
  return res.render("login");
});

// LOGIN
router.get("/login", async function (req, res, next) {
  return res.render("login");
});

// REGISTER FORM
router.get("/register", isAdmin, async function (req, res, next) {
  return res.render("register", { currentUser: req.user });
});

export default router;

