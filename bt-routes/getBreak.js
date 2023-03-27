// bt-routes/getBreaks.js
const BreakTrack = require("../models/breakTrack");

module.exports = function (app) {
  app.get("/", (req, res, next) => {
    BreakTrack.find({}, (err, breaks) => {
      return res.render("secret.ejs", {
        breakTracker: breaks,
      });
    });
  });
};
