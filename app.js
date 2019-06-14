require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const passport = require("passport");

// Run the code inside of the passport-setup.js file
require("./config/passport-setup.js");

mongoose
  .connect("mongodb://localhost/backend-meetup", {
    useNewUrlParser: true
  })
  .then(x => {
    console.log(
      `Connected to Mongo! Database name: "${
        x.connections[0].name
      }"`
    );
  })
  .catch(err => {
    console.error("Error connecting to mongo", err);
  });

const app = express();

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Allow Cross-Origin
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000"]
  })
);

app.use(
  session({
    //default setting
    resave: true,
    saveUninitialized: true,

    // session secret
    secret: process.env.SESSION_SECRET,
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    })
  })
);

// Activate some of the passport methods in our routes
app.use(passport.initialize());

// Load the logged-in user's information once we are logged-in
app.use(passport.session());

const index = require("./routes/index");
app.use("/", index);

const meetupRouter = require("./routes/meetup-routes");
app.use("/api", meetupRouter);

const taskRoutes = require("./routes/task-route");
app.use("/api", taskRoutes);

const authRoutes = require("./routes/auth-routes");
app.use("/api", authRoutes);

const groupRouter = require("./routes/group-routes");
app.use("/api", groupRouter);

const userRouter = require("./routes/user-routes");
app.use("/api", userRouter);

module.exports = app;
