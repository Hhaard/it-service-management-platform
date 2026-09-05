const mongoose = require("mongoose");

const userActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      enum: [
        "Created",
        "Updated",
        "Deactivated",
        "Reactivated",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    performedBy: {
      type: String,
      required: true,
      trim: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "UserActivity",
  userActivitySchema
);