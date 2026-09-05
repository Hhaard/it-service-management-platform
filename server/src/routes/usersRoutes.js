const express = require("express");
const User = require("../models/User");
const UserActivity = require("../models/UserActivity");

const router = express.Router();

// Get all active users
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
});

// Get one user
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({
      message: "Invalid user ID",
      error: error.message,
    });
  }
});

// Create a user
router.post("/", async (req, res) => {
  try {
    const user = await User.create(req.body);

await UserActivity.create({
  user: user._id,
  action: "Created",
  description: `User account ${user.name} was created.`,
  performedBy: "Haard Patel",
});

res.status(201).json(user);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create user",
      error: error.message,
    });
  }
});

// Update a user
router.put("/:id", async (req, res) => {
  try {
    const updates = {};

    // Only update fields that were provided
    if (req.body.name !== undefined) {
      updates.name = req.body.name;
    }

    if (req.body.email !== undefined) {
      updates.email = req.body.email;
    }

    if (req.body.role !== undefined) {
      updates.role = req.body.role;
    }

    if (req.body.department !== undefined) {
      updates.department = req.body.department;
    }

    if (req.body.active !== undefined) {
      updates.active = req.body.active;
    }

    // Prevent empty updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No changes provided",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await UserActivity.create({
      user: user._id,
      action: "Updated",
      description: `User account ${user.name} was updated.`,
      performedBy: "Haard Patel",
    });
    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
});

// Deactivate a user
router.patch("/:id/deactivate", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const reason =
      req.body.reason?.trim() ||
      "No reason provided";

    await UserActivity.create({
      user: user._id,
      action: "Deactivated",
      description: `User ${user.name} was deactivated.`,
      performedBy: "Haard Patel",
      reason,
    });

    res.status(200).json({
      message: "User deactivated successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to deactivate user",
      error: error.message,
    });
  }
});

// Reactivate a user
router.patch("/:id/reactivate", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { active: true },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    await UserActivity.create({
      user: user._id,
      action: "Reactivated",
      description: `User ${user.name} was reactivated.`,
      performedBy: "Haard Patel",
    });

    res.status(200).json({
      message: "User reactivated successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to reactivate user",
      error: error.message,
    });
  }
});

router.get("/:id/activity", async (req, res) => {
  try {
    const activities = await UserActivity.find({
      user: req.params.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(activities);
  } catch (error) {
    res.status(400).json({
      message: "Failed to fetch user activity",
      error: error.message,
    });
  }
});

module.exports = router;