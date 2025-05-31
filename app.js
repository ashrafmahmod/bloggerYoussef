const express = require("express");
const connectionToDb = require("./config/conectToDb");
const cors = require("cors");
require("dotenv").config();

const rateLimiting = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const port = process.env.PORT;
const { errorHandler, notFound } = require("./middlewares/errorHandler");
const app = express();

// Start MiddleWares
// parse body or parse json
app.use(express.json());

// security headers (helmet)
app.use(helmet());
// prevent http param pollution (hpp)
app.use(hpp());
// prevent xss attacks (cross site scripting)

// rate limiting
app.use(
  rateLimiting({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 200, // number or requests windowMs (time)
  })
);

// End MiddleWares
// Cors Policy
app.use(
  cors({
    // origin: "http://localhost:3000", // local host
    origin: process.env.CLIENT_DOMAIN, // server
  })
);
// Start Routes
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/users", require("./routes/usersRoute"));
app.use("/api/posts", require("./routes/postRoute"));
app.use("/api/comments", require("./routes/commentsRoute"));
app.use("/api/categories", require("./routes/categoriesRoutes"));
app.use("/api/password", require("./routes/passwordRoute"));
// End Routes

// error Handler middleware
// 2 ways coz notFound has next()
// fist way
// app.use(notFound); //
// app.use(errorHandler);
// seconde way
app.use(notFound, errorHandler);

// Start Connection
// Connect TO Db
connectionToDb();
// Running Server
app.listen(port, () => {
  console.log(
    `Server Is Running In ${process.env.NODE_ENV} Mood On Port => ${port}`
  );
});
// End Connection
