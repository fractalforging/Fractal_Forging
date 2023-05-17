'use strict';

const isLoggedIn = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

const isAdmin = async (req, res, next) => {
  if (req.user && req.user.roles === "admin") {
    return next();
  }
  res.redirect("/secret");
}

export { isLoggedIn, isAdmin };
