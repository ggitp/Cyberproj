const userModel = require("../models/user-model");
const { generateToken } = require("../utils/generateToken");
const { hashPassword, comparePassword } = require("../utils/hashPassword");


function normEmail(e) {
  return String(e || "").trim().toLowerCase();
}
function isNonEmptyString(s) {
  return typeof s === "string" && s.trim().length > 0;
}
function isValidEmail(email) {
  if (!isNonEmptyString(email)) return false;
  if (email.length > 254) return false;
  const at = email.indexOf("@");
  if (at <= 0 || at === email.length - 1) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!local || !domain) return false;
  if (domain.includes("..")) return false;
  if (domain.indexOf(".") === -1) return false; // require at least one dot in domain
  return true;
}

module.exports.registerUser = async (req, res) => {
  try {
    let { email, password, fullname } = req.body || {};

    if (!isNonEmptyString(fullname)) {
      req.flash("error", "Full name is required");
      return res.redirect("/");
    }
    email = normEmail(email);
    if (!isValidEmail(email)) {
      req.flash("error", "Invalid email");
      return res.redirect("/");
    }
    if (!isNonEmptyString(password) || password.length < 6) {
      req.flash("error", "Password must be at least 6 characters");
      return res.redirect("/");
    }

    const existing = await userModel.findOne({ email });
    if (existing) {
      req.flash("error", "You already have an account, please login.");
      return res.redirect("/");
    }

    const hash = await hashPassword(password);
    const user = await userModel.create({
      email,
      password: hash,
      fullname: fullname.trim(),
    });

    const token = generateToken(user); // exp: 1h in utils/generateToken.js
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1h
    });

    req.flash("success", "User created successfully");
    return res.redirect("/shop");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("/");
  }
};

module.exports.loginUser = async (req, res) => {
  try {
    let { email, password } = req.body || {};

    email = normEmail(email);
    if (!isValidEmail(email) || !isNonEmptyString(password)) {
      req.flash("error", "Email or Password incorrect");
      return res.redirect("/");
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      req.flash("error", "Email or Password incorrect");
      return res.redirect("/");
    }

    const ok = await comparePassword(password, user.password);
    if (!ok) {
      req.flash("error", "Email or Password incorrect");
      return res.redirect("/");
    }

    const token = generateToken(user); // exp: 1h
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1h
    });

    return res.redirect("/shop");
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong. Please try again.");
    return res.redirect("/");
  }
};

module.exports.logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  req.flash("success", "Logout Successful");
  return res.redirect("/");
};