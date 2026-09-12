const express = require("express");
const mongoose = require("mongoose");

const Ticket = require("../models/Ticket");
const TicketActivity = require("../models/TicketActivity");
const TicketComment = require("../models/TicketComment");
const User = require("../models/User");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

// ============================================================
// CONSTANTS
// ============================================================

const STAFF_ROLES = [
  "Administrator",
  "IT Support Agent",
  "Manager",
];

const ALL_ROLES = [
  ...STAFF_ROLES,
  "Requester",
];

const VALID_STATUSES = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
  "Reopen",
];

const VALID_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const VALID_CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Access",
  "Other",
];

// ============================================================
// CREATE TICKET
// ============================================================

router.post(
  "/",
  protect,
  authorize(...ALL_ROLES),
  async (req, res) => {
    try {
      const {
        title,
        description,
        priority,
        category,
        requester,
      } = req.body;

      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          message: "Ticket title is required",
        });
      }

      if (
        typeof description !== "string" ||
        !description.trim()
      ) {
        return res.status(400).json({
          message: "Ticket description is required",
        });
      }

      if (title.trim().length > 200) {
        return res.status(400).json({
          message:
            "Ticket title cannot exceed 200 characters",
        });
      }

      if (description.trim().length > 2000) {
        return res.status(400).json({
          message:
            "Ticket description cannot exceed 2000 characters",
        });
      }

      if (
        priority !== undefined &&
        !VALID_PRIORITIES.includes(priority)
      ) {
        return res.status(400).json({
          message: "Invalid ticket priority",
        });
      }

      if (
        category !== undefined &&
        !VALID_CATEGORIES.includes(category)
      ) {
        return res.status(400).json({
          message: "Invalid ticket category",
        });
      }

      const ticketData = {
        title: title.trim(),
        description: description.trim(),
        priority: priority || "Medium",
        category: category || "Other",
        createdBy: req.user.id,
        status: "Open",
        assignedTo: "Unassigned",
        assignedToUser: null,
        resolutionSummary: "",
        resolvedBy: null,
        resolvedAt: null,
      };

      if (req.user.role === "Requester") {
        ticketData.requester = req.user.name;
      } else {
        if (
          typeof requester === "string" &&
          requester.trim()
        ) {
          ticketData.requester = requester.trim();
        } else {
          ticketData.requester = req.user.name;
        }
      }

      const ticket = await Ticket.create(ticketData);

      await TicketActivity.create({
        ticket: ticket._id,
        action: "Created",
        description: "Ticket was created.",
        performedBy: req.user.name,
      });

      const populatedTicket =
        await Ticket.findById(ticket._id)
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

      return res.status(201).json(
        populatedTicket
      );
    } catch (error) {
      console.error(
        "Create ticket error:",
        error
      );

      return res.status(400).json({
        message: "Failed to create ticket",
      });
    }
  }
);

// ============================================================
// GET ALL TICKETS
// ============================================================

router.get(
  "/",
  protect,
  authorize(...ALL_ROLES),
  async (req, res) => {
    try {
      let ticketsQuery;

      if (req.user.role === "Requester") {
        ticketsQuery = Ticket.find({
          requester: req.user.name,
        });
      } else {
        ticketsQuery = Ticket.find();
      }

      const tickets =
        await ticketsQuery
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
          )
          .sort({
            createdAt: -1,
          });

      return res.status(200).json(tickets);
    } catch (error) {
      console.error(
        "Fetch tickets error:",
        error
      );

      return res.status(500).json({
        message: "Failed to fetch tickets",
      });
    }
  }
);

// ============================================================
// GET TICKET ACTIVITY
// ============================================================

router.get(
  "/:id/activity",
  protect,
  authorize(...STAFF_ROLES),
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid ticket ID",
        });
      }

      const ticket = await Ticket.findById(
        req.params.id
      );

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }

      const activities =
        await TicketActivity.find({
          ticket: req.params.id,
        }).sort({
          createdAt: -1,
        });

      return res.status(200).json(activities);
    } catch (error) {
      console.error(
        "Fetch ticket activity error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch ticket activity",
      });
    }
  }
);

// ============================================================
// ADD INTERNAL NOTE
// ============================================================

router.post(
  "/:id/activity",
  protect,
  authorize(...STAFF_ROLES),
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid ticket ID",
        });
      }

      const {
        description,
      } = req.body;

      if (
        typeof description !== "string" ||
        !description.trim()
      ) {
        return res.status(400).json({
          message: "Note cannot be empty",
        });
      }

      if (
        description.trim().length > 2000
      ) {
        return res.status(400).json({
          message:
            "Note cannot exceed 2000 characters",
        });
      }

      const ticket = await Ticket.findById(
        req.params.id
      );

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }

      const activity =
        await TicketActivity.create({
          ticket: ticket._id,
          action: "Internal Note",
          description: description.trim(),
          performedBy: req.user.name,
        });

      return res.status(201).json(activity);
    } catch (error) {
      console.error(
        "Add internal note error:",
        error
      );

      return res.status(400).json({
        message:
          "Failed to add internal note",
      });
    }
  }
);

// ============================================================
// GET PUBLIC COMMENTS
// ============================================================

router.get(
  "/:id/comments",
  protect,
  authorize(...ALL_ROLES),
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid ticket ID",
        });
      }

      const ticket = await Ticket.findById(
        req.params.id
      );

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }

      if (
        req.user.role === "Requester" &&
        ticket.requester !== req.user.name
      ) {
        return res.status(403).json({
          message:
            "You do not have permission to view these comments",
        });
      }

      const comments =
        await TicketComment.find({
          ticket: ticket._id,
        })
          .populate(
            "author",
            "name email role department"
          )
          .sort({
            createdAt: 1,
          });

      return res.status(200).json(comments);
    } catch (error) {
      console.error(
        "Fetch ticket comments error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch ticket comments",
      });
    }
  }
);

// ============================================================
// ADD PUBLIC COMMENT
// ============================================================

router.post(
  "/:id/comments",
  protect,
  authorize(...ALL_ROLES),
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid ticket ID",
        });
      }

      const {
        message,
      } = req.body;

      if (
        typeof message !== "string" ||
        !message.trim()
      ) {
        return res.status(400).json({
          message:
            "Comment cannot be empty",
        });
      }

      if (message.trim().length > 2000) {
        return res.status(400).json({
          message:
            "Comment cannot exceed 2000 characters",
        });
      }

      const ticket = await Ticket.findById(
        req.params.id
      );

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }

      if (
        req.user.role === "Requester" &&
        ticket.requester !== req.user.name
      ) {
        return res.status(403).json({
          message:
            "You can only comment on your own tickets",
        });
      }

      const comment =
        await TicketComment.create({
          ticket: ticket._id,
          author: req.user.id,
          authorName: req.user.name,
          authorRole: req.user.role,
          message: message.trim(),
        });

      const populatedComment =
        await TicketComment.findById(
          comment._id
        ).populate(
          "author",
          "name email role department"
        );

      return res.status(201).json(
        populatedComment
      );
    } catch (error) {
      console.error(
        "Add public comment error:",
        error
      );

      return res.status(400).json({
        message:
          "Failed to add public comment",
      });
    }
  }
);

// ============================================================
// GET ONE TICKET
// ============================================================

router.get(
  "/:id",
  protect,
  authorize(...ALL_ROLES),
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid ticket ID",
        });
      }

      const ticket =
        await Ticket.findById(req.params.id)
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

      if (
        req.user.role === "Requester" &&
        ticket.requester !== req.user.name
      ) {
        return res.status(403).json({
          message:
            "You do not have permission to view this ticket",
        });
      }

      return res.status(200).json(ticket);
    } catch (error) {
      console.error(
        "Fetch ticket error:",
        error
      );

      return res.status(500).json({
        message: "Failed to fetch ticket",
      });
    }
  }
);

// ============================================================
// UPDATE TICKET
// ============================================================

router.put(
  "/:id",
  protect,
  authorize(...ALL_ROLES),
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid ticket ID",
        });
      }

      const existingTicket =
        await Ticket.findById(
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

      if (
        req.user.role === "Requester" &&
        existingTicket.requester !== req.user.name
      ) {
        return res.status(403).json({
          message:
            "You can only edit your own tickets",
        });
      }

      let updateData = {};

      // ========================================================
      // REQUESTER UPDATE
      // ========================================================

      if (req.user.role === "Requester") {
        updateData = {
          title: req.body.title,
          description: req.body.description,
        };

        if (
          typeof updateData.title !== "string" ||
          !updateData.title.trim()
        ) {
          return res.status(400).json({
            message:
              "Ticket title is required",
          });
        }

        if (
          typeof updateData.description !==
            "string" ||
          !updateData.description.trim()
        ) {
          return res.status(400).json({
            message:
              "Ticket description is required",
          });
        }

        updateData.title =
          updateData.title.trim();

        updateData.description =
          updateData.description.trim();

        if (
          updateData.title.length > 200
        ) {
          return res.status(400).json({
            message:
              "Ticket title cannot exceed 200 characters",
          });
        }

        if (
          updateData.description.length >
          2000
        ) {
          return res.status(400).json({
            message:
              "Ticket description cannot exceed 2000 characters",
          });
        }
      }

      // ========================================================
      // STAFF UPDATE
      // ========================================================

      else {
        const allowedFields = [
          "title",
          "description",
          "status",
          "priority",
          "category",
          "assignedToUser",
          "resolutionSummary",
        ];

        for (
          const field of allowedFields
        ) {
          if (
            req.body[field] !== undefined
          ) {
            updateData[field] =
              req.body[field];
          }
        }

        // ------------------------------------------------------
        // Validate title
        // ------------------------------------------------------

        if (
          updateData.title !== undefined
        ) {
          if (
            typeof updateData.title !==
              "string" ||
            !updateData.title.trim()
          ) {
            return res.status(400).json({
              message:
                "Ticket title cannot be empty",
            });
          }

          updateData.title =
            updateData.title.trim();

          if (
            updateData.title.length > 200
          ) {
            return res.status(400).json({
              message:
                "Ticket title cannot exceed 200 characters",
            });
          }
        }

        // ------------------------------------------------------
        // Validate description
        // ------------------------------------------------------

        if (
          updateData.description !==
          undefined
        ) {
          if (
            typeof updateData.description !==
              "string" ||
            !updateData.description.trim()
          ) {
            return res.status(400).json({
              message:
                "Ticket description cannot be empty",
            });
          }

          updateData.description =
            updateData.description.trim();

          if (
            updateData.description.length >
            2000
          ) {
            return res.status(400).json({
              message:
                "Ticket description cannot exceed 2000 characters",
            });
          }
        }

        // ------------------------------------------------------
        // Validate status
        // ------------------------------------------------------

        if (
          updateData.status !== undefined
        ) {
          if (
            !VALID_STATUSES.includes(
              updateData.status
            )
          ) {
            return res.status(400).json({
              message:
                "Invalid ticket status",
            });
          }

          const currentStatus =
            existingTicket.status;
          const newStatus =
            updateData.status;

          const allowedTransitions = {
            Open: [
              "Open",
              "In Progress",
            ],
            "In Progress": [
              "In Progress",
              "Resolved",
              "Open",
            ],
            Resolved: [
              "Resolved",
              "Reopen",
              "Closed",
            ],
            Closed: [
              "Closed",
              "Reopen",
            ],
            Reopen: [
              "Reopen",
              "In Progress",
            ],
          };

          if (
            !allowedTransitions[
              currentStatus
            ]?.includes(newStatus)
          ) {
            return res.status(400).json({
              message:
                `Invalid status transition from ${currentStatus} to ${newStatus}`,
            });
          }
        }

        // ------------------------------------------------------
        // Validate priority
        // ------------------------------------------------------

        if (
          updateData.priority !== undefined
        ) {
          if (
            !VALID_PRIORITIES.includes(
              updateData.priority
            )
          ) {
            return res.status(400).json({
              message:
                "Invalid ticket priority",
            });
          }
        }

        // ------------------------------------------------------
        // Validate category
        // ------------------------------------------------------

        if (
          updateData.category !== undefined
        ) {
          if (
            !VALID_CATEGORIES.includes(
              updateData.category
            )
          ) {
            return res.status(400).json({
              message:
                "Invalid ticket category",
            });
          }
        }

        // ------------------------------------------------------
        // Validate assignment
        // ------------------------------------------------------

        if (
          Object.prototype.hasOwnProperty.call(
            updateData,
            "assignedToUser"
          )
        ) {
          const requestedAssignee =
            updateData.assignedToUser;

          if (!requestedAssignee) {
            updateData.assignedToUser =
              null;

            updateData.assignedTo =
              "Unassigned";
          } else {
            if (
              !mongoose.Types.ObjectId.isValid(
                requestedAssignee
              )
            ) {
              return res.status(400).json({
                message:
                  "Invalid assigned user ID",
              });
            }

            const assignedUser =
              await User.findById(
                requestedAssignee
              );

            if (!assignedUser) {
              return res.status(400).json({
                message:
                  "Assigned user not found",
              });
            }

            if (!assignedUser.active) {
              return res.status(400).json({
                message:
                  "Cannot assign a ticket to a deactivated user",
              });
            }

            if (
              assignedUser.role ===
              "Requester"
            ) {
              return res.status(400).json({
                message:
                  "Tickets can only be assigned to IT staff",
              });
            }

            updateData.assignedToUser =
              assignedUser._id;

            updateData.assignedTo =
              assignedUser.name;
          }
        } else {
          delete updateData.assignedTo;
        }

        // ------------------------------------------------------
        // Validate resolution summary
        // ------------------------------------------------------

        if (
          updateData.resolutionSummary !==
          undefined
        ) {
          if (
            typeof updateData.resolutionSummary !==
            "string"
          ) {
            return res.status(400).json({
              message:
                "Resolution summary must be text",
            });
          }

          updateData.resolutionSummary =
            updateData.resolutionSummary.trim();

          if (
            updateData.resolutionSummary.length >
            2000
          ) {
            return res.status(400).json({
              message:
                "Resolution summary cannot exceed 2000 characters",
            });
          }
        }
      }

      // ========================================================
      // TRACK CHANGES
      // ========================================================

      const changes = [];

      if (
        updateData.status &&
        updateData.status !==
          existingTicket.status
      ) {
        if (
          updateData.status === "Reopen"
        ) {
          changes.push(
            `Ticket was reopened from ${existingTicket.status}.`
          );
        } else {
          changes.push(
            `Status changed from ${existingTicket.status} to ${updateData.status}.`
          );
        }
      }

      if (
        updateData.priority &&
        updateData.priority !==
          existingTicket.priority
      ) {
        changes.push(
          `Priority changed from ${existingTicket.priority} to ${updateData.priority}.`
        );
      }

      if (
        updateData.category &&
        updateData.category !==
          existingTicket.category
      ) {
        changes.push(
          `Category changed from ${existingTicket.category} to ${updateData.category}.`
        );
      }

      // ========================================================
      // ASSIGNMENT ACTIVITY
      // ========================================================

      if (
        Object.prototype.hasOwnProperty.call(
          updateData,
          "assignedToUser"
        )
      ) {
        if (
          !updateData.assignedToUser
        ) {
          if (
            existingTicket.assignedToUser ||
            existingTicket.assignedTo !==
              "Unassigned"
          ) {
            changes.push(
              `Ticket unassigned from ${existingTicket.assignedTo}.`
            );
          }
        } else {
          const currentAssigneeId =
            existingTicket.assignedToUser?._id
              ? String(
                  existingTicket
                    .assignedToUser
                    ._id
                )
              : null;

          if (
            currentAssigneeId !==
            String(
              updateData.assignedToUser
            )
          ) {
            changes.push(
              `Ticket assigned to ${updateData.assignedTo}.`
            );
          }
        }
      }

      // ========================================================
      // TITLE ACTIVITY
      // ========================================================

      if (
        updateData.title &&
        updateData.title !==
          existingTicket.title
      ) {
        changes.push(
          "Ticket title was updated."
        );
      }

      // ========================================================
      // DESCRIPTION ACTIVITY
      // ========================================================

      if (
        updateData.description &&
        updateData.description !==
          existingTicket.description
      ) {
        changes.push(
          "Ticket description was updated."
        );
      }

      // ========================================================
      // RESOLUTION
      // ========================================================

      if (
        updateData.status === "Resolved" &&
        existingTicket.status !==
          "Resolved"
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

        updateData.resolvedBy =
          req.user.id;

        updateData.resolvedAt =
          new Date();

        changes.push(
          "Ticket was resolved."
        );
      }

      // ========================================================
      // REOPEN / LEAVE RESOLVED
      // ========================================================

      if (
        updateData.status &&
        updateData.status !== "Resolved" &&
        existingTicket.status ===
          "Resolved"
      ) {
        updateData.resolvedBy = null;
        updateData.resolvedAt = null;
        updateData.resolutionSummary = "";

        if (
          updateData.status !== "Reopen"
        ) {
          changes.push(
            "Ticket resolution information was cleared."
          );
        }
      }

      // ========================================================
      // NEVER TRUST CLIENT RESOLUTION METADATA
      // ========================================================

      if (
        req.body.resolvedBy !== undefined ||
        req.body.resolvedAt !== undefined
      ) {
        if (
          req.user.role ===
          "Requester"
        ) {
          return res.status(403).json({
            message:
              "You cannot modify resolution metadata",
          });
        }

        delete req.body.resolvedBy;
        delete req.body.resolvedAt;
      }

      // ========================================================
      // UPDATE TICKET
      // ========================================================

      const ticket =
        await Ticket.findByIdAndUpdate(
          req.params.id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        )
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

      // ========================================================
      // RECORD ACTIVITY
      // ========================================================

      if (changes.length > 0) {
        let action = "Updated";

        if (
          changes.length === 1 &&
          changes[0].startsWith(
            "Ticket was reopened"
          )
        ) {
          action = "Reopened";
        } else if (
          changes.length === 1 &&
          changes[0].startsWith(
            "Status changed"
          )
        ) {
          action = "Status Changed";
        } else if (
          changes.length === 1 &&
          changes[0].startsWith(
            "Priority changed"
          )
        ) {
          action = "Priority Changed";
        } else if (
          changes.length === 1 &&
          changes[0].startsWith(
            "Category changed"
          )
        ) {
          action = "Category Changed";
        } else if (
          changes.length === 1 &&
          changes[0].startsWith(
            "Ticket assigned"
          )
        ) {
          action = "Assigned";
        }

        await TicketActivity.create({
          ticket: ticket._id,
          action,
          description: changes.join(" "),
          performedBy: req.user.name,
        });
      }

      return res.status(200).json(ticket);
    } catch (error) {
      console.error(
        "Update ticket error:",
        error
      );

      return res.status(400).json({
        message: "Failed to update ticket",
      });
    }
  }
);

// ============================================================
// DELETE TICKET
// ============================================================

router.delete(
  "/:id",
  protect,
  authorize("Administrator"),
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid ticket ID",
        });
      }

      const ticket =
        await Ticket.findByIdAndDelete(
          req.params.id
        );

      if (!ticket) {
        return res.status(404).json({
          message: "Ticket not found",
        });
      }

      await TicketActivity.deleteMany({
        ticket: ticket._id,
      });

      await TicketComment.deleteMany({
        ticket: ticket._id,
      });

      return res.status(200).json({
        message:
          "Ticket deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete ticket error:",
        error
      );

      return res.status(400).json({
        message:
          "Failed to delete ticket",
      });
    }
  }
);

module.exports = router;