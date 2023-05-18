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

import { isLoggedIn } from './middleware/authentication.js';
import indexRoute from './routes/index.js';
import loginRoute from './routes/login.js';
import logoutRoute from './routes/logout.js';
import secretRoute from './routes/secret.js';
import registerRoute from './routes/register.js';
import changepasswordRoute from './routes/changepassword.js';
import usersRoute from './routes/users.js';
import deleteRoute from './routes/delete.js';
import changeTimeRoute from './routes/changeTime.js';
import resetPasswordRoute from './routes/resetPassword.js';
import changeNameRoute from './routes/changeName.js';
import settingsRoute from './routes/settings.js';
import myMessagesRoute from './routes/apiMessages.js';
import healthCheckRoute from './routes/healthCheck.js';

// BT ROUTES
import submitBreakRoute from './bt-routes/submitBreak.js';
import breakSlotsRoute from './bt-routes/break-slots.js';
import startBreakRoute from './bt-routes/startBreak.js';
import removeBreakRoute from './bt-routes/removeBreak.js';
import endBreakRoute from './bt-routes/endBreak.js';
import resetBreakTimeRoute from './bt-routes/resetBreakTime.js';

//=====================
// APPLY ROUTES

app.use("/", indexRoute);
app.use("/login", loginRoute);
app.use("/logout", logoutRoute);
app.use("/secret", secretRoute);
app.use("/secret_admin", secretRoute);
app.use("/register", registerRoute);
app.use("/changepassword", changepasswordRoute);
app.use("/users", usersRoute);
app.use('/delete', deleteRoute);
app.use('/timechange', changeTimeRoute);
app.use('/resetpassword', resetPasswordRoute);
app.use('/namechange', changeNameRoute);
app.use('/settings', settingsRoute);
app.get('/api/messaging', myMessagesRoute);
app.get('/health', healthCheckRoute);

//====================================
// APPLY BT ROUTES + SOCKET.IO CONFIG.

import setupSockets from './config/socket.js';
let io;
(async () => {
  io = await setupSockets(server, app);
  app.use("/break-slots", breakSlotsRoute(io, BreakTrack, User));
  app.use('/submit', submitBreakRoute(io, BreakTrack, User));
  app.use('/breaks/start', isLoggedIn, startBreakRoute(io, BreakTrack, User));
  app.use('/remove', removeBreakRoute(io, BreakTrack, User));
  app.use('/breaks', endBreakRoute(BreakTrack));
  app.use('/resetbreaktime', resetBreakTimeRoute(io, User, location));
})();

//=====================
// CLEAR SESSION VARIABLES FOR MODAL MESSAGING

app.post('/clear-message', async (req, res, next) => {
  delete req.session.message;
  return res.sendStatus(204);
});

//=====================
// ERROR HANDLING

app.use(async (err, req, res, next) => {
  logger.error(err.stack);
  req.session.message = "Something broke";
  return res.redirect("/");
});

//=====================
// START SERVER

server.listen(port, () => logger.info(`Server Up and running on port: ${kleur.grey(port)}`));