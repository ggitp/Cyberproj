const express = require("express");
const router = express.Router();
const isAdmin = require("../middlewares/isAdmin");
const upload = require("../config/multer-config");
const productModel = require("../models/product-model");

router.post("/create", isAdmin, upload.single("image"), async (req, res) => {
  try {
    const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;
    const product = await productModel.create({
      image: req.file?.buffer,
      name, price, discount, bgcolor, panelcolor, textcolor
    });
    req.flash("success", "Product created successfully");
    return res.redirect("/admins/owner");
  } catch (err) {
    return res.status(400).send(err.message);
  }
});

module.exports = router;
