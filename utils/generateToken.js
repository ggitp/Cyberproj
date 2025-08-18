const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    { email: user.email, id: user._id },
    process.env.JWT_KEY,
    { expiresIn: '1h', issuer: 'your-app', audience: String(user._id) }
  );
};

module.exports.generateToken = generateToken;
