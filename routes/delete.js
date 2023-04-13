const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const { isAdmin } = require('../middleware/authentication.js');
const logger = require('../serverjs/logger.js');
const kleur = require('kleur');

router.delete('/:id', isAdmin, async (req, res, next) => {
  console.log("Delete route triggered");
  let userId;
  let userToDelete;
  try {
    const users = await User.find({});
    const adminUsers = users.filter(user => user.roles === 'admin');
    const normalUsers = users.filter(user => user.roles === 'user');
    userId = req.params.id;
    userToDelete = await User.findById(userId);
    await User.findByIdAndDelete(userId);
    req.session.message = "Deleted";
    const adminUser = req.user; // get the admin user who deleted the account
    logger.warn(`User ${kleur.magenta(userToDelete.username)} deleted by ${kleur.magenta(adminUser.username)}`);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  } catch (err) {
    req.session.message = "Error2";
    logger.error(`Error deleting user ${kleur.magenta(userToDelete.username)}: ${err.message}`);
    logger.error(err);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  }
});

module.exports = router;
