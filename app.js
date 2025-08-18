const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const flash = require("connect-flash");
const csurf = require('csurf');
const mongoSanitize = require('express-mongo-sanitize');
const adminsRouter = require("./routes/adminsRouter");
const usersRouter = require("./routes/usersRouter");
const productsRouter = require("./routes/productsRouter");
const indexRouter = require("./routes/indexRouter");
const helmet = require('helmet');

require("dotenv").config();

const db = require("./config/mongoose-connection");

app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://cdn.tailwindcss.com"],
      "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      "img-src": ["'self'", "data:"],
      "font-src": ["'self'", "https://cdn.jsdelivr.net", "https://unpkg.com", "https://fonts.gstatic.com"],
      "connect-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"]
    }
  })
);

app.use(helmet.frameguard({ action: 'deny' }));
app.use(helmet.noSniff());
app.disable('x-powered-by');
app.use(mongoSanitize({ replaceWith: '_' }));

app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 1000, // 1h
    },
  })
);


app.use(flash());

app.use(
  csurf({
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    req.flash('error', 'Your session expired. Please try again.');
    return res.redirect('back');
  }
  next(err);
});


app.use("/", indexRouter);
app.use("/admins", adminsRouter);
app.use("/users", usersRouter);
app.use("/products", productsRouter);

app.listen(3000, (err, res) => {
  console.log("Listening on PORT 3000");
});
