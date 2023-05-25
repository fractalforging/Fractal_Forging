import { Router } from "express";
import { isAdmin } from "../middleware/authentication.js";
import User from "../models/user.js";
import logger from './logger.js';
import kleur from 'kleur';

const usersRoute = Router();

usersRoute.get("/", isAdmin, async (req, res, next) => {
  try {
    const users = await User.find({});
    const adminUsers = users.filter(user => user.roles === "admin");
    const normalUsers = users.filter(user => user.roles === "user");
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  } catch (err) {
    logger.error(err);
    return res.status(500).json({ error: "Error retrieving users" });
  }
});

usersRoute.put("/:userId", isAdmin, async (req, res, next) => {
  const session = await User.startSession();
  session.startTransaction();

  try {
    const isAdmin = req.query.isAdmin === "true";
    const users = await User.find({});
    const adminUsers = users.filter(user => user.roles === "admin");
    const normalUsers = users.filter(user => user.roles === "user");
    const userId = req.params.userId;
    const newRole = req.body.role;
    const userToUpdate = await User.findById(userId).session(session);
    const actionUser = req.user;
    await User.findByIdAndUpdate(userId, { roles: newRole }).session(session);
    await session.commitTransaction();
    session.endSession();
    req.session.message = "Role changed";
    logger.warn(`${kleur.magenta(actionUser.username)} updated ${kleur.magenta(userToUpdate.username)}'s role to ${kleur.grey(newRole)}`);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    logger.error(err);
    return res.status(500).json({ error: "Error updating user role" });
  }
});

export default usersRoute;
