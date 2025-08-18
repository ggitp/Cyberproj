const userModel = require("../models/user-model");
const { generateToken } = require("../utils/generateToken");
const { hashPassword, comparePassword } = require("../utils/hashPassword");

module.exports.registerUser = async (req, res) => {
  try {
    const { email, password, fullname } = req.body;

    const existing = await userModel.findOne({ email });
    if (existing) {
      req.flash("error", "You already have an account, please login.");
      return res.redirect("/");
    }

    const hash = await hashPassword(password);
    const user = await userModel.create({ email, password: hash, fullname });

    const token = generateToken(user); // has exp: '1h'
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1h, align with JWT exp
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
    const { email, password } = req.body;

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

    const token = generateToken(user); // has exp: '1h'
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
  // Clear with matching flags so the browser actually removes it
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  req.flash("success", "Logout Successful");
  return res.redirect("/");
};