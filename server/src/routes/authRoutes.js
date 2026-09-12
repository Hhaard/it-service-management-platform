const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const protect = require("../middleware/authMiddleware");

const router = express.Router();


// ============================================================
// LOGIN
// ============================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ----------------------------------------------------------
    // Validate input
    // ----------------------------------------------------------

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    // ----------------------------------------------------------
    // Find user
    // ----------------------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    // Use the same response for an unknown user
    // and an incorrect password.
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ----------------------------------------------------------
    // Account status
    // ----------------------------------------------------------

    if (!user.active) {
      return res.status(403).json({
        message: "This account has been deactivated",
      });
    }

    // ----------------------------------------------------------
    // Password verification
    // ----------------------------------------------------------

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ----------------------------------------------------------
    // JWT
    // ----------------------------------------------------------
    // Only store the user's ID in the token.
    // The current user information is loaded from MongoDB
    // by authMiddleware.js on every protected request.

    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    // ----------------------------------------------------------
    // Response
    // ----------------------------------------------------------

    return res.status(200).json({
      message: "Login successful",
      token,
      mustChangePassword:
        user.mustChangePassword,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });

  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Login failed",
    });
  }
});


// ============================================================
// CHANGE PASSWORD
// ============================================================

router.patch(
  "/change-password",
  protect,
  async (req, res) => {
    try {
      const {
        currentPassword,
        newPassword,
      } = req.body;

      // --------------------------------------------------------
      // Validate input
      // --------------------------------------------------------

      if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string" ||
        !currentPassword ||
        !newPassword
      ) {
        return res.status(400).json({
          message:
            "Current password and new password are required",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          message:
            "New password must be at least 8 characters",
        });
      }

      // --------------------------------------------------------
      // Load current user
      // --------------------------------------------------------

      const user =
        await User.findById(
          req.user.id
        ).select("+password");

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // --------------------------------------------------------
      // Check account status
      // --------------------------------------------------------

      if (!user.active) {
        return res.status(401).json({
          message:
            "User account has been deactivated",
        });
      }

      // --------------------------------------------------------
      // Verify current password
      // --------------------------------------------------------

      const passwordMatches =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!passwordMatches) {
        return res.status(401).json({
          message:
            "Current password is incorrect",
        });
      }

      // --------------------------------------------------------
      // Prevent reusing the current password
      // --------------------------------------------------------

      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password
        );

      if (samePassword) {
        return res.status(400).json({
          message:
            "New password must be different from the current password",
        });
      }

      // --------------------------------------------------------
      // Hash new password
      // --------------------------------------------------------

      const newPasswordHash =
        await bcrypt.hash(
          newPassword,
          12
        );

      user.password =
        newPasswordHash;

      user.mustChangePassword = false;

      await user.save();

      // --------------------------------------------------------
      // Response
      // --------------------------------------------------------

      return res.status(200).json({
        message:
          "Password changed successfully",
      });

    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to change password",
      });
    }
  }
);


module.exports = router;