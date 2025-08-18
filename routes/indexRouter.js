const express = require("express");
const router = express.Router();
const { generalLimiter } = require("../middlewares/ratelimit");
const isLoggedIn = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");

// Home
router.get("/", generalLimiter, (req, res) => {
  const error = req.flash("error");
  res.render("index", { error, loggedIn: false });
});

// Shop (protected)
router.get("/shop", generalLimiter, isLoggedIn, async (req, res) => {
  try {
    const success = req.flash("success");
    const products = await productModel.find();
    return res.render("shop", { products, success });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong.");
    return res.redirect("/");
  }
});

// Cart (protected)
router.get("/cart", generalLimiter, isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email }).populate("cart");
    const item = user?.cart && user.cart.length > 0 ? user.cart[0] : { price: 0, discount: 0 };
    const bill = Number(item.price) + 20 - Number(item.discount);
    return res.render("cart", { user, bill });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong.");
    return res.redirect("/shop");
  }
});

// Add to cart (protected) — CHANGED to POST
router.post("/addtocart/:id", generalLimiter, isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    user.cart.push(req.params.id);
    await user.save();
    req.flash("success", "Added to cart");
    return res.redirect("/shop");
  } catch (err) {
    console.error(err);
    req.flash("error", "Could not add to cart.");
    return res.redirect("/shop");
  }
});

module.exports = router;