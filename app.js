const path = require("path");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");
const LocalStrategy = require("passport-local");
const tz = require('timezone/loaded');
let port = process.env.PORT || 3002;

let app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// MODELS - - ?||
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

// CHECK IF LOGGED IN
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

// fetch break tracker data
async function getBreakTrackerData() {
  const breakTracker = await BreakTrack.find();
  return breakTracker;
}

// CHECK ROLE
// middleware to check if user is an admin
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

// Showing home page
app.get("/", function (req, res) {
  res.render("login");
});

// Showing secret page
app.get("/secret", isLoggedIn, async function (req, res) {
  const breakTracker = await getBreakTrackerData();
  if (req.user.roles === "admin") {
    res.render("secret_admin", { name: req.user.username, breakTracker: breakTracker });
  } else if (req.user.roles === "user") {
    res.render("secret", { name: req.user.username, breakTracker: breakTracker });
  }
});

// Showing edit items
app.get("/secret_edit/:id", isLoggedIn, async function (req, res) {
  const foundBreakTrack = await BreakTrack.findById(req.params.id);
  res.render("secret_edit", {
    name: req.user.username,
    breakTracker: foundBreakTrack,
  });
});

//Showing login form
app.get("/login", function (req, res) {
  res.render("login");
});

// Showing register form
app.get("/register", function (req, res) {
  res.render("register");
});

// Handling user signup
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
      res.render("secret_admin.ejs", {name: req.user.username, message: "User account has been created successfully!"});
    }
  );
  console.log(req.body.username);
  console.log(req.body.password);
});

// Handling password change 1
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

    // Check if old password is empty
    if (!req.body.currentpassword) {
      console.log("Old password not provided");
      return res.render("account", { error: "Please provide your old password" });
    }

    // Check if old password matches
    user.authenticate(req.body.currentpassword, (err, valid) => {
      if (err) {
        console.log(err);
        return res.render("account", { error: "Error, please try again" });
      }
      if (!valid) {
        console.log("Old password incorrect");
        return res.render("account", { error: "Old password incorrect, please try again" });
      }

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
            res.render("passwordChanged");
          });
        });
      });
    });
  });
});

//Handling user login
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secret",
    failureRedirect: "/login",
  }),
  function (req, res) {
    req.session.username = req.body.username;
  }
);

//Handling user logout
app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
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
  // const myLocalTime = new Date(
  //   new Date().getTime() + (60 + new Date().getTimezoneOffset()) * 60 * 1000
  // );
  const myLocalTime = new Date();
  const breakTracker = new BreakTrack({
    user: req.user.username,
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

