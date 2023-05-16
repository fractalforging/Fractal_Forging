async function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

async function isAdmin(req, res, next) {
  if (req.user && req.user.roles === "admin") {
    return next();
  }
  res.redirect("/secret");
}

export { isLoggedIn, isAdmin };
