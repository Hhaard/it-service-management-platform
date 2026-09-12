const mongoose = require("mongoose");

const errorMiddleware = (err, req, res, next) => {
  console.error("API Error:", err);

  // ----------------------------------------------------------
  // Invalid MongoDB ObjectId
  // ----------------------------------------------------------

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: "Invalid resource ID",
    });
  }

  // ----------------------------------------------------------
  // Mongoose validation error
  // ----------------------------------------------------------

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map(
      (error) => error.message
    );

    return res.status(400).json({
      message: "Validation failed",
      errors,
    });
  }

  // ----------------------------------------------------------
  // MongoDB duplicate key error
  // ----------------------------------------------------------

  if (err.code === 11000) {
    const fields = Object.keys(
      err.keyPattern || {}
    );

    return res.status(409).json({
      message: "A record with the same value already exists",
      fields,
    });
  }

  // ----------------------------------------------------------
  // JSON parsing error
  // ----------------------------------------------------------

  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    err.type === "entity.parse.failed"
  ) {
    return res.status(400).json({
      message: "Invalid JSON request body",
    });
  }

  // ----------------------------------------------------------
  // Explicit status code from an error
  // ----------------------------------------------------------

  const statusCode =
    err.statusCode ||
    err.status ||
    500;

  // ----------------------------------------------------------
  // Default server error
  // ----------------------------------------------------------

  return res.status(statusCode).json({
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
};

module.exports = errorMiddleware;