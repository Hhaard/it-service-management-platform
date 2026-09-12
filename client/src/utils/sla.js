
import { SLA_CONFIG } from "../config/sla";

export const getSlaStatus = (ticket) => {
  const config = SLA_CONFIG[ticket.priority];

  /*
    If the ticket does not have enough information
    to calculate SLA, return Unknown.
  */
  if (!config || !ticket.createdAt) {
    return {
      status: "Unknown",
      label: "SLA Unavailable",
      remainingMinutes: null,
      resolutionDeadline: null,
    };
  }

  const createdAt = new Date(ticket.createdAt);

  const resolutionDeadline = new Date(
    createdAt.getTime() +
      config.resolutionMinutes * 60 * 1000
  );

  /*
    Completed tickets are evaluated using
    their actual resolution time.

    If resolved before the deadline:
      Completed

    If resolved after the deadline:
      Breached
  */
  if (
    ticket.status === "Resolved" ||
    ticket.status === "Closed"
  ) {
    if (!ticket.resolvedAt) {
      return {
        status: "Unknown",
        label: "SLA Unavailable",
        remainingMinutes: null,
        resolutionDeadline,
      };
    }

    const resolvedAt = new Date(
      ticket.resolvedAt
    );

    const resolutionMinutes =
      (resolutionDeadline.getTime() -
        resolvedAt.getTime()) /
      (1000 * 60);

    if (
      resolutionMinutes >= 0
    ) {
      return {
        status: "Completed",
        label: "SLA Completed",
        remainingMinutes: Math.max(
          resolutionMinutes,
          0
        ),
        resolutionDeadline,
      };
    }

    return {
      status: "Breached",
      label: "SLA Breached",
      remainingMinutes: 0,
      resolutionDeadline,
    };
  }

  /*
    Active tickets:
    Open, In Progress, and Reopen
    are evaluated against the current time.
  */
  const now = new Date();

  const remainingMinutes =
    (resolutionDeadline.getTime() -
      now.getTime()) /
    (1000 * 60);

  /*
    Deadline has passed.
  */
  if (remainingMinutes <= 0) {
    return {
      status: "Breached",
      label: "SLA Breached",
      remainingMinutes: 0,
      resolutionDeadline,
    };
  }

  /*
    Calculate how much of the SLA has elapsed.
  */
  const elapsedMinutes =
    (now.getTime() -
      createdAt.getTime()) /
    (1000 * 60);

  const percentUsed =
    (elapsedMinutes /
      config.resolutionMinutes) *
    100;

  /*
    75%+ of SLA consumed = At Risk.
  */
  if (percentUsed >= 75) {
    return {
      status: "At Risk",
      label: "SLA At Risk",
      remainingMinutes,
      resolutionDeadline,
    };
  }

  /*
    Everything else is within SLA.
  */
  return {
    status: "On Track",
    label: "SLA On Track",
    remainingMinutes,
    resolutionDeadline,
  };
};

