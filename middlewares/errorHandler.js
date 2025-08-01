// not found middleware
const notFound = (req, res, next) => {
  const error = new Error(`not found ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// error handler middleware

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === " production" ? null : err.stack, // i just need it in develope not production
    // stack will give me error path in which file
  });
};

module.exports = { errorHandler, notFound };
