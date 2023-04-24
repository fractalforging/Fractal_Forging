// routes/users.js
const express = require("express");
const router = express.Router();
const { isAdmin } = require("../middleware/authentication.js");
const User = require("../models/user");
const logger = require('./logger.js');
const kleur = require('kleur');

router.get("/", isAdmin, async (req, res, next) => {
  const users = await User.find({});
  const adminUsers = users.filter(user => user.roles === "admin");
  const normalUsers = users.filter(user => user.roles === "user");
  return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
});

router.put("/:userId", isAdmin, async (req, res, next) => {
  let userToUpdate;
  let actionUser;
  try {
    const isAdmin = req.query.isAdmin === "true";
    const users = await User.find({});
    const adminUsers = users.filter(user => user.roles === "admin");
    const normalUsers = users.filter(user => user.roles === "user");
    const userId = req.params.userId;
    userToUpdate = await User.findById(userId);
    actionUser = req.user; // Get the current logged-in user
    const newRole = req.body.role;
    await User.findByIdAndUpdate(userId, { roles: newRole });
    req.session.message = "Role changed";
    logger.warn(`${kleur.magenta(actionUser.username)} updated ${kleur.magenta(userToUpdate.username)}'s role to ${kleur.grey(newRole)}`);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  } catch (err) {
    req.session.message = "Error1";
    logger.error(`Error updating user ${kleur.magenta(userToUpdate.username)} role: ${err.message}`);
    logger.error(err);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  }
});

module.exports = router;
