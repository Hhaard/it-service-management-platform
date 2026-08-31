const express = require("express");
const Ticket = require("../models/Ticket");
const TicketActivity = require("../models/TicketActivity");

const router = express.Router();

// Create a new ticket
router.post("/", async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);

    await TicketActivity.create({
      ticket: ticket._id,
      action: "Created",
      description: "Ticket was created.",
      performedBy: ticket.requester || "Haard Patel",
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({
      message: "Failed to create ticket",
      error: error.message,
    });
  }
});

// Get all tickets
router.get("/", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tickets",
      error: error.message,
    });
  }
});

// Get ticket activity
router.get("/:id/activity", async (req, res) => {
  try {
    const activities = await TicketActivity.find({
      ticket: req.params.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(activities);
  } catch (error) {
    res.status(400).json({
      message: "Failed to fetch ticket activity",
      error: error.message,
    });
  }
});

// Get one ticket
router.get("/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(400).json({
      message: "Invalid ticket ID",
      error: error.message,
    });
  }
});

// Update a ticket
router.put("/:id", async (req, res) => {
  try {
    const existingTicket = await Ticket.findById(
      req.params.id
    );

    if (!existingTicket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    const changes = [];

    if (
      req.body.status &&
      req.body.status !== existingTicket.status
    ) {
      changes.push(
        `Status changed from ${existingTicket.status} to ${req.body.status}.`
      );
    }

    if (
      req.body.priority &&
      req.body.priority !== existingTicket.priority
    ) {
      changes.push(
        `Priority changed from ${existingTicket.priority} to ${req.body.priority}.`
      );
    }

    if (
      req.body.category &&
      req.body.category !== existingTicket.category
    ) {
      changes.push(
        `Category changed from ${existingTicket.category} to ${req.body.category}.`
      );
    }

    if (
      req.body.assignedTo &&
      req.body.assignedTo !== existingTicket.assignedTo
    ) {
      changes.push(
        `Assigned to ${req.body.assignedTo}.`
      );
    }

    if (
      req.body.title &&
      req.body.title !== existingTicket.title
    ) {
      changes.push("Ticket title was updated.");
    }

    if (
      req.body.description &&
      req.body.description !== existingTicket.description
    ) {
      changes.push("Ticket description was updated.");
    }

    if (
      req.body.requester &&
      req.body.requester !== existingTicket.requester
    ) {
      changes.push("Requester information was updated.");
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (changes.length > 0) {
      await TicketActivity.create({
        ticket: ticket._id,
        action:
          changes.length === 1 &&
          changes[0].startsWith("Status changed")
            ? "Status Changed"
            : changes.length === 1 &&
              changes[0].startsWith("Priority changed")
            ? "Priority Changed"
            : changes.length === 1 &&
              changes[0].startsWith("Category changed")
            ? "Category Changed"
            : changes.length === 1 &&
              changes[0].startsWith("Assigned")
            ? "Assigned"
            : "Updated",
        description: changes.join(" "),
        performedBy: ticket.requester || "Haard Patel",
      });
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(400).json({
      message: "Failed to update ticket",
      error: error.message,
    });
  }
});

// Delete a ticket
router.delete("/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete ticket",
      error: error.message,
    });
  }
});

module.exports = router;