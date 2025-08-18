module.exports = function isAdmin(req, res, next) {
  if (!req.session?.user || req.session.user.role !== "admin") {
    req.flash("error", "Admin access required");
    return res.redirect("/login");
  }
  next();
};