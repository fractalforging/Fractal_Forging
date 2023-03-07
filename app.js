//=====================
// NODE.JS SETUP
//=====================

const path = require("path");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");
const LocalStrategy = require("passport-local");
let port = process.env.PORT || 3002;

let app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//=====================
// DATABASE
//=====================

// SCHEMAS
const User = require("./models/user");
const BreakTrack = require("./models/BreakTrack");
const BreakSlots = require('./models/BreakSlots');

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
    app.listen(port, () => console.log("Server Up and running on port: ", port));
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

// Fetch break tracker data
async function getBreakTrackerData() {
  const breakTracker = await BreakTrack.find();
  return breakTracker;
}

// Fetch break slots data
async function getBreakSlotsData() {
  try {
    const breakSlots = await BreakSlots.findOne({});
    return breakSlots;
  } catch (err) {
    console.log(err);
    return null;
  }
}



// Check if user is an admin
async function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.roles === "admin") {
    const breakSlots = await getBreakSlotsData();
    const breakTracker = await getBreakTrackerData();
    res.locals.role = 'admin';
    return res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker, breakSlots: breakSlots });
  } else {
    res.locals.role = 'user';
    return next();
  }
}

//=====================
// ROUTES
//=====================

// INDEX > LOGIN
app.get("/", function (req, res) {
  return res.render("login");
});

// LOGIN
app.get("/login", function (req, res) {
  return res.render("login");
});

// USER LANDING PAGE
app.get("/secret", isLoggedIn, async function (req, res) {
  const breakTracker = await getBreakTrackerData();
  const breakSlots = await getBreakSlotsData();
  if (req.user.roles === "admin") {
    return res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker, breakSlots: breakSlots });
  } else if (req.user.roles === "user") {
    return res.render("secret", { name: req.user.username, breakTracker: breakTracker, breakSlots: breakSlots });
  }
});

// ADMIN LANDING PAGE
app.get("/secret_edit/:id", isLoggedIn, async function (req, res) {
  const foundBreakTrack = await BreakTrack.findById(req.params.id);
  return res.render("secret_edit", {
    name: req.user.username,
    breakTracker: foundBreakTrack,
  });
});

// Showing register form
app.get("/register", function (req, res) {
  return res.render("register");
});

// Handling user registration
app.post("/register", async function (req, res) {
  try {
    // Get the current break slots value from the database
    const breakSlots = await BreakSlots.findOne({});

    User.register(
      { username: req.body.username, roles: "user", breakSlots: breakSlots },
      req.body.password,
      function (err, user) {
        if (err) {
          console.log(err);
          if (err.name === 'MongoError' && err.code === 11000) {
            req.session.newAccount = "Taken";
            return res.render("register", { error: 'Username taken' });
          }
          req.session.newAccount = "Error";
          return res.render("register", { error: 'Error creating user' });
        }
        console.log(user);
        req.session.newAccount = "Ok";
        return res.redirect("/secret_admin");
      }
    );
    console.log(req.body.username);
    console.log(req.body.password);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

// Uer registration messages
app.get('/api/register', isLoggedIn, async function (req, res, next) {
  if (req.session.newAccount === "Ok") {
    return res.status(200).json({ message: 'Account registered!' });
  } else if (req.session.newAccount === "Taken") {
    return res.status(401).json({ message: 'Username taken' });
  } else if (req.session.newAccount === "Error") {
    return res.status(500).json({ message: 'Error! Try again.' });
  } else {
    // console.log("nothing");
    // res.status(200).json({ message: 'No message' });
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

// Login messages
app.get('/api/login', async function (req, res, next) {
  if (req.session.loggedIn === "true") {
    //return res.status(200).json({ message: 'Login successful!' });
  } else if (req.session.loggedIn === "false") {
    return res.status(401).json({ message: 'Wrong credentials!' });
  } else if (req.session.loggedIn === "error1") {
    return res.status(401).json({ message: 'Error1' });
  } else if (req.session.loggedIn === "error2") {
    return res.status(401).json({ message: 'error2' });
  } else if (req.session.loggedIn === "errorx") {
    return res.status(401).json({ message: 'errorx' });
  } else {
    //
  }
});

// Handling password change
app.post("/changepassword", isLoggedIn, function (req, res) {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err || !user) {
      req.session.passChange = "Error";
      console.log(err || "User not found");
      return res.render("account", { error: "Error, please try again" });
    }

    // Check if current password is empty
    if (!req.body.currentpassword) {
      req.session.passChange = "Wrong";
      console.log("Current password empty");
      return res.render("account", { error: "Current password empty!" });
    }

    // Check if current password matches
    user.authenticate(req.body.currentpassword, (err, valid) => {
      if (err || !valid) {
        req.session.passChange = "Wrong";
        console.log("Current password wrong 2");
        return res.render("account", { error: "Current password incorrect!" });
      }
      // Update password
      user.setPassword(req.body.newpassword, (err) => {
        if (err) {
          req.session.passChange = "Error";
          console.log(err);
          return res.render("account", { error: "Error, please try again" });
        }
        user.save((err) => {
          if (err) {
            req.session.passChange = "Error";
            console.log(err);
            return res.render("account", { error: "Error, please try again" });
          }
          req.logIn(user, (err) => {
            if (err) {
              req.session.passChange = "Error";
              console.log(err);
              return res.render("account", { error: "Error, please try again" });
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

// Password change messages
app.get('/api/changepassword', isLoggedIn, async function (req, res, next) {
  if (req.session.passChange === "Ok") {
    return res.status(200).json({ message: 'Password changed!' });
  } else if (req.session.passChange === "Wrong") {
    return res.status(401).json({ message: 'Old password wrong!' });
  } else if (req.session.passChange === "Error") {
    return res.status(500).json({ message: 'Error! Try again.' });
  } else {
    // console.log("nothing");
    // res.status(200).json({ message: 'No message' });
  }
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
  return res.render("account", { error: 'no error' });
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
app.post("/break-slots", async function (req, res) {
  try {
    const newSlotsValue = req.body.duration;

    // Update the break slots value in the database
    const breakSlots = await BreakSlots.findOneAndUpdate(
      {},
      { $set: { slots: newSlotsValue } },
      { new: true, upsert: true }
    );

    // Render the updated slots value in the secret_admin page
    const breakTracker = await getBreakTrackerData();
    return res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker, breakSlots: breakSlots });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Internal server error');
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
      startTime: new Date().toUTCString(),
      duration: req.body.duration,
      date: new Date().toUTCString(),
    });
    try {
      await breakTracker.save();
      return res.redirect("/secret");
    } catch (err) {
      return res.redirect("/secret");
    }
  } (req, res, next);
});

// GET METHOD to retrieve latest break
app.get("/api/latest-break", async function (req, res, next) {
  if (req.session.message === 'Only 1 break at a time') {
    console.log("message:", req.session.message, "sent");
    return res.status(401).json({ message: 'Only 1 break at a time' });
  } else if (req.session.message === 'Break submitted') {
    console.log("message:", req.session.message, "sent");
    return res.status(200).json({ message: 'Break submitted' });
  } else {
    // console.log("nothing");
    // res.status(200).json({ message: 'No message' });
  }
});

// CLEAR MODAL MESSAGES
app.post('/clear-message', function (req, res) {
  req.session.loggedIn = undefined;
  req.session.passChange = undefined;
  req.session.newAccount = undefined;
  req.session.message = undefined;
  return res.sendStatus(204);
});

// CATCH ERRORS
app.use(function (err, req, res, next) {
  console.error(err.stack);
  return res.status(500).send('Something broke!');
});

//UPDATE
app.route("/edit/:id").get((req, res) => {
  const id = req.params.id;
  BreakTrack.find({}, (err, breaks) => {
    return res.render("secret_edit.ejs", {
      breakTracker: breaks,
      idBreak: id,
      name: req.user.username
    });
  });
})
  .post((req, res) => {
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
app.route("/remove/:id").get((req, res) => {
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

