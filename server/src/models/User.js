const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: [
        "Administrator",
        "IT Support Agent",
        "Manager",
        "Requester",
      ],
      default: "Requester",
    },

    department: {
      type: String,
      enum: [
        "IT",
        "Management",
        "HR",
        "Finance",
        "Operations",
        "Other",
      ],
      default: "IT",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);