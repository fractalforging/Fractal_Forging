'use strict';

import { Router } from 'express';
import User from '../models/user.js';
import { isAdmin } from '../middleware/authentication.js';
import logger from './logger.js';
import kleur from 'kleur';
import mongoose from 'mongoose';

const deleteRoute = Router();

deleteRoute.delete('/:id', isAdmin, async (req, res, next) => {
  console.log("Delete route triggered");
  let userId;
  let userToDelete;
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const users = await User.find({});
    const adminUsers = users.filter(user => user.roles === 'admin');
    const normalUsers = users.filter(user => user.roles === 'user');
    userId = req.params.id;
    userToDelete = await User.findById(userId).session(session);
    await User.findByIdAndDelete(userId).session(session);
    req.session.message = "Deleted";
    const adminUser = req.user; 
    logger.warn(`User ${kleur.magenta(userToDelete.username)} deleted by ${kleur.magenta(adminUser.username)}`, { username: req.user.username });
    await session.commitTransaction();
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  } catch (err) {
    await session.abortTransaction();
    req.session.message = "Error2";
    logger.error(`Error deleting user ${kleur.magenta(userToDelete.username)}: ${err.message}`, { username: req.user.username });
    logger.error(err, { username: req.user.username });
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  } finally {
    session.endSession();
  }
});

export default deleteRoute;
