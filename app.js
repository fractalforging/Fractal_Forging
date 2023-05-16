//=====================
// IMPORTS

'use strict';

import express from 'express';
import logger from './routes/logger.js';
import dotenv from "dotenv";
import kleur from 'kleur';
import http from 'http';
import compression from 'compression';
const app = express();
const server = http.createServer(app);
app.use(compression());

//=====================
// ENVIRONMENT VARIABLES

dotenv.config({ path: "variables.env" });
const dbPath = process.env.DB_PATH;
const port = process.env.PORT;
const location = process.env.LOCATION;
const secret = process.env.SECRET;

if (!dbPath) {
  logger.error(
    "Error: No database path found in environment variables. Make sure to set the DB_PATH variable in your .env file."
  );
  process.exit(1);
}

//=====================
// MONGODB CONFIG.

// Import Models
import User from './models/user.js';
import BreakTrack from "./models/BreakTrack.js";

// Initialization
import database from './config/database.js';
database.connectMongoDB(dbPath);
database.initialize();

//=====================
// SESSION CONFIG. 

import { sessionConfig } from './config/session.js';
sessionConfig(app, dbPath, secret);

//=====================
// MIDDLEWARE & ROUTES

import { isLoggedIn, isAdmin } from './middleware/authentication.js';
import indexRoutes from './routes/index.js';
import loginRoutes from './routes/login.js';
import logoutRoutes from './routes/logout.js';
import secretRoutes from './routes/secret.js';
import registerRoutes from './routes/register.js';
import changepasswordRoutes from './routes/changepassword.js';
import usersRoutes from './routes/users.js';
import deleteRoutes from './routes/delete.js';
import resetPasswordRoute from './routes/resetPassword.js';
import changeTimeRouter from './routes/changeTime.js';
import settingsRoutes from './routes/settings.js';
import myMessages from './routes/apiMessages.js';
import healthCheck from './routes/healthCheck.js';

// BT ROUTES
import submitBreaks from './bt-routes/submitBreak.js';
import breakSlotsRoutes from './bt-routes/break-slots.js';
import startBreak from './bt-routes/startBreak.js';
import removeBreak from './bt-routes/removeBreak.js';
import endBreak from './bt-routes/endBreak.js';
import resetBreakTime from './bt-routes/resetBreakTime.js';

//=====================
// APPLY ROUTES

app.use("/", indexRoutes);
app.use("/login", loginRoutes);
app.use("/logout", logoutRoutes);
app.use("/secret", secretRoutes);
app.use("/secret_admin", secretRoutes);
app.use("/register", registerRoutes);
app.use("/account", changepasswordRoutes);
app.use("/changepassword", changepasswordRoutes);
app.use("/users", usersRoutes);
app.use('/delete', deleteRoutes);
app.use('/resetpassword', resetPasswordRoute);
app.use('/timechange', changeTimeRouter);
app.use('/settings', settingsRoutes);
app.get('/api/messaging', myMessages);
app.get('/health', healthCheck);

//====================================
// APPLY BT ROUTES + SOCKET.IO CONFIG.

import setupSockets from './config/socket.js';
let io;
(async () => {
  io = await setupSockets(server, app);
  app.use("/break-slots", await breakSlotsRoutes(io, BreakTrack, User));
  app.use('/breaks/start', await isLoggedIn, await startBreak(io, BreakTrack, User));
  app.use('/submit', await submitBreaks(io, BreakTrack, User));
  app.use('/remove', await removeBreak(io, BreakTrack, User));
  app.use('/breaks', await endBreak(BreakTrack));
  app.use('/resetbreaktime', await resetBreakTime(io, User, location));
})();

//=====================
// CLEAR SESSION VARIABLES FOR MODAL MESSAGING

app.post('/clear-message', async function (req, res, next) {
  delete req.session.message;
  return res.sendStatus(204);
});

//=====================
// ERROR HANDLING

app.use(async function (err, req, res, next) {
  logger.error(err.stack);
  req.session.message = "Something broke";
  return res.redirect("/");
});

//=====================
// START SERVER

server.listen(port, () => logger.info(`Server Up and running on port: ${kleur.grey(port)}`));