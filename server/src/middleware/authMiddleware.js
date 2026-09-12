const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    // --------------------------------------------------------
    // Verify server JWT configuration
    // --------------------------------------------------------

    if (
      !process.env.JWT_SECRET ||
      typeof process.env.JWT_SECRET !== "string"
    ) {
      console.error(
        "JWT_SECRET is missing or invalid."
      );

      return res.status(500).json({
        message:
          "Authentication service is not configured correctly",
      });
    }

    // --------------------------------------------------------
    // Read Authorization header
    // --------------------------------------------------------

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      typeof authHeader !== "string" ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // --------------------------------------------------------
    // Extract token
    // --------------------------------------------------------

    const token =
      authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // --------------------------------------------------------
    // Verify JWT
    // --------------------------------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // --------------------------------------------------------
    // Validate JWT payload
    // --------------------------------------------------------

    if (
      !decoded ||
      !decoded.id ||
      typeof decoded.id !== "string" ||
      !mongoose.Types.ObjectId.isValid(
        decoded.id
      )
    ) {
      return res.status(401).json({
        message: "Invalid or expired token",
      });
    }

    // --------------------------------------------------------
    // Load current user
    // --------------------------------------------------------

    const user =
      await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User account not found",
      });
    }

    // --------------------------------------------------------
    // Check current account status
    // --------------------------------------------------------

    if (!user.active) {
      return res.status(401).json({
        message:
          "User account has been deactivated",
      });
    }

    // --------------------------------------------------------
    // Create trusted authentication context
    // --------------------------------------------------------

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    };

    next();
  } catch (error) {
    // Never expose JWT/database details to the client.
    console.error(
      "Authentication error:",
      error
    );

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;