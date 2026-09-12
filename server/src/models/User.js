const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    mustChangePassword: {
      type: Boolean,
      default: false,
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

module.exports =
  mongoose.model("User", userSchema);