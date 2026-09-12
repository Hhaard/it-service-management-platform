const express = require("express");

const Ticket = require("../models/Ticket");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

/* =========================================
   SLA CONFIGURATION
========================================= */

const SLA_CONFIG = {
  Low: {
    resolutionMinutes: 3 * 24 * 60, // 3 days
  },

  Medium: {
    resolutionMinutes: 2 * 24 * 60, // 2 days
  },

  High: {
    resolutionMinutes: 8 * 60, // 8 hours
  },

  Critical: {
    resolutionMinutes: 4 * 60, // 4 hours
  },
};

/* =========================================
   GET DASHBOARD ANALYTICS
========================================= */

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
      /* =====================================
         FILTER TICKETS BY USER
      ===================================== */

      let filter = {};

      /*
        Requesters should only receive analytics
        for their own tickets.
      */
      if (req.user.role === "Requester") {
        filter.requester = req.user.name;
      }

      const tickets = await Ticket.find(
        filter
      ).lean();

      /* =====================================
         BASIC TICKET COUNTS
      ===================================== */

      const totalTickets = tickets.length;

      const openTickets = tickets.filter(
        (ticket) =>
          ticket.status === "Open"
      ).length;

      const inProgressTickets =
        tickets.filter(
          (ticket) =>
            ticket.status === "In Progress"
        ).length;

      const resolvedTickets =
        tickets.filter(
          (ticket) =>
            ticket.status === "Resolved"
        ).length;

      const closedTickets =
        tickets.filter(
          (ticket) =>
            ticket.status === "Closed"
        ).length;

      const reopenedTickets =
        tickets.filter(
          (ticket) =>
            ticket.status === "Reopen"
        ).length;

      const criticalTickets =
        tickets.filter(
          (ticket) =>
            ticket.priority === "Critical"
        ).length;

      /* =====================================
         RESOLUTION RATE
      ===================================== */

      const completedTickets =
        resolvedTickets + closedTickets;

      const resolutionRate =
        totalTickets === 0
          ? 0
          : Math.round(
              (completedTickets /
                totalTickets) *
                100
            );

      /* =====================================
         AVERAGE RESOLUTION TIME
      ===================================== */

      const resolvedWithDates =
        tickets.filter(
          (ticket) =>
            ticket.resolvedAt &&
            ticket.createdAt
        );

      let averageResolutionTimeHours = 0;

      if (
        resolvedWithDates.length > 0
      ) {
        const totalResolutionTime =
          resolvedWithDates.reduce(
            (total, ticket) => {
              const created =
                new Date(
                  ticket.createdAt
                ).getTime();

              const resolved =
                new Date(
                  ticket.resolvedAt
                ).getTime();

              return (
                total +
                (resolved - created)
              );
            },
            0
          );

        averageResolutionTimeHours =
          totalResolutionTime /
          resolvedWithDates.length /
          (1000 * 60 * 60);

        averageResolutionTimeHours =
          Math.round(
            averageResolutionTimeHours *
              100
          ) / 100;
      }

      /* =====================================
         CATEGORY COUNTS
      ===================================== */

      const categoryCounts = {
        Hardware: 0,
        Software: 0,
        Network: 0,
        Access: 0,
        Other: 0,
      };

      tickets.forEach((ticket) => {
        if (
          Object.prototype.hasOwnProperty.call(
            categoryCounts,
            ticket.category
          )
        ) {
          categoryCounts[
            ticket.category
          ]++;
        }
      });

      /* =====================================
         PRIORITY COUNTS
      ===================================== */

      const priorityCounts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
      };

      tickets.forEach((ticket) => {
        if (
          Object.prototype.hasOwnProperty.call(
            priorityCounts,
            ticket.priority
          )
        ) {
          priorityCounts[
            ticket.priority
          ]++;
        }
      });

      /* =====================================
         STATUS COUNTS
      ===================================== */

      const statusCounts = {
        Open: openTickets,
        "In Progress":
          inProgressTickets,
        Resolved: resolvedTickets,
        Closed: closedTickets,
        Reopen: reopenedTickets,
      };

      /* =====================================
         SLA ANALYTICS
      ===================================== */

      const slaCounts = {
        "On Track": 0,
        "At Risk": 0,
        Breached: 0,
        Completed: 0,
        Unknown: 0,
      };

      /*
        SLA status rules:

        Completed:
          Ticket has been resolved/closed
          within its SLA.

        Breached:
          Ticket has passed its deadline
          without being completed OR
          was completed after its deadline.

        At Risk:
          75% or more of the SLA has elapsed.

        On Track:
          Less than 75% of the SLA has elapsed.

        Unknown:
          Missing creation date or
          unsupported priority.
      */

      const now = new Date();

      tickets.forEach((ticket) => {
        const config =
          SLA_CONFIG[ticket.priority];

        if (
          !config ||
          !ticket.createdAt
        ) {
          slaCounts.Unknown++;
          return;
        }

        const createdAt =
          new Date(ticket.createdAt);

        const resolutionDeadline =
          new Date(
            createdAt.getTime() +
              config.resolutionMinutes *
                60 *
                1000
          );

        /*
          For resolved/closed tickets,
          compare actual resolution time
          against the SLA deadline.
        */

        if (
          ticket.status === "Resolved" ||
          ticket.status === "Closed"
        ) {
          if (
            ticket.resolvedAt
          ) {
            const resolvedAt =
              new Date(
                ticket.resolvedAt
              );

            if (
              resolvedAt.getTime() <=
              resolutionDeadline.getTime()
            ) {
              slaCounts.Completed++;
            } else {
              slaCounts.Breached++;
            }

            return;
          }

          /*
            Completed ticket without a
            resolution date cannot reliably
            determine SLA.
          */
          slaCounts.Unknown++;
          return;
        }

        /*
          Open / In Progress / Reopen tickets
          are evaluated against current time.
        */

        const remainingMinutes =
          (resolutionDeadline.getTime() -
            now.getTime()) /
          (1000 * 60);

        if (
          remainingMinutes <= 0
        ) {
          slaCounts.Breached++;
          return;
        }

        const elapsedMinutes =
          (now.getTime() -
            createdAt.getTime()) /
          (1000 * 60);

        const percentUsed =
          (elapsedMinutes /
            config.resolutionMinutes) *
          100;

        if (
          percentUsed >= 75
        ) {
          slaCounts["At Risk"]++;
        } else {
          slaCounts["On Track"]++;
        }
      });

      /* =====================================
         SLA COMPLIANCE
      ===================================== */

      const validSlaTickets =
        totalTickets -
        slaCounts.Unknown;

      let slaCompliance = 0;

      if (
        validSlaTickets > 0
      ) {
        const compliantTickets =
          slaCounts["On Track"] +
          slaCounts.Completed;

        slaCompliance =
          Math.round(
            (compliantTickets /
              validSlaTickets) *
              100
          );
      }

      /* =====================================
         RESPONSE
      ===================================== */

      return res.status(200).json({
        summary: {
          totalTickets,
          openTickets,
          inProgressTickets,
          resolvedTickets,
          closedTickets,
          reopenedTickets,
          criticalTickets,
          resolutionRate,
          averageResolutionTimeHours,
          slaCompliance,
        },

        categoryCounts,

        priorityCounts,

        statusCounts,

        slaCounts,
      });
    } catch (error) {
      console.error(
        "Dashboard analytics error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to fetch dashboard analytics",
      });
    }
  }
);

module.exports = router;