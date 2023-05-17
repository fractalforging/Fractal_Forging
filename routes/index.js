'use strict';

import express from 'express';
import { isLoggedIn, isAdmin } from '../middleware/authentication.js';

const indexRoute = express.Router();

// INDEX > LOGIN
indexRoute.get("/", (req, res) => {
  return res.render("login");
});

// LOGIN
indexRoute.get("/login", (req, res) => {
  return res.render("login");
});

// REGISTER FORM
indexRoute.get("/register", isLoggedIn, isAdmin, (req, res) => {
  return res.render("register", { currentUser: req.user });
});

export default indexRoute;
