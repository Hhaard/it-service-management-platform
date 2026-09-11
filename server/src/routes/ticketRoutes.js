const express = require("express");
const Ticket = require("../models/Ticket");
const protect = require("../middleware/authMiddleware");
const TicketActivity = require("../models/TicketActivity");
const authorize = require("../middleware/roleMiddleware");
const User = require("../models/User");

const router = express.Router();


// Create a new ticket
router.post(
  "/",
  protect,
  authorize(
    "Administrator",
    "IT Support Agent",
    "Manager",
    "Requester"
  ),
  async (req, res) => {
    try {
      let ticketData = { ...req.body };

// Created By is always determined by the authenticated user.
// Never trust a createdBy value sent by the frontend.
ticketData.createdBy = req.user.id;

// Requesters can only create tickets for themselves
if (req.user.role === "Requester") {
  ticketData.requester = req.user.name;
}

      const ticket = await Ticket.create(ticketData);

      await TicketActivity.create({
        ticket: ticket._id,
        action: "Created",
        description: "Ticket was created.",
        performedBy: req.user.name,
      });

      res.status(201).json(ticket);
    } catch (error) {
      res.status(400).json({
        message: "Failed to create ticket",
        error: error.message,
      });
    }
  }
);

// Get all tickets
router.get(
  "/",
  protect,
  authorize(
    "Administrator",
    "IT Support Agent",
    "Manager",
    "Requester"
  ),
  async (req, res) => {
    try {
      let tickets;

      if (req.user.role === "Requester") {
        tickets = await Ticket.find({
          requester: req.user.name,
        })
          .populate(
            "createdBy",
            "name email role department"
          )
          .populate(
            "assignedToUser",
            "name email role department"
          )
          .sort({ createdAt: -1 })
          .populate(
            "resolvedBy",
            "name email role department"
          );
      } else {
        tickets = await Ticket.find()
          .populate(
            "createdBy",
            "name email role department"
          )
          .populate(
            "assignedToUser",
            "name email role department"
          )
          .sort({ createdAt: -1 });
      }

      res.status(200).json(tickets);
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch tickets",
        error: error.message,
      });
    }
  }
);
// Get ticket activity
router.get(
  "/:id/activity",
  protect,
  authorize("Administrator", "IT Support Agent", "Manager"),
  async (req, res) => {
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


// Add an internal note to a ticket
router.post(
  "/:id/activity",
  protect,
  authorize(
    "Administrator",
    "IT Support Agent",
    "Manager"
  ),
  async (req, res) => {
    try {
      const { description } = req.body;

      if (!description || !description.trim()) {
        return res.status(400).json({
          message: "Note cannot be empty",
        });
      }

      const ticket = await Ticket.findById(req.params.id);

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }

      const activity = await TicketActivity.create({
        ticket: ticket._id,
        action: "Internal Note",
        description: description.trim(),
        performedBy: req.user.name,
      });

      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({
        message: "Failed to add internal note",
        error: error.message,
      });
    }
  }
);

// Get one ticket
router.get(
  "/:id",
  protect,
  authorize(
    "Administrator",
    "IT Support Agent",
    "Manager",
    "Requester"
  ),
  async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
    .populate(
      "createdBy",
      "name email role department"
    )
    .populate(
      "assignedToUser",
      "name email role department"
    )

    .populate(
      "resolvedBy",
      "name email role department"
    );

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }
    
    // Requesters can only view their own tickets
    if (
      req.user.role === "Requester" &&
      ticket.requester !== req.user.name
    ) {
      return res.status(403).json({
        message: "You do not have permission to view this ticket",
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
router.put(
  "/:id",
  protect,
  authorize(
    "Administrator",
    "IT Support Agent",
    "Manager",
    "Requester"
  ),
  async (req, res) => {
    try {
      const existingTicket = await Ticket.findById(
        req.params.id
      ).populate(
        "assignedToUser",
        "name email role department"
      );

      if (!existingTicket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }

      // Requesters can only edit their own tickets
      if (
        req.user.role === "Requester" &&
        existingTicket.requester !== req.user.name
      ) {
        return res.status(403).json({
          message: "You can only edit your own tickets",
        });
      }

      let updateData = { ...req.body };

      // Created By is permanent.
      // It must never be changed after ticket creation.
      delete updateData.createdBy;
      
      // Requester is also protected after ticket creation.
      // It must not be changed through ticket updates.
      delete updateData.requester;
      
      // Resolution information is controlled by the backend.
      // Users cannot choose who the ticket was resolved by
      // or manually set the resolution timestamp.
      delete updateData.resolvedBy;
      delete updateData.resolvedAt;
      
      if (req.user.role === "Requester") {
        updateData = {
          title: req.body.title,
          description: req.body.description,
        };
      }

      // A resolution summary is required when resolving a ticket.
if (
  updateData.status === "Resolved" &&
  existingTicket.status !== "Resolved"
) {
  if (
    !updateData.resolutionSummary ||
    !updateData.resolutionSummary.trim()
  ) {
    return res.status(400).json({
      message:
        "Resolution summary is required when resolving a ticket",
    });
  }

  updateData.resolutionSummary =
    updateData.resolutionSummary.trim();
}

      // Resolution information
// When a ticket is changed to Resolved, automatically
// record who resolved it and when.
if (
  updateData.status === "Resolved" &&
  existingTicket.status !== "Resolved"
) {
  updateData.resolvedBy = req.user.id;
  updateData.resolvedAt = new Date();
}

// If a resolved ticket is moved back to another status,
// clear the previous resolution information.
if (
  updateData.status &&
  updateData.status !== "Resolved" &&
  existingTicket.status === "Resolved"
) {
  updateData.resolvedBy = null;
  updateData.resolvedAt = null;
  updateData.resolutionSummary = "";
}

      const changes = [];

      // Status change
      if (
        updateData.status &&
        updateData.status !== existingTicket.status
      ) {
        changes.push(
          `Status changed from ${existingTicket.status} to ${updateData.status}.`
        );
      }

      // Priority change
      if (
        updateData.priority &&
        updateData.priority !== existingTicket.priority
      ) {
        changes.push(
          `Priority changed from ${existingTicket.priority} to ${updateData.priority}.`
        );
      }

      // Category change
      if (
        updateData.category &&
        updateData.category !== existingTicket.category
      ) {
        changes.push(
          `Category changed from ${existingTicket.category} to ${updateData.category}.`
        );
      }

// Assigned user change
if (
  updateData.assignedToUser &&
  String(updateData.assignedToUser) !==
    String(existingTicket.assignedToUser?._id)
) {
  const assignedUser = await User.findById(
    updateData.assignedToUser
  );
  
  if (!assignedUser) {
    return res.status(400).json({
      message: "Assigned user not found",
    });
  }
  
  if (!assignedUser.active) {
    return res.status(400).json({
      message: "Cannot assign a ticket to a deactivated user",
    });
  }
  
  // Remove assignment if the user is inactive
  if (
    "assignedToUser" in updateData &&
    !updateData.assignedToUser  
  ) {
    updateData.assignedToUser = null;
    updateData.assignedTo = "Unassigned";

    if (existingTicket.assignedTo !== "Unassigned") {
      changes.push(
        `Ticket unassigned from ${existingTicket.assignedTo}.`
      );
    }
  }
  // Keep both assignment fields synchronized
  updateData.assignedToUser = assignedUser._id;
  updateData.assignedTo = assignedUser.name;

  changes.push(
    `Ticket assigned to ${assignedUser.name} (${assignedUser.department}).`
  );
}

      // Assigned-to string change
      if (
        updateData.assignedTo &&
        updateData.assignedTo !== existingTicket.assignedTo
      ) {
        changes.push(
          `Assigned to ${updateData.assignedTo}.`
        );
      }

      // Title change
      if (
        updateData.title &&
        updateData.title !== existingTicket.title
      ) {
        changes.push("Ticket title was updated.");
      }

      // Description change
      if (
        updateData.description &&
        updateData.description !== existingTicket.description
      ) {
        changes.push("Ticket description was updated.");
      }

      // Requester change
      if (
        updateData.requester &&
        updateData.requester !== existingTicket.requester
      ) {
        changes.push("Requester information was updated.");
      }

      const ticket = await Ticket.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate(
          "assignedToUser",
          "name email role department"
        )
        .populate(
          "resolvedBy",
          "name email role department"
        );

      // Record activity
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
          performedBy: req.user.name,
        });
      }

      res.status(200).json(ticket);
    } catch (error) {
      res.status(400).json({
        message: "Failed to update ticket",
        error: error.message,
      });
    }
  }
);

// Delete a ticket
router.delete(
  "/:id",
  protect,
  authorize("Administrator"),
  async (req, res) => {
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