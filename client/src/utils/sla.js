import { SLA_CONFIG } from "../config/sla";

export const getSlaStatus = (ticket) => {
  const config = SLA_CONFIG[ticket.priority];

  if (!config || !ticket.createdAt) {
    return {
      status: "Unknown",
      label: "SLA Unavailable",
      remainingMinutes: null,
      resolutionDeadline: null,
    };
  }

  const createdAt = new Date(ticket.createdAt);
  const now = new Date();

  const resolutionDeadline = new Date(
    createdAt.getTime() +
      config.resolutionMinutes * 60 * 1000
  );

  const totalMinutes =
    config.resolutionMinutes;

  const elapsedMinutes =
    (now.getTime() - createdAt.getTime()) /
    (1000 * 60);

  const remainingMinutes =
    (resolutionDeadline.getTime() - now.getTime()) /
    (1000 * 60);

  if (
    ticket.status === "Resolved" ||
    ticket.status === "Closed"
  ) {
    return {
      status: "Completed",
      label: "SLA Completed",
      remainingMinutes: Math.max(
        remainingMinutes,
        0
      ),
      resolutionDeadline,
    };
  }

  if (remainingMinutes <= 0) {
    return {
      status: "Breached",
      label: "SLA Breached",
      remainingMinutes: 0,
      resolutionDeadline,
    };
  }

  const percentUsed =
    (elapsedMinutes / totalMinutes) * 100;

  if (percentUsed >= 75) {
    return {
      status: "At Risk",
      label: "SLA At Risk",
      remainingMinutes,
      resolutionDeadline,
    };
  }

  return {
    status: "On Track",
    label: "SLA On Track",
    remainingMinutes,
    resolutionDeadline,
  };
};