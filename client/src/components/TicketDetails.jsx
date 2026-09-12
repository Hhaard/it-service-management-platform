import { useEffect, useState } from "react";
import { getSlaStatus } from "../utils/sla";

import API_URL from "../config/api";


// ============================================================
// API ERROR HELPER
// ============================================================

const getApiErrorMessage = async (
  response,
  fallbackMessage
) => {
  try {
    const data = await response.json();

    return (
      data.message ||
      fallbackMessage
    );
  } catch {
    return fallbackMessage;
  }
};


// ============================================================
// SESSION HANDLER
// ============================================================

const handleSessionExpired = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // App.jsx will detect the missing user and
  // display the Login screen after reload.
  window.location.reload();
};


// ============================================================
// TICKET DETAILS
// ============================================================

function TicketDetails({
  ticket,
  onBack,
  onTicketUpdated,
  currentUser,
}) {
  const [isEditing, setIsEditing] =
    useState(false);

  const isRequester =
    currentUser?.role === "Requester";

  const canManageTicket = [
    "Administrator",
    "IT Support Agent",
    "Manager",
  ].includes(currentUser?.role);

  const canDelete =
    currentUser?.role === "Administrator";


  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    requester: ticket.requester,
    assignedTo:
      ticket.assignedTo || "Unassigned",
    assignedToUser:
      ticket.assignedToUser?._id || "",
    resolutionSummary:
      ticket.resolutionSummary || "",
  });


  // ==========================================================
  // LOADING / ERROR STATE
  // ==========================================================

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [workflowLoading, setWorkflowLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [activities, setActivities] =
    useState([]);

  const [activityLoading, setActivityLoading] =
    useState(true);

  const [activityError, setActivityError] =
    useState("");

  const [note, setNote] =
    useState("");

  const [noteSaving, setNoteSaving] =
    useState(false);

  const [comments, setComments] =
    useState([]);

  const [commentsLoading, setCommentsLoading] =
    useState(true);

  const [commentsError, setCommentsError] =
    useState("");

  const [comment, setComment] =
    useState("");

  const [commentSaving, setCommentSaving] =
    useState(false);

  const [users, setUsers] =
    useState([]);

  const [usersLoading, setUsersLoading] =
    useState(true);

  const [usersError, setUsersError] =
    useState("");


  // ==========================================================
  // SYNC FORM WITH TICKET
  // ==========================================================

  useEffect(() => {
    setFormData({
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      requester: ticket.requester,
      assignedTo:
        ticket.assignedTo || "Unassigned",
      assignedToUser:
        ticket.assignedToUser?._id || "",
      resolutionSummary:
        ticket.resolutionSummary || "",
    });

    setIsEditing(false);
    setError("");
  }, [ticket]);


  // ==========================================================
  // FETCH USERS
  // ==========================================================

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setUsersError("");

        const token =
          localStorage.getItem("token");

        if (!token) {
          handleSessionExpired();
          return;
        }

        const response = await fetch(
          `${API_URL}/users`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          handleSessionExpired();
          return;
        }

        if (!response.ok) {
          const message =
            await getApiErrorMessage(
              response,
              "Unable to load users for ticket assignment."
            );

          throw new Error(message);
        }

        const data =
          await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "The server returned an unexpected user response."
          );
        }

        setUsers(data);
      } catch (err) {
        console.error(
          "Fetch users error:",
          err
        );

        setUsersError(
          err.message ||
            "Unable to load users for ticket assignment."
        );
      } finally {
        setUsersLoading(false);
      }
    };

    if (canManageTicket) {
      fetchUsers();
    } else {
      setUsers([]);
      setUsersLoading(false);
      setUsersError("");
    }
  }, [canManageTicket]);


  // ==========================================================
  // FETCH TICKET ACTIVITY
  // ==========================================================

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setActivityLoading(true);
        setActivityError("");

        const token =
          localStorage.getItem("token");

        if (!token) {
          handleSessionExpired();
          return;
        }

        const response = await fetch(
          `${API_URL}/tickets/${ticket._id}/activity`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          handleSessionExpired();
          return;
        }

        if (!response.ok) {
          const message =
            await getApiErrorMessage(
              response,
              "Unable to load ticket activity."
            );

          throw new Error(message);
        }

        const data =
          await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "The server returned an unexpected activity response."
          );
        }

        setActivities(data);
      } catch (err) {
        console.error(
          "Fetch ticket activity error:",
          err
        );

        setActivityError(
          err.message ||
            "Unable to load ticket activity."
        );
      } finally {
        setActivityLoading(false);
      }
    };

    if (canManageTicket) {
      fetchActivities();
    } else {
      setActivities([]);
      setActivityLoading(false);
      setActivityError("");
    }
  }, [ticket._id, canManageTicket]);


  // ==========================================================
  // FETCH PUBLIC COMMENTS
  // ==========================================================

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setCommentsLoading(true);
        setCommentsError("");

        const token =
          localStorage.getItem("token");

        if (!token) {
          handleSessionExpired();
          return;
        }

        const response = await fetch(
          `${API_URL}/tickets/${ticket._id}/comments`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          handleSessionExpired();
          return;
        }

        if (!response.ok) {
          const message =
            await getApiErrorMessage(
              response,
              "Unable to load ticket conversation."
            );

          throw new Error(message);
        }

        const data =
          await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "The server returned an unexpected comments response."
          );
        }

        setComments(data);
      } catch (err) {
        console.error(
          "Fetch ticket comments error:",
          err
        );

        setCommentsError(
          err.message ||
            "Unable to load ticket conversation."
        );
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [ticket._id]);


  // ==========================================================
  // REFRESH ACTIVITIES
  // ==========================================================

  const refreshActivities = async () => {
    if (!canManageTicket) {
      return false;
    }

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        handleSessionExpired();
        return false;
      }

      const response = await fetch(
        `${API_URL}/tickets/${ticket._id}/activity`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return false;
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to refresh ticket activity."
          );

        throw new Error(message);
      }

      const data =
        await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "The server returned an unexpected activity response."
        );
      }

      setActivities(data);
      setActivityError("");

      return true;
    } catch (err) {
      console.error(
        "Refresh activities error:",
        err
      );

      setActivityError(
        err.message ||
          "Unable to refresh ticket activity."
      );

      return false;
    }
  };


  // ==========================================================
  // FORM INPUT
  // ==========================================================

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };


  // ==========================================================
  // SAVE TICKET
  // ==========================================================

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        handleSessionExpired();
        return;
      }

      let updateData;

      if (isRequester) {
        updateData = {
          title: formData.title,
          description:
            formData.description,
        };
      } else {
        updateData = {
          ...formData,
          assignedTo:
            users.find(
              (user) =>
                user._id ===
                formData.assignedToUser
            )?.name ||
            "Unassigned",
        };
      }

      const response = await fetch(
        `${API_URL}/tickets/${ticket._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify(
            updateData
          ),
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to update ticket."
          );

        throw new Error(message);
      }

      const data =
        await response.json();

      if (!data || !data._id) {
        throw new Error(
          "The server returned an unexpected ticket response."
        );
      }

      onTicketUpdated(data);

      if (canManageTicket) {
        await refreshActivities();
      }

      setIsEditing(false);
    } catch (err) {
      console.error(
        "Update ticket error:",
        err
      );

      setError(
        err.message ||
          "Unable to update ticket. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };


  // ==========================================================
  // DELETE TICKET
  // ==========================================================

  const handleDelete = async () => {
    if (!canDelete) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ticket #${ticket._id
          .slice(-6)
          .toUpperCase()}?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        handleSessionExpired();
        return;
      }

      const response = await fetch(
        `${API_URL}/tickets/${ticket._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to delete ticket."
          );

        throw new Error(message);
      }

      onBack();
    } catch (err) {
      console.error(
        "Delete ticket error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete ticket. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };


  // ==========================================================
  // WORKFLOW ACTION
  // ==========================================================

  const handleWorkflowAction = async (
    updates
  ) => {
    if (!canManageTicket) {
      return;
    }

    setWorkflowLoading(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        handleSessionExpired();
        return;
      }

      const response = await fetch(
        `${API_URL}/tickets/${ticket._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify(
            updates
          ),
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to update ticket workflow."
          );

        throw new Error(message);
      }

      const data =
        await response.json();

      if (!data || !data._id) {
        throw new Error(
          "The server returned an unexpected ticket response."
        );
      }

      onTicketUpdated(data);

      await refreshActivities();
    } catch (err) {
      console.error(
        "Workflow update error:",
        err
      );

      setError(
        err.message ||
          "Unable to update ticket workflow. Please try again."
      );
    } finally {
      setWorkflowLoading(false);
    }
  };


  // ==========================================================
  // ADD INTERNAL NOTE
  // ==========================================================

  const handleAddNote = async (
    event
  ) => {
    event.preventDefault();

    if (
      !canManageTicket ||
      !note.trim()
    ) {
      return;
    }

    setNoteSaving(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        handleSessionExpired();
        return;
      }

      const response = await fetch(
        `${API_URL}/tickets/${ticket._id}/activity`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            description:
              note.trim(),
          }),
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to add internal note."
          );

        throw new Error(message);
      }

      const data =
        await response.json();

      if (!data || !data._id) {
        throw new Error(
          "The server returned an unexpected activity response."
        );
      }

      setActivities((previous) => [
        data,
        ...previous,
      ]);

      setActivityError("");
      setNote("");
    } catch (err) {
      console.error(
        "Add internal note error:",
        err
      );

      setError(
        err.message ||
          "Unable to add internal note. Please try again."
      );
    } finally {
      setNoteSaving(false);
    }
  };


  // ==========================================================
  // ADD PUBLIC COMMENT
  // ==========================================================

  const handleAddComment = async (
    event
  ) => {
    event.preventDefault();

    if (!comment.trim()) {
      return;
    }

    setCommentSaving(true);
    setError("");

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        handleSessionExpired();
        return;
      }

      const response = await fetch(
        `${API_URL}/tickets/${ticket._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            message:
              comment.trim(),
          }),
        }
      );

      if (response.status === 401) {
        handleSessionExpired();
        return;
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to send message."
          );

        throw new Error(message);
      }

      const data =
        await response.json();

      if (!data || !data._id) {
        throw new Error(
          "The server returned an unexpected comment response."
        );
      }

      setComments((previous) => [
        ...previous,
        data,
      ]);

      setCommentsError("");
      setComment("");
    } catch (err) {
      console.error(
        "Add public comment error:",
        err
      );

      setError(
        err.message ||
          "Unable to send message. Please try again."
      );
    } finally {
      setCommentSaving(false);
    }
  };


  // ==========================================================
  // SLA
  // ==========================================================

  const sla =
    getSlaStatus(ticket);


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="ticket-details-page">

      <button
        className="back-button"
        onClick={onBack}
        disabled={
          saving ||
          deleting ||
          workflowLoading ||
          noteSaving ||
          commentSaving
        }
      >
        ← Back to Tickets
      </button>


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="ticket-details-header">

        <div>

          <p className="eyebrow">
            SERVICE DESK / TICKET
          </p>

          <div className="ticket-id">
            #
            {ticket._id
              .slice(-6)
              .toUpperCase()}
          </div>

          <h2>
            {ticket.title}
          </h2>

          <p className="ticket-created">
            Created{" "}
            {new Date(
              ticket.createdAt
            ).toLocaleString()}
          </p>

        </div>


        <div className="ticket-header-actions">

          {/* ==================================================
              START WORK
          ================================================== */}

          {canManageTicket &&
            !isEditing &&
            ticket.status === "Open" && (
              <button
                className="workflow-button primary"
                onClick={() =>
                  handleWorkflowAction({
                    status:
                      "In Progress",
                  })
                }
                disabled={
                  workflowLoading ||
                  deleting ||
                  saving
                }
              >
                {workflowLoading
                  ? "Updating..."
                  : "Start Work"}
              </button>
            )}


          {/* ==================================================
              RESOLVE
          ================================================== */}

          {canManageTicket &&
            !isEditing &&
            ticket.status ===
              "In Progress" && (
              <button
                className="workflow-btn resolve"
                onClick={() => {
                  setError("");

                  setFormData(
                    (previous) => ({
                      ...previous,
                      status:
                        "Resolved",
                    })
                  );

                  setIsEditing(true);
                }}
                disabled={
                  workflowLoading ||
                  deleting ||
                  saving
                }
              >
                Resolve
              </button>
            )}


          {/* ==================================================
              CLOSE
          ================================================== */}

          {canManageTicket &&
            !isEditing &&
            ticket.status ===
              "Resolved" && (
              <button
                className="workflow-button primary"
                onClick={() =>
                  handleWorkflowAction({
                    status: "Closed",
                  })
                }
                disabled={
                  workflowLoading ||
                  deleting ||
                  saving
                }
              >
                {workflowLoading
                  ? "Updating..."
                  : "Close Ticket"}
              </button>
            )}


          {/* ==================================================
              REOPEN
          ================================================== */}

          {canManageTicket &&
            !isEditing &&
            ticket.status ===
              "Resolved" && (
              <button
                className="workflow-button reopen"
                onClick={() =>
                  handleWorkflowAction({
                    status: "Reopen",
                  })
                }
                disabled={
                  workflowLoading ||
                  deleting ||
                  saving
                }
              >
                {workflowLoading
                  ? "Updating..."
                  : "Reopen Ticket"}
              </button>
            )}


          {/* ==================================================
              DELETE
          ================================================== */}

          {canDelete && (
            <button
              className="delete-ticket-button"
              onClick={handleDelete}
              disabled={
                workflowLoading ||
                deleting ||
                saving
              }
            >
              {deleting
                ? "Deleting..."
                : "Delete Ticket"}
            </button>
          )}


          {/* ==================================================
              EDIT
          ================================================== */}

          <button
            className="edit-ticket-button"
            onClick={() => {
              setError("");
              setIsEditing(
                !isEditing
              );
            }}
            disabled={
              workflowLoading ||
              deleting ||
              saving
            }
          >
            {isEditing
              ? "Cancel Edit"
              : "Edit Ticket"}
          </button>

        </div>

      </div>


      {/* ======================================================
          GENERAL ERROR
      ====================================================== */}

      {error && (
        <div
          className="form-error"
          role="alert"
        >
          {error}
        </div>
      )}


      {/* ======================================================
          VIEW MODE
      ====================================================== */}

      {!isEditing ? (

        <>

          {/* ==================================================
              TICKET DETAILS
          ================================================== */}

          <div className="ticket-details-grid">

            <div className="details-card main-details">

              <div className="details-card-header">
                <h3>
                  Ticket Information
                </h3>
              </div>

              <div className="description-section">

                <label>
                  Description
                </label>

                <p>
                  {ticket.description}
                </p>

              </div>

            </div>


            {/* =================================================
                TICKET PROPERTIES
            ================================================= */}

            <div className="details-card">

              <div className="details-card-header">
                <h3>
                  Ticket Properties
                </h3>
              </div>

              <div className="property-list">

                <div className="property">

                  <span>
                    SLA
                  </span>

                  <strong
                    className={`sla-badge ${sla.status
                      .toLowerCase()
                      .replace(
                        " ",
                        "-"
                      )}`}
                  >
                    {sla.label}
                  </strong>

                </div>


                <div className="property">

                  <span>
                    Resolution Target
                  </span>

                  <strong>
                    {sla.resolutionDeadline
                      ? sla.resolutionDeadline.toLocaleString()
                      : "Unavailable"}
                  </strong>

                </div>


                <div className="property">

                  <span>
                    Priority
                  </span>

                  <strong
                    className={`priority ${ticket.priority
                      .toLowerCase()
                      .replace(
                        " ",
                        "-"
                      )}`}
                  >
                    {ticket.priority}
                  </strong>

                </div>


                <div className="property">

                  <span>
                    Category
                  </span>

                  <strong>
                    {ticket.category}
                  </strong>

                </div>


                <div className="property">

                  <span>
                    Created By
                  </span>

                  <strong className="assigned-user-display">

                    {ticket.createdBy ? (
                      <>

                        <span>
                          {ticket.createdBy.name}
                        </span>

                        <small>
                          {ticket.createdBy.role}{" "}
                          ·{" "}
                          {ticket.createdBy.department}
                        </small>

                      </>
                    ) : (
                      "Not Recorded"
                    )}

                  </strong>

                </div>


                <div className="property">

                  <span>
                    Assigned To
                  </span>

                  <strong className="assigned-user-display">

                    {ticket.assignedToUser ? (
                      <>

                        <span>
                          {ticket.assignedToUser.name}
                        </span>

                        <small>
                          {ticket.assignedToUser.role}{" "}
                          ·{" "}
                          {ticket.assignedToUser.department}
                        </small>

                      </>
                    ) : (
                      ticket.assignedTo ||
                      "Unassigned"
                    )}

                  </strong>

                </div>

              </div>

            </div>

          </div>


          {/* ==================================================
              RESOLUTION INFORMATION
          ================================================== */}

          <div className="details-card resolution-details-card">

            <div className="details-card-header">

              <div>

                <h3>
                  Resolution Information
                </h3>

                <span>
                  Details about how and when
                  this ticket was resolved
                </span>

              </div>

            </div>


            <div className="resolution-info-grid">

              <div className="resolution-info-item resolution-summary-item">

                <span>
                  Resolution Summary
                </span>

                <strong>
                  {ticket.resolutionSummary?.trim()
                    ? ticket.resolutionSummary
                    : "No resolution recorded"}
                </strong>

              </div>


              <div className="resolution-info-item">

                <span>
                  Resolved By
                </span>

                <strong>
                  {ticket.resolvedBy?.name ||
                    "—"}
                </strong>

              </div>


              <div className="resolution-info-item">

                <span>
                  Resolved At
                </span>

                <strong>
                  {ticket.resolvedAt
                    ? new Date(
                        ticket.resolvedAt
                      ).toLocaleString()
                    : "—"}
                </strong>

              </div>

            </div>

          </div>


          {/* ==================================================
              STAFF ACTIVITY
          ================================================== */}

          {canManageTicket && (
            <div className="activity-card">

              <div className="details-card-header">

                <div>
                  <h3>
                    Activity
                  </h3>
                </div>

                <span>
                  Ticket history
                </span>

              </div>


              {activityError && (
                <div
                  className="form-error"
                  role="alert"
                >
                  {activityError}
                </div>
              )}


              <div className="activity-list">

                {activityLoading ? (
                  <div className="activity-loading">
                    Loading activity...
                  </div>
                ) : activities.length ===
                  0 ? (
                  <div className="activity-empty">
                    No activity recorded
                    yet.
                  </div>
                ) : (
                  activities.map(
                    (activity) => (
                      <div
                        className={`activity-item ${
                          activity.action ===
                          "Internal Note"
                            ? "internal-note-item"
                            : ""
                        }`}
                        key={
                          activity._id
                        }
                      >

                        <div className="activity-marker">
                          <span></span>
                        </div>

                        <div className="activity-content">

                          <div className="activity-top">

                            <strong>
                              {
                                activity.action
                              }
                            </strong>

                            <time>
                              {new Date(
                                activity.createdAt
                              ).toLocaleString()}
                            </time>

                          </div>

                          <p>
                            {
                              activity.description
                            }
                          </p>

                          <small>
                            By{" "}
                            {
                              activity.performedBy
                            }
                          </small>

                        </div>

                      </div>
                    )
                  )
                )}

              </div>


              {/* =================================================
                  INTERNAL NOTES
              ================================================= */}

              <form
                className="internal-note-form"
                onSubmit={
                  handleAddNote
                }
              >

                <div className="internal-note-heading">

                  <div>

                    <strong>
                      Add Internal Note
                    </strong>

                    <small>
                      (Visible to IT staff)
                    </small>

                  </div>

                </div>


                <textarea
                  value={note}
                  onChange={(event) =>
                    setNote(
                      event.target.value
                    )
                  }
                  placeholder="Add troubleshooting details, investigation notes, or follow-up information..."
                  maxLength={1000}
                  rows="4"
                  disabled={
                    noteSaving ||
                    workflowLoading ||
                    deleting
                  }
                />


                <div className="internal-note-footer">

                  <span>
                    {note.length} / 1000
                  </span>

                  <button
                    type="submit"
                    className="add-note-button"
                    disabled={
                      noteSaving ||
                      !note.trim() ||
                      workflowLoading ||
                      deleting
                    }
                  >
                    {noteSaving
                      ? "Adding..."
                      : "Add Note"}
                  </button>

                </div>

              </form>

            </div>
          )}


          {/* ==================================================
              PUBLIC CONVERSATION
          ================================================== */}

          <div className="public-conversation">

            <div className="public-conversation-header">

              <div>

                <h3>
                  Public Conversation
                </h3>

                <span>
                  Messages visible to the
                  requester and IT staff
                </span>

              </div>

              <span className="conversation-badge">
                Customer Visible
              </span>

            </div>


            {commentsError && (
              <div
                className="form-error"
                role="alert"
              >
                {commentsError}
              </div>
            )}


            <div className="conversation-list">

              {commentsLoading ? (
                <div className="conversation-empty">
                  Loading conversation...
                </div>
              ) : comments.length ===
                0 ? (
                <div className="conversation-empty">
                  No public messages yet.
                </div>
              ) : (
                comments.map(
                  (item) => (
                    <div
                      className={`conversation-message ${
                        item.authorRole ===
                        "Requester"
                          ? "requester-message"
                          : "staff-message"
                      }`}
                      key={
                        item._id
                      }
                    >

                      <div className="conversation-message-header">

                        <div>

                          <strong>
                            {
                              item.authorName
                            }
                          </strong>

                          <span>
                            {
                              item.authorRole
                            }
                          </span>

                        </div>

                        <time>
                          {new Date(
                            item.createdAt
                          ).toLocaleString()}
                        </time>

                      </div>

                      <p>
                        {item.message}
                      </p>

                    </div>
                  )
                )
              )}

            </div>


            {/* =================================================
                PUBLIC COMMENT FORM
            ================================================= */}

            <form
              className="public-comment-form"
              onSubmit={
                handleAddComment
              }
            >

              <textarea
                value={comment}
                onChange={(event) =>
                  setComment(
                    event.target.value
                  )
                }
                placeholder="Write a message to the requester or IT support..."
                maxLength={2000}
                rows="4"
                disabled={
                  commentSaving ||
                  workflowLoading ||
                  deleting
                }
              />


              <div className="public-comment-footer">

                <span>
                  {comment.length} / 2000
                </span>

                <button
                  type="submit"
                  className="public-comment-button"
                  disabled={
                    commentSaving ||
                    !comment.trim() ||
                    workflowLoading ||
                    deleting
                  }
                >
                  {commentSaving
                    ? "Sending..."
                    : "Send Message"}
                </button>

              </div>

            </form>

          </div>

        </>

      ) : (

        /* ======================================================
           EDIT MODE
        ====================================================== */

        <form
          className="ticket-edit-card"
          onSubmit={handleSave}
        >

          <div className="details-card-header">

            <h3>
              Edit Ticket
            </h3>

            <span>
              {isRequester
                ? "Update your ticket details"
                : "Update ticket information"}
            </span>

          </div>


          <div className="edit-form">

            {/* =================================================
                TITLE
            ================================================= */}

            <div className="form-group">

              <label>
                Ticket Title
              </label>

              <input
                type="text"
                name="title"
                value={
                  formData.title
                }
                onChange={
                  handleChange
                }
                required
                disabled={saving}
              />

            </div>


            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div className="form-group">

              <label>
                Description
              </label>

              <textarea
                name="description"
                value={
                  formData.description
                }
                onChange={
                  handleChange
                }
                rows="6"
                maxLength={1000}
                required
                disabled={saving}
              />

            </div>


            {/* =================================================
                STAFF CONTROLS
            ================================================= */}

            {canManageTicket && (
              <>

                {/* Resolution Summary */}

                {formData.status ===
                  "Resolved" && (
                  <div className="form-group resolution-form-group">

                    <label>
                      Resolution Summary
                    </label>

                    <small>
                      (Required when
                      resolving a
                      ticket.)
                    </small>

                    <textarea
                      name="resolutionSummary"
                      value={
                        formData.resolutionSummary
                      }
                      onChange={
                        handleChange
                      }
                      rows="4"
                      maxLength={1000}
                      placeholder="Describe how the issue was resolved..."
                      required
                      disabled={
                        saving
                      }
                    />

                  </div>
                )}


                {/* Status + Priority */}

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={
                        formData.status
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        saving
                      }
                    >

                      <option value="Open">
                        Open
                      </option>

                      <option value="In Progress">
                        In Progress
                      </option>

                      <option value="Resolved">
                        Resolved
                      </option>

                      <option value="Reopen">
                        Reopen
                      </option>

                      <option value="Closed">
                        Closed
                      </option>

                    </select>

                  </div>


                  <div className="form-group">

                    <label>
                      Priority
                    </label>

                    <select
                      name="priority"
                      value={
                        formData.priority
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        saving
                      }
                    >

                      <option value="Low">
                        Low
                      </option>

                      <option value="Medium">
                        Medium
                      </option>

                      <option value="High">
                        High
                      </option>

                      <option value="Critical">
                        Critical
                      </option>

                    </select>

                  </div>

                </div>


                {/* Category + Assignment */}

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      Category
                    </label>

                    <select
                      name="category"
                      value={
                        formData.category
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        saving
                      }
                    >

                      <option value="Hardware">
                        Hardware
                      </option>

                      <option value="Software">
                        Software
                      </option>

                      <option value="Network">
                        Network
                      </option>

                      <option value="Access">
                        Access
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                  </div>


                  <div className="form-group">

                    <label>
                      Assigned To
                    </label>


                    {usersError && (
                      <div
                        className="form-error"
                        role="alert"
                      >
                        {usersError}
                      </div>
                    )}


                    <select
                      name="assignedToUser"
                      value={
                        formData.assignedToUser
                      }
                      onChange={
                        handleChange
                      }
                      disabled={
                        usersLoading ||
                        usersError ||
                        saving
                      }
                    >

                      <option value="">
                        {usersLoading
                          ? "Loading users..."
                          : usersError
                          ? "Users unavailable"
                          : "Unassigned"}
                      </option>


                      {!usersLoading &&
                        !usersError &&
                        users.map(
                          (user) => (
                            <option
                              key={
                                user._id
                              }
                              value={
                                user._id
                              }
                            >
                              {
                                user.name
                              }{" "}
                              —{" "}
                              {
                                user.role
                              }{" "}
                              ·{" "}
                              {
                                user.department
                              }
                            </option>
                          )
                        )}

                    </select>


                    <small>
                      Select the person
                      responsible for
                      this ticket.
                    </small>

                  </div>

                </div>

              </>
            )}


            {/* =================================================
                REQUESTER INFORMATION
            ================================================= */}

            {isRequester && (
              <div className="requester-edit-info">

                <div className="property">

                  <span>
                    Status
                  </span>

                  <strong>
                    {ticket.status}
                  </strong>

                </div>


                <div className="property">

                  <span>
                    Priority
                  </span>

                  <strong>
                    {ticket.priority}
                  </strong>

                </div>


                <div className="property">

                  <span>
                    Category
                  </span>

                  <strong>
                    {ticket.category}
                  </strong>

                </div>


                <div className="property">

                  <span>
                    Assigned To
                  </span>

                  <strong>
                    {ticket.assignedToUser
                      ? ticket.assignedToUser.name
                      : ticket.assignedTo ||
                        "Unassigned"}
                  </strong>

                </div>


                <small>
                  Status, priority,
                  category, and
                  assignment can only
                  be changed by IT
                  staff.
                </small>

              </div>
            )}

          </div>


          {/* ==================================================
              EDIT ACTIONS
          ================================================== */}

          <div className="edit-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() =>
                setIsEditing(false)
              }
              disabled={saving}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="submit-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>

          </div>

        </form>

      )}

    </section>
  );
}

export default TicketDetails;