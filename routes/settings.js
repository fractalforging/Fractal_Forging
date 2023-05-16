'use strict';

import { Router } from 'express';
import { isLoggedIn } from '../middleware/authentication.js';

const router = Router();

router.get("/", isLoggedIn, async function (req, res, next) {
  return res.render('settings', { currentUser: req.user });
});

export default router;
