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
//const tz = require('timezone/loaded');
let port = process.env.PORT || 3002;

let app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

//=====================
// DATABASE
//=====================

const BreakTrack = require("./models/BreakTrack");
const User = require("./models/user");

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
    app.listen(port, () => console.log("Server Up and running"));
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

// Initiate chache for certain period
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=86400');
  next();
});

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

// Check if user is an admin
async function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.roles === "admin") {
    res.locals.role = 'admin';
    const breakTracker = await getBreakTrackerData();
    res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker });
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
  res.render("login");
});

// LOGIN
app.get("/login", function (req, res) {
  res.render("login");
});

// USER LANDING PAGE
app.get("/secret", isLoggedIn, async function (req, res) {
  const breakTracker = await getBreakTrackerData();
  if (req.user.roles === "admin") {
    res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker });
  } else if (req.user.roles === "user") {
    res.render("secret", { name: req.user.username, breakTracker: breakTracker });
  }
});

// ADMIN LANDING PAGE
app.get("/secret_edit/:id", isLoggedIn, async function (req, res) {
  const foundBreakTrack = await BreakTrack.findById(req.params.id);
  res.render("secret_edit", {
    name: req.user.username,
    breakTracker: foundBreakTrack,
  });
});



// Showing register form
app.get("/register", function (req, res) {
  res.render("register");
});

// Handling user registration
app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username, roles: "user" },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        if (err.name === 'MongoError' && err.code === 11000) {
          return res.render("register", { error: 'Username already taken.' });
        }
        return res.render("register", { error: 'Error creating user.' });
      }
      console.log(user);
      req.session.message = "User account has been created successfully!";
      res.redirect("/secret_admin?newUser=true");
    }
  );
  console.log(req.body.username);
  console.log(req.body.password);
});

// Handling password change
app.post("/changepassword", isLoggedIn, function (req, res) {
  User.findOne({ username: req.user.username }, (err, user) => {
    if (err) {
      console.log(err);
      return res.render("account", { error: "Error, please try again" });
    }
    if (!user) {
      console.log("User not found");
      return res.render("account", { error: "Error, please try again" });
    }

    // Check if current password is empty
    if (!req.body.currentpassword) {
      console.log("Current password not provided");
      return res.render("account", { error: "Please provide your current password" });
    }

    // Check if current password matches
    user.authenticate(req.body.currentpassword, (err, valid) => {
      if (err) {
        console.log(err);
        return res.render("account", { error: "Error, please try again" });
      }
      if (!valid) {
        console.log("Current password incorrect");
        return res.render("account", { error: "Current password incorrect, please try again" });
      } else {
        // Update password
        user.setPassword(req.body.newpassword, (err) => {
          if (err) {
            console.log(err);
            return res.render("account", { error: "Error, please try again" });
          }
          user.save((err) => {
            if (err) {
              console.log(err);
              return res.render("account", { error: "Error, please try again" });
            }
            req.logIn(user, (err) => {
              if (err) {
                console.log(err);
                return res.render("account", { error: "Error, please try again" });
              }
              console.log("Password change for " + `${user.username}` + " was successfull");
              return res.redirect("/secret");
            });
          });
        });
      }
    });
  });
});

//Handling user login
//req.session.loggedIn ="";
app.post('/login', async function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      req.session.loggedIn = "error1";
      console.log('An error1 occurred while logging in:', err);
      res.render("login", { message: "An error occurred while logging in" });
    }
    if (!user) {
      req.session.loggedIn = "false";
      console.log('Incorrect username or password');
      res.render("login", { message: "Incorrect email or password" });
    }
    if (err || !user) {
      req.session.loggedIn = "errorx";
      return;
    }
    req.logIn(user, function (err) {
      if (err) {
        req.session.loggedIn = "error2";
        console.log('An error2 occurred while logging in:', err);
        res.render("login", { message: "An error occurred while logging in" });
      }
      console.log('Login successful for user:', user.username);
      req.session.username = req.body.username;
      req.session.loggedIn = "true";
      res.redirect("secret");
    });
  })(req, res, next);
});

// Login messages
app.get('/api/login', async function (req, res) {
  if (req.session.loggedIn === "true") {
    //return res.status(200).json({ message: 'Login successful!.' });
  } else if (req.session.loggedIn === "false") {
    return res.status(401).json({ message: 'Wrong credentials' });
  } else if (req.session.loggedIn === "error1") {
    return res.status(401).json({ message: 'Error1' });
  } else if (req.session.loggedIn === "error2") {
    return res.status(401).json({ message: 'error2' });
  } else if (req.session.loggedIn === "errorx") {
    return res.status(401).json({ message: 'errorx' });
  }
});


//Handling user logout
app.get("/logout", function (req, res) {
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
      res.redirect("/");
    });
  });
});


//Handling account
app.get("/account", isLoggedIn, function (req, res) {
  res.render("account", { error: 'no error' });
});

//Handling Admins
app.get("/secret_admin", isLoggedIn, isAdmin, function (req, res) {
  if (req.user.roles === "admin") {
    return res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker, role: res.locals.role });
  } else {
    res.redirect("/secret_admin", { name: req.user.username, breakTracker: breakTracker, role: res.locals.role });
  }
});

app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});

//=====================
// BREAK TRACKER
//=====================

// GET METHOD
app.get("/", (req, res) => {
  BreakTrack.find({}, (err, breaks) => {
    res.render("secret.ejs", {
      breakTracker: breaks,
    });
  });
});

// POST METHOD
app.post("/", async (req, res) => {
  const user = req.user.username;

  // Retrieve the latest break for the user
  const latestBreak = await BreakTrack.findOne({ user }).sort({ startTime: -1 });

  if (latestBreak && !latestBreak.endTime) {
    // The user is already on a break
    res.redirect("/secret");
  } else {
    // The user is not on a break, save the new break in the database
    const breakTracker = new BreakTrack({
      user,
      startTime: new Date().toUTCString(),
      duration: req.body.duration,
      date: new Date().toUTCString(),
    });
    try {
      await breakTracker.save();
      res.redirect("/secret");
    } catch (err) {
      res.redirect("/secret");
    }
  }
});

//ERROR FOR SETTING MORE THAN 1 BREAK
app.get("/api/latest-break", isLoggedIn, async function (req, res) {
  const user = req.user.username;
  const latestBreak = await BreakTrack.findOne({ user }).sort({ startTime: -1 });
  res.json(latestBreak);
});

//UPDATE
app
  .route("/edit/:id")
  .get((req, res) => {
    const id = req.params.id;
    BreakTrack.find({}, (err, breaks) => {
      res.render("secret_edit.ejs", {
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
        res.redirect("/secret");
      }
    );
  });

//DELETE
app.route("/remove/:id").get((req, res) => {
  const id = req.params.id;
  BreakTrack.findByIdAndRemove(id, (err) => {
    if (err) return res.send(500, err);
    res.redirect("/secret");
  });
});

mongoose.set("strictQuery", false);

// KILL PORT PROCESSES kill -9 $(lsof -t -i:3000)
// netstat -ano | findstr :3002
// taskkill /F /PID 24860

