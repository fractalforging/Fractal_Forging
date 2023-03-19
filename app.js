//=====================
// NODE.JS SETUP
//=====================

const path = require("path");
const passportLocalMongoose = require("passport-local-mongoose");
//const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");
const LocalStrategy = require("passport-local");
const moment = require('moment-timezone');


const serverTime = moment.tz(new Date(), 'Europe/Helsinki').format('ddd, DD MMM YYYY HH:mm:ss [GMT] ZZ');
const port = process.env.PORT || 3002;

const app = express();
app.set('views', 'pages');
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());


//=====================
// DATABASE
//=====================

// SCHEMAS
const createAdminUser = require("./models/firstRun");
const User = require('./models/user');
const BreakTrack = require("./models/BreakTrack");
const BreakSlots = require('./models/BreakSlots');
const BreakQueue = require('./models/BreakQueue');

// CONNECTION TO MONGODB
require("dotenv").config({ path: "mongodb.env" });
const dotenv = require("dotenv");
//const BreakTrack = require("./models/BreakTrack");

dotenv.config();
const dbPath = process.env.DB_PATH;

if (!dbPath) {
  console.error(
    "Error: No database path found in environment variables. Make sure to set the DB_PATH variable in your .env file."
  );
  process.exit(1);
}

mongoose.connect(
  dbPath,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("MongoDB connected successfully!");
    createAdminUser();
    app.listen(port, () => console.log("Server Up and running on port: ", port, "- Date: ", serverTime));
  }
);

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
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

// middleware functions that use UserSchema and User go here
app.use(
  require("express-session")({
    secret: "Rusty is a dog",
    resave: false,
    saveUninitialized: false,
  })
);

//

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

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
    console.log(err);
    return null;
  }
}

//=====================
// ROUTES
//=====================

// SERVER SCRIPTS
const apiMessages = require('./serverjs/apiMessages');

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
  if (req.user.roles === "admin") {
    return res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker, breakSlots: breakSlots });
  } else if (req.user.roles === "user") {
    return res.render("secret", { name: req.user.username, breakTracker: breakTracker, breakSlots: breakSlots });
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

// Handling user registration
app.post("/register", isAdmin, async function (req, res, next) {
  try {
    // Get the current break slots value from the database
    const breakSlots = await BreakSlots.findOne({});
    const { UserExistsError } = require('passport-local-mongoose');
    // Confirm password
    if (req.body.password !== req.body.confirmpassword) {
      req.session.newAccount = "Mismatch";
      console.log("Password and confirm password do not match");
      return res.render("register", { error: "Password and confirm password do not match" });
    }
    User.register(
      { username: req.body.username, roles: "user", breakSlots: breakSlots },
      req.body.password,
      function (err, user) {
        if (err) {
          console.log("Error:", err, typeof err);
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
        console.log(user);
        req.session.newAccount = "Ok";
        return res.redirect("/secret_admin");
      }
    );
    console.log("Resgistered new user: ", req.body.username);
    //console.log(req.body.password);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

//Handling user login
app.post('/login', async function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      req.session.loggedIn = "error1";
      console.log('An error1 occurred while logging in:', err);
      return res.render("login", { message: "An error occurred while logging in" });
    }
    if (!user) {
      req.session.loggedIn = "false";
      console.log('Incorrect username or password');
      return res.render("login", { message: "Incorrect email or password" });
    }
    if (err || !user) {
      req.session.loggedIn = "errorx";
      return;
    }
    req.logIn(user, function (err) {
      if (err) {
        req.session.loggedIn = "error2";
        console.log('An error2 occurred while logging in:', err);
        return res.render("login", { message: "An error occurred while logging in" });
      }
      console.log('Login successful for user:', user.username);
      req.session.username = req.body.username;
      req.session.loggedIn = "true";
      return res.redirect("secret");
    });
  })(req, res, next);
});

// Handling password change
app.post("/changepassword", isLoggedIn, function (req, res, next) {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err || !user) {
      req.session.passChange = "Error";
      console.log(err || "User not found");
      return res.render("account", { error: "Error, please try again", currentUser: req.user });
    }

    // Check if current password is empty
    if (!req.body.currentpassword) {
      req.session.passChange = "Wrong";
      console.log("Current password empty");
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
        console.log("Current password wrong 2");
        return res.render("account", { error: "Current password incorrect!", currentUser: req.user });
      }
      // Update password
      user.setPassword(req.body.newpassword, (err) => {
        if (err) {
          req.session.passChange = "Error";
          console.log(err);
          return res.render("account", { error: "Error, please try again", currentUser: req.user });
        }
        user.save((err) => {
          if (err) {
            req.session.passChange = "Error";
            console.log(err);
            return res.render("account", { error: "Error, please try again", currentUser: req.user });
          }
          req.logIn(user, (err) => {
            if (err) {
              req.session.passChange = "Error";
              console.log(err);
              return res.render("account", { error: "Error, please try again", currentUser: req.user });
            }
            req.session.passChange = "Ok";
            console.log("Password change for " + `${user.username}` + " was successfull");
            return res.redirect("/secret");
          });
        });
      });
    });
  });
});

//Handling user logout
app.get("/logout", function (req, res, next) {
  const username = req.session.username; // Get the username from the session
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    console.log('Logout successful for user:', username); // Use the username obtained from the session
    req.session.destroy(function (err) {
      if (err) {
        console.log(err);
      }
      return res.redirect("/");
    });
  });
});

//Handling account
app.get("/account", isLoggedIn, function (req, res, next) {
  return res.render("account", { error: 'no error', currentUser: req.user });
});

//Handling Admins
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
    const newSlotsValue = req.body.duration;

    // Update the break slots value in the database
    const breakSlots = await BreakSlots.findOneAndUpdate(
      {},
      { $set: { slots: newSlotsValue } },
      { new: true, upsert: true }
    );

    req.session.slotsAvailable = "Updated";
    console.error("Slots were updated to:", newSlotsValue);

    // Render the updated slots value in the secret_admin page
    return res.render("secret_admin", {
      name: req.user.username,
      breakTracker: await getBreakTrackerData(),
      breakSlots: breakSlots
    });
  } catch (error) {
    console.error(error);
    req.session.slotsAvailable = "Error";
    return res.status(500).send('Internal server error');
  }
});


// START BUTTON FOR BREAKS
app.post('/breaks/start/:id', isLoggedIn, (req, res, next) => {
  const breakId = req.params.id;
  const breakStartTimeStamp = new Date().toISOString(); // Get the current timestamp

  BreakTrack.findOneAndUpdate({ _id: breakId }, { hasStarted: true, breakStartTimeStamp: breakStartTimeStamp }, (err, breakEntry) => {
    if (err) {
      console.error(err);
      res.status(500).send("An error occurred while updating the break status.");
    } else {
      res.status(200).send("Break status updated successfully.");
    }
  });
});

// USER'S PAGE
app.get('/users', isAdmin, async (req, res, next) => {
  const users = await User.find({});
  const adminUsers = users.filter(user => user.roles === 'admin');
  const normalUsers = users.filter(user => user.roles === 'user');
  return res.render('users', { adminUsers, normalUsers, currentUser: req.user });
});

// UPDATE USER'S ROLE
app.put('/users/:id', isAdmin, async (req, res, next) => {
  try {
    const users = await User.find({});
    const adminUsers = users.filter(user => user.roles === 'admin');
    const normalUsers = users.filter(user => user.roles === 'user');
    const userId = req.params.id;
    const newRole = req.body.role;
    await User.findByIdAndUpdate(userId, { roles: newRole });
    req.session.roleChange = "Role changed";
    console.log(`User ${userId} role updated to ${newRole}`);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  } catch (err) {
    req.session.roleChange = "Error1";
    console.error(`Error updating user ${userId} role: ${err.message}`);
    console.log(err);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  }
});

// DELETE request to delete a user
app.delete('/accounts/:id', isAdmin, async (req, res, next) => {
  let userId; // Define userId outside the try block
  try {
    const users = await User.find({});
    const adminUsers = users.filter(user => user.roles === 'admin');
    const normalUsers = users.filter(user => user.roles === 'user');
    userId = req.params.id;
    await User.findByIdAndDelete(userId);
    req.session.roleChange = "Deleted";
    console.log(`User ${userId} deleted`);
    return res.render("users", { adminUsers, normalUsers, currentUser: req.user });
  } catch (err) {
    req.session.roleChange = "Error2";
    console.error(`Error deleting user ${userId}: ${err.message}`);
    console.log(err);
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

// POST METHOD
app.post("/", async function (req, res, next) {
  const user = req.user.username;
  const latestBreak = await BreakTrack.findOne({ user }).sort({ startTime: -1 });
  if (latestBreak && !latestBreak.endTime) {
    req.session.message = 'Only 1 break at a time';
    console.log(req.session.message);
    return res.redirect("/secret");
  } else {
    req.session.message = 'Break submitted';
    console.log(req.session.message, "for", req.user.username);
    const breakTracker = new BreakTrack({
      user,
      startTime: new Date().toUTCString(),//serverTime, //new Date().toUTCString(),
      duration: req.body.duration,
      date: new Date().toUTCString(),//serverTime, //new Date().toUTCString(),
    });
    try {
      await breakTracker.save();
      return res.redirect("/secret");
    } catch (err) {
      return res.redirect("/secret");
    }
  } (req, res, next);
});

// CATCH ERRORS
app.use(function (err, req, res, next) {
  console.error(err.stack);
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

//DELETE
app.route("/remove/:id").get((req, res, next) => {
  const id = req.params.id;
  BreakTrack.findByIdAndRemove(id, (err) => {
    if (err) return res.send(500, err);
    return res.redirect("/secret");
  });
});

mongoose.set("strictQuery", false);

// KILL PORT PROCESSES kill -9 $(lsof -t -i:3000)
// netstat -ano | findstr :3002
// taskkill /F /PID 24860

