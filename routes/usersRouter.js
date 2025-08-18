const express = require("express");
const router = express.Router();
const { authLimiter } = require("../middlewares/ratelimit");
const {
  registerUser,
  loginUser,
  logout,
} = require("../controllers/authController");


router.get("/", (req, res) => {
  res.send("hey it's working users");
});

router.post('/register', authLimiter, registerUser);

router.post('/login',    authLimiter, loginUser);

router.get("/logout", logout);

module.exports = router;
