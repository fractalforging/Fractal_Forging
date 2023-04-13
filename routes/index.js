const express = require('express');
const router = express.Router();
const { isLoggedIn, isAdmin } = require('../middleware/authentication');

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

module.exports = router;
