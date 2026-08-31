const mongoose = require("mongoose");

const ticketActivitySchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    action: {
      type: String,
      enum: [
        "Created",
        "Updated",
        "Assigned",
        "Status Changed",
        "Priority Changed",
        "Category Changed",
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
      default: "Haard Patel",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "TicketActivity",
  ticketActivitySchema
);