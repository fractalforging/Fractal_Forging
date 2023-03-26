//=====================
// NODE.JS SETUP
//=====================
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const bodyParser = require("body-parser");
const LocalStrategy = require("passport-local");
//const consoleStamp = require('console-stamp');
const moment = require('moment-timezone');
const logger = require('./serverjs/logger.js');
const kleur = require('kleur');
const dotenv = require("dotenv");
const http = require('http');
const { Server } = require('socket.io');

// ENVIRONMENT VARIABLES
dotenv.config({ path: "variables.env" });
const dbPath = process.env.DB_PATH;
const port = process.env.PORT;
const location = process.env.LOCATION;

// EXPRESS WEB SERVER CONFIGURATION
const app = express();
const server = http.createServer(app);
app.set('views', 'pages');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(
  require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

//SOCKET.IO BROADCASTING CHANGES
//const socket = require('./routes/socket.js')(app);

const io = new Server(server, {
  serveClient: true
});

app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist', 'socket.io.js'));
});

io.on('connection', (socket) => {
  socket.on('reload', () => {
    io.emit('reload');
  });
  socket.on('disconnect', () => {});
});

//=====================
// MONGODB DATABASE
//=====================

// SCHEMAS / MODELS
const createAdminUser = require("./models/firstRun");
const User = require('./models/user');
const BreakTrack = require("./models/BreakTrack");
const BreakSlots = require('./models/BreakSlots');
const BreakQueue = require('./models/BreakQueue');

// CONNECTION TO MONGODB
if (!dbPath) {
  logger.error(
    "Error: No database path found in environment variables. Make sure to set the DB_PATH variable in your .env file."
  );
  process.exit(1);
}

async function connectMongoDB() {
  try {
    await mongoose.connect(dbPath, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("MongoDB connected successfully!");
    await createAdminUser();
    server.listen(port, () => logger.info(`Server Up and running on port: ${port}`));
  } catch (err) {
    logger.error("MongoDB connection error:", err);
  }
}

connectMongoDB();

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
});

UserSchema.plugin(passportLocalMongoose);
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
module.exports = User;

//=====================
// MIDDLEWARE & ROUTES
//=====================

// SERVER SCRIPTS
const { isLoggedIn, isAdmin } = require('./middleware/authentication.js');
const indexRoutes = require('./routes/index');
const { getBreakTrackerData, getBreakSlotsData } = require('./serverjs/helperFunctions.js');
const loginRoutes = require('./routes/login.js');
const logoutRoutes = require('./routes/logout.js');
const secretRoutes = require('./routes/secret.js');
const registerRoutes = require('./routes/register.js');
const changepasswordRoutes = require('./routes/changepassword');
const breakSlotsRoutes = require('./routes/break-slots')(io);
const apiMessages = require('./serverjs/apiMessages.js');

// ROUTES
app.use("/", indexRoutes);
app.use("/login", loginRoutes);
app.use("/logout", logoutRoutes);
app.use("/secret", secretRoutes);
app.use("/secret_admin", secretRoutes);
app.use("/register", registerRoutes);
app.use("/account", changepasswordRoutes);
app.use("/break-slots", breakSlotsRoutes);
app.use("/changepassword", changepasswordRoutes);
app.get('/api/messaging', apiMessages.myMessages);

// CLEAR SESSION VARIABLES FOR MODAL MESSAGING
app.post('/clear-message', function (req, res, next) {
  delete req.session.loggedIn;
  delete req.session.passChange;
  delete req.session.newAccount;
  delete req.session.message;
  delete req.session.roleChange;
  delete req.session.slotsAvailable;
  return res.sendStatus(204);
});

// USER'S PAGE
app.get('/users', isAdmin, async (req, res, next) => {
  const users = await User.find({});
  const adminUsers = users.filter(user => user.roles === 'admin');
  const normalUsers = users.filter(user => user.roles === 'user');
  return res.render('users', { adminUsers, normalUsers, currentUser: req.user });
});

// MANAGING ACCOUNT ROLE
app.put('/users/:id', isAdmin, async (req, res, next) => {
  let userToUpdate;
  let actionUser;
  try {
    const isAdmin = req.query.isAdmin === 'true';
    const users = await User.find({});
    const adminUsers = users.filter(user => user.roles === 'admin');
    const normalUsers = users.filter(user => user.roles === 'user');
    const userId = req.params.id;
    userToUpdate = await User.findById(userId);
    actionUser = req.user; // Get the current logged-in user
    const newRole = req.body.role;
    await User.findByIdAndUpdate(userId, { roles: newRole });
    req.session.roleChange = "Role changed";
    logger.warn(`${kleur.magenta(actionUser.username)} updated ${kleur.magenta(userToUpdate.username)}'s role to ${kleur.grey(newRole)}`);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  } catch (err) {
    req.session.roleChange = "Error1";
    logger.error(`Error updating user ${kleur.magenta(userToUpdate.username)} role: ${err.message}`);
    logger.error(err);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  }
});

// DELETE ACCOUNT
app.delete('/accounts/:id', isAdmin, async (req, res, next) => {
  let userId; // Define userId outside the try block
  let userToDelete; // Define userToDelete outside the try block
  try {
    const users = await User.find({});
    const adminUsers = users.filter(user => user.roles === 'admin');
    const normalUsers = users.filter(user => user.roles === 'user');
    userId = req.params.id;
    userToDelete = await User.findById(userId);
    await User.findByIdAndDelete(userId);
    req.session.roleChange = "Deleted";
    logger.warn(`User ${userToDelete.username} deleted`);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  } catch (err) {
    req.session.roleChange = "Error2";
    logger.error(`Error deleting user ${kleur.magenta(userToDelete.username)}: ${err.message}`);
    logger.error(err);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  }
});

//=====================
// BREAK TRACKER
//=====================

// GET METHOD
app.get("/", (req, res, next) => {
  BreakTrack.find({}, (err, breaks) => {
    return res.render("secret.ejs", {
      breakTracker: breaks,
    });
  });
});

// SUBMIT BREAKS
app.post("/", async function (req, res, next) {
  const user = req.user.username;
  const latestBreak = await BreakTrack.findOne({ user }).sort({ startTime: -1 });
  const breakDuration = req.body.duration;
  const currentUser = await User.findOne({ username: user });
  const breakDurationInSeconds = breakDuration * 60;

  if (latestBreak && !latestBreak.endTime) {
    req.session.message = 'Only 1 break at a time';
    logger.info(req.session.message);
    return res.redirect("/secret");
  } else if (currentUser.remainingBreakTime < breakDurationInSeconds) {
    if (currentUser.remainingBreakTime === 0) {
      req.session.message = 'Break time over';
    } else {
      req.session.message = 'Not enough';
    }
    logger.info(req.session.message);
    return res.redirect("/secret");
  } else {
    req.session.message = 'Break submitted';
    // Update the user's remaining break time
    await currentUser.save(); // Save the updated remaining break time
    logger.info(`${kleur.magenta(user)} submitted a break of ${breakDuration} minute(s)`);
    io.emit('reload');
    const breakTracker = new BreakTrack({
      user,
      startTime: new Date().toUTCString(),
      duration: breakDuration,
      date: new Date().toUTCString(),
    });
    try {
      await breakTracker.save();
      return res.redirect("/secret");
    } catch (err) {
      return res.redirect("/secret");
    }
  }
});

// START BUTTON FOR BREAKS
app.post('/breaks/start/:id', isLoggedIn, async (req, res, next) => {
  const breakId = req.params.id;
  const breakStartTimeStamp = new Date().toISOString(); // Get the current timestamp
  const breakEntry = await BreakTrack.findOneAndUpdate({ _id: breakId }, { hasStarted: true, breakStartTimeStamp: breakStartTimeStamp }, { new: true });
  if (!breakEntry) {
    logger.error(`Break entry with ID ${breakId} not found.`);
    return res.status(404).send("Break entry not found.");
  }
  const user = await User.findOne({ username: req.user.username });
  const breakDurationInSeconds = breakEntry.duration * 60;
  if (user.remainingBreakTime < breakDurationInSeconds) {
    logger.info(`${kleur.magenta(user.username)} tried to start a break without enough remaining break time.`);
    return res.status(400).send("Not enough remaining break time.");
  }
  req.session.message = 'Break started';
  user.remainingBreakTime -= breakDurationInSeconds;
  await user.save();
  io.emit('reload');
  logger.info(`${kleur.magenta(req.user.username)} started a break of ${breakEntry.duration} minute(s)`);
  return res.status(200).send("Break status updated successfully.");
});

// REMOVE BREAKS
app.get("/remove/:id", async (req, res, next) => {
  const id = req.params.id;
  const beforeStart = req.query.beforeStart === 'true';
  const isAdmin = req.query.isAdmin === 'true';
  try {
    const breakToRemove = await BreakTrack.findById(id);
    const userToUpdate = await User.findOne({ username: breakToRemove.user });
    let actionUser = req.user; // Get the current logged-in user
    await BreakTrack.findByIdAndRemove(id);
    let logMessage = '';
    if (isAdmin) {
      logMessage = `admin removed ${kleur.magenta(userToUpdate.username)}'s break `;
    } else {
      logMessage = `${kleur.magenta(userToUpdate.username)} removed break `;
    }
    if (beforeStart) {
      io.emit('reload');
      logger.info(`${kleur.magenta(actionUser.username)} removed ${kleur.magenta(userToUpdate.username)}'s break before break start`);
    } else if (breakToRemove.hasStarted && !breakToRemove.hasEnded) {
      io.emit('reload');
      logger.info(`${kleur.magenta(actionUser.username)} removed ${kleur.magenta(userToUpdate.username)}'s break after break start`);
    } else {
      io.emit('reload');
      logger.info(`${kleur.magenta(actionUser.username)} removed ${kleur.magenta(userToUpdate.username)}'s break after break end`);
    }
    // logger.debug("beforeStart: " + beforeStart);
    // logger.debug("breakToRemove.hasStarted: " + breakToRemove.hasStarted);
    // logger.debug("breakToRemove.hasEnded: " + breakToRemove.hasEnded);
    return res.redirect("/secret");
  } catch (err) {
    logger.error("Error removing the break: ", err);
    return res.status(500).send(err);
  }
});

// BREAK ENDED
app.post("/breaks/:id/end", async (req, res, next) => {
  const id = req.params.id;
  try {
    await BreakTrack.findByIdAndUpdate(id, { hasEnded: true });
    res.sendStatus(200);
  } catch (err) {
    logger.error("Error updating hasEnded field: ", err);
    res.sendStatus(500);
  }
});

// RESET BREAK MINUTES AFTER 23:00 TO 35 MINUTES
async function resetBreakTimes() {
  const now = moment.tz(new Date(), 'Europe/' + location).toDate();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const resetBreakTimeInSeconds = 35 * 60;
  if (now > startOfDay) {
    await User.updateMany({}, { remainingBreakTime: resetBreakTimeInSeconds });
  }
}
const resetTime = moment.tz(new Date(), 'Europe/' + location).toDate();
resetTime.setHours(23, 0, 0, 0);
const millisecondsUntilReset = resetTime.getTime() - moment.tz(new Date(), 'Europe/' + location).toDate().getTime();
setTimeout(() => {
  resetBreakTimes();
  io.emit('reload');
  setInterval(resetBreakTimes, 24 * 60 * 60 * 1000); // Set interval to run every 24 hours
}, millisecondsUntilReset);

// CATCH ERRORS
app.use(function (err, req, res, next) {
  logger.error(err.stack);
  return res.status(500).send('Something broke!');
});