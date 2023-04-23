const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/authentication.js');

router.get("/", isLoggedIn, async function (req, res, next) {
  return res.render('settings', { currentUser: req.user });
});

module.exports = router;
