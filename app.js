//=====================
// IMPORTS
//=====================

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const bodyParser = require("body-parser");
const LocalStrategy = require("passport-local");
const logger = require('./serverjs/logger.js');
const dotenv = require("dotenv");
const http = require('http');
const { Server } = require('socket.io');


//=====================
// ENVIRONMENT VARIABLES
//=====================

dotenv.config({ path: "variables.env" });
const dbPath = process.env.DB_PATH;
const port = process.env.PORT;
const location = process.env.LOCATION;


//=====================
// MONGODB DATABASE
//=====================

// Models
const createAdminUser = require("./models/firstRun");
const User = require('./models/user');
const BreakTrack = require("./models/BreakTrack.js");

// Initialization
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

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//=====================
// EXPRESS CONFIG.
//=====================

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


//=====================
// SOCKET.IO CONFIG.
//=====================

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
// MIDDLEWARE & ROUTES
//=====================

const { isLoggedIn, isAdmin } = require('./middleware/authentication.js');
const indexRoutes = require('./routes/index.js');
const { getBreakTrackerData, getBreakSlotsData } = require('./serverjs/helperFunctions.js');
const loginRoutes = require('./routes/login.js');
const logoutRoutes = require('./routes/logout.js');
const secretRoutes = require('./routes/secret.js');
const registerRoutes = require('./routes/register.js');
const changepasswordRoutes = require('./routes/changepassword.js');
const breakSlotsRoutes = require('./routes/break-slots.js')(io, BreakTrack);
const usersRoutes = require("./routes/users.js");
const deleteRoutes = require('./routes/delete.js');
const apiMessages = require('./serverjs/apiMessages.js');
const resetPasswordRoute = require('./routes/resetPassword.js');


//=====================
// BT ROUTES
//=====================

const { submitBreaks: submitBreakRoutes } = require('./bt-routes/submitBreak.js');
const startBreakRoutes = require('./bt-routes/startBreak.js');
const removeBreakRoutes = require('./bt-routes/removeBreak.js');
const endBreakRoutes = require('./bt-routes/endBreak.js');
const resetBreakTimeRoutes = require('./bt-routes/resetBreakTime.js');
const breakQueue = require("./bt-routes/breakQueueList.js")(User, io, location);


//=====================
// APPLY ROUTES
//=====================

app.use("/", indexRoutes);
app.use("/login", loginRoutes);
app.use("/logout", logoutRoutes);
app.use("/secret", secretRoutes);
app.use("/secret_admin", secretRoutes);
app.use("/register", registerRoutes);
app.use("/account", changepasswordRoutes);
app.use("/changepassword", changepasswordRoutes);
app.use("/break-slots", breakSlotsRoutes);
app.use("/users", usersRoutes);
app.use('/delete', deleteRoutes);
app.get('/api/messaging', apiMessages.myMessages);
app.use('/resetpassword', resetPasswordRoute);


//=====================
// APPLY BT ROUTES
//=====================

app.use('/submit', submitBreakRoutes(io, BreakTrack, User));
app.use('/breaks/start', isLoggedIn, startBreakRoutes(io, BreakTrack, User));
app.use('/remove', removeBreakRoutes(io, BreakTrack, User));
app.use('/breaks', endBreakRoutes(BreakTrack));
app.use('/reset', resetBreakTimeRoutes(User, io, location));


//=====================
// ERROR HANDLING
//=====================

app.use(function (err, req, res, next) {
  logger.error(err.stack);
  return res.status(500).send('Something broke!');
});

// CLEAR SESSION VARIABLES FOR MODAL MESSAGING
app.post('/clear-message', function (req, res, next) {
  delete req.session.message;
  return res.sendStatus(204);
});