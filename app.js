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
const consoleStamp = require('console-stamp');
const moment = require('moment-timezone');
const logger = require('./serverjs/logger.js');
const kleur = require('kleur');

// EXPRESS WEB SERVER CONFIGURATION
const app = express();
app.set('views', 'pages');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// ENVIRONMENT VARIABLES
const dotenv = require("dotenv")
dotenv.config({ path: "variables.env" });
const dbPath = process.env.DB_PATH;
const port = process.env.PORT;
const location = process.env.LOCATION

//SOCKET.IO BROADCASTING CHANGES
const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
  serveClient: true
});

app.get('/socket.io/socket.io.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'node_modules', 'socket.io', 'client-dist', 'socket.io.js'));
});

io.on('connection', (socket) => {
  //logger.warn('A user connected');
  socket.on('reload', () => {
    //logger.warn('Reload event received');
    io.emit('reload');
  });
  socket.on('disconnect', () => {
    //logger.warn('A user disconnected');
  });
});

//=====================
// DATABASE
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

mongoose.connect(dbPath, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    logger.info("MongoDB connected successfully!");
    createAdminUser();
    server.listen(port, () => logger.info(`Server Up and running on port: ${port}`));
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
  });


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
// MIDDLEWARE
//=====================

// Check if logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// Check if user is an admin
async function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.roles === "admin") {
    return next();
  } else {
    return res.redirect('/secret');
  }
}

// Fetch break tracker data
async function getBreakTrackerData() {
  const breakTracker = await BreakTrack.find();
  return breakTracker;
}

// Fetch break slots data
async function getBreakSlotsData() {
  try {
    let breakSlots = await BreakSlots.findOne({});
    if (!breakSlots) {
      breakSlots = new BreakSlots();
      await breakSlots.save();
    }
    return breakSlots;
  } catch (err) {
    logger.error(err);
    return null;
  }
}

//=====================
// ROUTES
//=====================

// SERVER SCRIPTS
const apiMessages = require('./serverjs/apiMessages.js');

// API MESSAGES FOR MODAL MESSAGING
app.get('/api/messaging', apiMessages.myMessages);

// CLEAR SESSION VARIABLES FOR MODAL MESSAGING
app.post('/clear-message', function (req, res, next) {
  req.session.loggedIn = undefined;
  req.session.passChange = undefined;
  req.session.newAccount = undefined;
  req.session.message = undefined;
  req.session.roleChange = undefined;
  req.session.slotsAvailable = undefined;
  return res.sendStatus(204);
});

// INDEX > LOGIN
app.get("/", function (req, res, next) {
  return res.render("login");
});

// LOGIN
app.get("/login", function (req, res, next) {
  return res.render("login");
});

// USER LANDING PAGE
app.get("/secret", isLoggedIn, async function (req, res, next) {
  const breakTracker = await getBreakTrackerData();
  const breakSlots = await getBreakSlotsData();
  const user = await User.findOne({ username: req.user.username });

  if (req.user.roles === "admin") {
    return res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker, breakSlots: breakSlots, user: user });
  } else if (req.user.roles === "user") {
    return res.render("secret", { name: req.user.username, breakTracker: breakTracker, breakSlots: breakSlots, user: user });
  }
});

// ADMIN LANDING PAGE
app.get("/secret_edit/:id", isAdmin, async function (req, res, next) {
  const foundBreakTrack = await BreakTrack.findById(req.params.id);
  return res.render("secret_edit", {
    name: req.user.username,
    breakTracker: foundBreakTrack,
  });
});

// REGISTER FORM
app.get("/register", isAdmin, function (req, res, next) {
  return res.render("register");
});

// HANDLING USER REGISTRATION
app.post("/register", isAdmin, async function (req, res, next) {
  try {
    // Get the current break slots value from the database
    const breakSlots = await BreakSlots.findOne({});
    const { UserExistsError } = require('passport-local-mongoose');
    // Confirm password
    if (req.body.password !== req.body.confirmpassword) {
      req.session.newAccount = "Mismatch";
      logger.error("Password and confirm password do not match");
      return res.render("register", { error: "Password and confirm password do not match" });
    }
    User.register(
      { username: req.body.username, roles: "user", breakSlots: breakSlots },
      req.body.password,
      function (err, user) {
        if (err) {
          logger.error("Error:", err, typeof err);
          if (err.name === 'UserExistsError') {
            req.session.newAccount = "Taken";
            return res.render("register", { error: 'Username taken' });
          } else if (err.name === 'MissingUsernameError') {
            req.session.newAccount = "NoUser";
            return res.render("register", { error: 'No username given' });
          } else if (err.name === 'MissingPasswordError') {
            req.session.newAccount = "NoPass";
            return res.render("register", { error: 'No password given' });
          } else {
            req.session.newAccount = "Error";
            return res.render("register", { error: 'Error creating user' });
          }
        }
        logger.info(user);
        req.session.newAccount = "Ok";
        return res.redirect("/secret_admin");
      }
    );
    logger.warn("Resgistered new user: ", req.body.username);
    //console.log(req.body.password);
  } catch (error) {
    logger.error(error);
    res.status(500).send('Internal server error');
  }
});

// HANDLING USER LOGIN
app.post('/login', async function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    req.session.username = req.body.username;
    req.session.loggedIn = "true";
    if (err) {
      req.session.loggedIn = "error1";
      logger.error('An error1 occurred while logging in:', err);
      return res.render("login", { message: "An error occurred while logging in" });
    }
    if (!user) {
      req.session.loggedIn = "false";
      logger.error('Incorrect username or password');
      return res.render("login", { message: "Incorrect email or password" });
    }
    if (err || !user) {
      req.session.loggedIn = "errorx";
      return;
    }
    req.logIn(user, function (err) {
      if (err) {
        req.session.loggedIn = "error2";
        logger.error('An error2 occurred while logging in:', err);
        return res.render("login", { message: "An error occurred while logging in" });
      }
      logger.warn('Login successful for user: ' + kleur.magenta(user.username));
      req.session.loggedIn = "true";
      return res.redirect("secret");
    });
  })(req, res, next);
});

// HANDLING PASSWORD CHANGE
app.post("/changepassword", isLoggedIn, function (req, res, next) {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err || !user) {
      req.session.passChange = "Error";
      logger.error(err || "User not found");
      return res.render("account", { error: "Error, please try again", currentUser: req.user });
    }

    // Check if current password is empty
    if (!req.body.currentpassword) {
      req.session.passChange = "Wrong";
      logger.error("Current password empty");
      return res.render("account", { error: "Current password empty!", currentUser: req.user });
    }

    // Confirm new password
    if (req.body.newpassword !== req.body.confirmpassword) {
      req.session.passChange = "Mismatch";
      console.log("New password and confirm password do not match");
      return res.render("account", { error: "New password and confirm password do not match", currentUser: req.user });
    }

    // Check if current password matches
    user.authenticate(req.body.currentpassword, (err, valid) => {
      if (err || !valid) {
        req.session.passChange = "Wrong";
        logger.error("Current password wrong 2");
        return res.render("account", { error: "Current password incorrect!", currentUser: req.user });
      }
      // Update password
      user.setPassword(req.body.newpassword, (err) => {
        if (err) {
          req.session.passChange = "Error";
          logger.error(err);
          return res.render("account", { error: "Error, please try again", currentUser: req.user });
        }
        user.save((err) => {
          if (err) {
            req.session.passChange = "Error";
            logger.error(err);
            return res.render("account", { error: "Error, please try again", currentUser: req.user });
          }
          req.logIn(user, (err) => {
            if (err) {
              req.session.passChange = "Error";
              logger.error(err);
              return res.render("account", { error: "Error, please try again", currentUser: req.user });
            }
            req.session.passChange = "Changed";
            logger.warn("Password change for " + `${kleur.magenta(user.username)}` + " was successfull");
            return res.redirect("/secret");
          });
        });
      });
    });
  });
});

//HANDLING USER LOGOUT
app.get("/logout", function (req, res, next) {
  const username = req.user.username; // Get the username from the user object
  req.logout(function (err) {
    if (err) {
      logger.error(err);
    }
    logger.warn('Logout successful for user: ' + kleur.magenta(username)); // Use the username obtained from the user object
    req.session.destroy(function (err) {
      if (err) {
        logger.error(err);
      }
      return res.redirect("/");
    });
  });
});

//HANDLING ACCOUNT
app.get("/account", isLoggedIn, function (req, res, next) {
  return res.render("account", { error: 'no error', currentUser: req.user });
});

//HANDLING ADMINS
app.get("/secret_admin", isLoggedIn, isAdmin, async function (req, res, next) {
  const breakSlots = await getBreakSlotsData();
  const breakTracker = await getBreakTrackerData();
  if (req.user.roles === "admin") {
    return res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker, role: res.locals.role, breakSlots: breakSlots });
  } else {
    return res.redirect("/secret_admin", { name: req.user.username, breakTracker: breakTracker, role: res.locals.role, breakSlots: breakSlots });
  }
});

app.use(function (req, res, next) {
  res.locals.user = req.user;
  return next();
});

// SLOTS AVAILABLE
app.post("/break-slots", isAdmin, async function (req, res, next) {
  try {
    const newSlotsValue = req.body.slotsavailable;
    // Fetch the current number of available slots from the database
    const currentSlots = await BreakSlots.findOne();
    // Check if the selected number of available slots is the same as the current number
    if (newSlotsValue != currentSlots.slots) {
      // Update the break slots value in the database
      const breakSlots = await BreakSlots.findOneAndUpdate(
        {},
        { $set: { slots: newSlotsValue } },
        { new: true, upsert: true }
      );
      req.session.slotsAvailable = "Updated";
      io.emit('reload');
      logger.info(`${kleur.magenta(req.user.username)} updated the available slots to: ${newSlotsValue}`);
      // Render the updated slots value in the secret_admin page
      return res.redirect("secret_admin");
    } else if (newSlotsValue == currentSlots.slots) { // <-- Updated condition
      req.session.slotsAvailable = "Same value";
      logger.error("Slots were NOT updated, same value chosen");
      return res.redirect("secret_admin");
    }
  } catch (error) {
    logger.error(error);
    req.session.slotsAvailable = "Error";
    return res.redirect("secret_admin");
  }
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
    logger.warn(`${kleur.magenta(actionUser.username)} updated ${kleur.magenta(userToUpdate.username)}'s role to ${newRole}`);
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

  // Check if the user has enough remaining break time
  const currentUser = await User.findOne({ username: user });
  const breakDurationInSeconds = breakDuration * 60;
  if (currentUser.remainingBreakTime < breakDurationInSeconds) {
    if (currentUser.remainingBreakTime === 0) {
      req.session.message = 'Break time over';
    } else {
      req.session.message = 'Not enough';
    }
    logger.info(req.session.message);
    return res.redirect("/secret");
  }

  if (latestBreak && !latestBreak.endTime) {
    req.session.message = 'Only 1 break at a time';
    logger.info(req.session.message);
    return res.redirect("/secret");
  } else {
    req.session.message = 'Break submitted';
    // Update the user's remaining break time
    currentUser.remainingBreakTime -= breakDurationInSeconds;
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

// RESET BREAK MINUTES AFTER MIDNIGHT TO 35 MINUTES
async function resetBreakTimes() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const resetBreakTimeInSeconds = 35 * 60;
  if (now > midnight) {
    await User.updateMany({}, { remainingBreakTime: resetBreakTimeInSeconds });
  }
}
const resetTime = new Date();
resetTime.setHours(23, 0, 0, 0);
const millisecondsUntilReset = resetTime.getTime() - Date.now();
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

//UPDATE
app.route("/edit/:id").get((req, res, next) => {
  const id = req.params.id;
  BreakTrack.find({}, (err, breaks) => {
    return res.render("secret_edit.ejs", {
      breakTracker: breaks,
      idBreak: id,
      name: req.user.username
    });
  });
})
  .post((req, res, next) => {
    const id = req.params.id;
    io.emit('reload');
    BreakTrack.findByIdAndUpdate(
      id,
      {
        content: req.body.content,
      },
      (err) => {
        if (err) return res.send(500, err);
        return res.redirect("/secret");
      }
    );
  });

// START BUTTON FOR BREAKS
app.post('/breaks/start/:id', isLoggedIn, (req, res, next) => {
  const breakId = req.params.id;
  const breakStartTimeStamp = new Date().toISOString(); // Get the current timestamp
  BreakTrack.findOneAndUpdate({ _id: breakId }, { hasStarted: true, breakStartTimeStamp: breakStartTimeStamp }, (err, breakEntry) => {
    if (err) {
      logger.error(err);
      res.status(500).send("An error occurred while updating the break status.");
    } else {
      //io.emit('reload');
      logger.info(`${kleur.magenta(req.user.username)} confirmed a break of ${breakEntry.duration} minute(s)`);
      res.status(200).send("Break status updated successfully.");
    }
  });
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
    console.error("Error removing the break: ", err);
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
    console.error("Error updating hasEnded field: ", err);
    res.sendStatus(500);
  }
});
