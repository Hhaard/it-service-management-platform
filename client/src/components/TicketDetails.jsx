import { useEffect, useState } from "react";
import { getSlaStatus } from "../utils/sla";

function TicketDetails({
  ticket,
  onBack,
  onTicketUpdated,
  currentUser,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const isRequester = currentUser?.role === "Requester";

  const canManageTicket = [
    "Administrator",
    "IT Support Agent",
    "Manager",
  ].includes(currentUser?.role);

  const canDelete = currentUser?.role === "Administrator";

  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    requester: ticket.requester,
    assignedTo: ticket.assignedTo || "Unassigned",
    assignedToUser: ticket.assignedToUser?._id || "",
    resolutionSummary: ticket.resolutionSummary || "",
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const [error, setError] = useState("");

  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    setFormData({
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      requester: ticket.requester,
      assignedTo: ticket.assignedTo || "Unassigned",
      assignedToUser: ticket.assignedToUser?._id || "",
      resolutionSummary: ticket.resolutionSummary || "",
    });
  }, [ticket]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
          setUsers([]);
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Fetch users error:", err);
      } finally {
        setUsersLoading(false);
      }
    };

    if (canManageTicket) {
      fetchUsers();
    } else {
      setUsersLoading(false);
    }
  }, [canManageTicket]);

  /*
   * Fetch ticket activity only for IT staff.
   * Requesters do not have permission to access
   * the activity/internal-notes endpoint.
   */
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setActivityLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
          setActivities([]);
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/tickets/${ticket._id}/activity`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch ticket activity");
        }

        const data = await response.json();
        setActivities(data);
      } catch (err) {
        console.error("Fetch ticket activity error:", err);
      } finally {
        setActivityLoading(false);
      }
    };

    if (canManageTicket) {
      fetchActivities();
    } else {
      setActivities([]);
      setActivityLoading(false);
    }
  }, [ticket._id, canManageTicket]);

  /*
   * Public comments are available to both staff
   * and Requesters who have access to the ticket.
   */
  useEffect(() => {
    const fetchComments = async () => {
      try {
        setCommentsLoading(true);

        const token = localStorage.getItem("token");

        if (!token) {
          setComments([]);
          return;
        }

        const response = await fetch(
          `http://localhost:5000/api/tickets/${ticket._id}/comments`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch ticket comments");
        }

        const data = await response.json();
        setComments(data);
      } catch (err) {
        console.error(
          "Fetch ticket comments error:",
          err
        );
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [ticket._id]);

  const refreshActivities = async () => {
    if (!canManageTicket) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}/activity`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setActivities(data);
    } catch (err) {
      console.error("Refresh activities error:", err);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication required");
      }

      let updateData;

      if (isRequester) {
        updateData = {
          title: formData.title,
          description: formData.description,
        };
      } else {
        updateData = {
          ...formData,
          assignedTo:
            users.find(
              (user) =>
                user._id === formData.assignedToUser
            )?.name || "Unassigned",
        };
      }

      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update ticket"
        );
      }

      onTicketUpdated(data);

      if (canManageTicket) {
        await refreshActivities();
      }

      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(
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
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete ticket"
        );
      }

      onBack();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleWorkflowAction = async (updates) => {
    if (!canManageTicket) {
      return;
    }

    setWorkflowLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update ticket"
        );
      }

      onTicketUpdated(data);

      await refreshActivities();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkflowLoading(false);
    }
  };

  const handleAddNote = async (event) => {
    event.preventDefault();

    if (!canManageTicket || !note.trim()) {
      return;
    }

    setNoteSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}/activity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description: note,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add internal note"
        );
      }

      setActivities((previous) => [
        data,
        ...previous,
      ]);

      setNote("");
    } catch (err) {
      setError(err.message);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!comment.trim()) {
      return;
    }

    setCommentSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: comment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add comment"
        );
      }

      setComments((previous) => [
        ...previous,
        data,
      ]);

      setComment("");
    } catch (err) {
      setError(err.message);
    } finally {
      setCommentSaving(false);
    }
  };

  const sla = getSlaStatus(ticket);

  return (
    <section className="ticket-details-page">

      <button
        className="back-button"
        onClick={onBack}
      >
        ← Back to Tickets
      </button>

      <div className="ticket-details-header">

        <div>
          <p className="eyebrow">
            SERVICE DESK / TICKET
          </p>

          <div className="ticket-id">
            #{ticket._id.slice(-6).toUpperCase()}
          </div>

          <h2>{ticket.title}</h2>

          <p className="ticket-created">
            Created{" "}
            {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="ticket-header-actions">

          {/* Workflow buttons - staff only */}

          {canManageTicket &&
            !isEditing &&
            ticket.status === "Open" && (
              <button
                className="workflow-button primary"
                onClick={() =>
                  handleWorkflowAction({
                    status: "In Progress",
                  })
                }
                disabled={
                  workflowLoading || deleting
                }
              >
                {workflowLoading
                  ? "Updating..."
                  : "Start Work"}
              </button>
            )}

          {canManageTicket &&
            !isEditing &&
            ticket.status === "In Progress" && (
              <button
                className="workflow-btn resolve"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    status: "Resolved",
                  }));
                  setIsEditing(true);
                }}
              >
                Resolve
              </button>
            )}

          {canManageTicket &&
            !isEditing &&
            ticket.status === "Resolved" && (
              <button
                className="workflow-button primary"
                onClick={() =>
                  handleWorkflowAction({
                    status: "Closed",
                  })
                }
                disabled={
                  workflowLoading || deleting
                }
              >
                {workflowLoading
                  ? "Updating..."
                  : "Close Ticket"}
              </button>
            )}

          {canManageTicket &&
            !isEditing &&
            ticket.status === "Resolved" && (
              <button
                className="workflow-button reopen"
                onClick={() =>
                  handleWorkflowAction({
                    status: "Reopen",
                  })
                }
                disabled={
                  workflowLoading || deleting
                }
              >
                {workflowLoading
                  ? "Updating..."
                  : "Reopen Ticket"}
              </button>
            )}

          {/* Delete - Administrator only */}

          {canDelete && (
            <button
              className="delete-ticket-button"
              onClick={handleDelete}
              disabled={
                workflowLoading || deleting
              }
            >
              {deleting
                ? "Deleting..."
                : "Delete Ticket"}
            </button>
          )}

          {/* Edit */}

          <button
            className="edit-ticket-button"
            onClick={() =>
              setIsEditing(!isEditing)
            }
            disabled={
              workflowLoading || deleting
            }
          >
            {isEditing
              ? "Cancel Edit"
              : "Edit Ticket"}
          </button>

        </div>

      </div>

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      {!isEditing ? (

        <>

          <div className="ticket-details-grid">

            <div className="details-card main-details">

              <div className="details-card-header">
                <h3>Ticket Information</h3>
              </div>

              <div className="description-section">

                <label>Description</label>

                <p>
                  {ticket.description}
                </p>

              </div>

            </div>

            <div className="details-card">

              <div className="details-card-header">
                <h3>Ticket Properties</h3>
              </div>

              <div className="property-list">

                <div className="property">
                  <span>SLA</span>

                  <strong
                    className={`sla-badge ${sla.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {sla.label}
                  </strong>
                </div>

                <div className="property">
                  <span>Resolution Target</span>

                  <strong>
                    {sla.resolutionDeadline
                      ? sla.resolutionDeadline.toLocaleString()
                      : "Unavailable"}
                  </strong>
                </div>

                <div className="property">
                  <span>Priority</span>

                  <strong
                    className={`priority ${ticket.priority
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {ticket.priority}
                  </strong>
                </div>

                <div className="property">
                  <span>Category</span>

                  <strong>
                    {ticket.category}
                  </strong>
                </div>

                <div className="property">
                  <span>Created By</span>

                  <strong className="assigned-user-display">

                    {ticket.createdBy ? (
                      <>
                        <span>
                          {ticket.createdBy.name}
                        </span>

                        <small>
                          {ticket.createdBy.role} ·{" "}
                          {ticket.createdBy.department}
                        </small>
                      </>
                    ) : (
                      "Not Recorded"
                    )}

                  </strong>
                </div>

                <div className="property">
                  <span>Assigned To</span>

                  <strong className="assigned-user-display">

                    {ticket.assignedToUser ? (
                      <>
                        <span>
                          {ticket.assignedToUser.name}
                        </span>

                        <small>
                          {ticket.assignedToUser.role} ·{" "}
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

          {/* Resolution Information */}

          <div className="details-card resolution-details-card">

            <div className="details-card-header">

              <div>
                <h3>Resolution Information</h3>

                <span>
                  Details about how and when this ticket was resolved
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
                  {ticket.resolvedBy?.name || "—"}
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

          {/* Staff Activity + Internal Notes */}

          {canManageTicket && (
            <div className="activity-card">

              <div className="details-card-header">

                <div>
                  <h3>Activity</h3>
                </div>

                <span>
                  Ticket history
                </span>

              </div>

              <div className="activity-list">

                {activityLoading ? (
                  <div className="activity-loading">
                    Loading activity...
                  </div>
                ) : activities.length === 0 ? (
                  <div className="activity-empty">
                    No activity recorded yet.
                  </div>
                ) : (
                  activities.map((activity) => (
                    <div
                      className={`activity-item ${
                        activity.action ===
                        "Internal Note"
                          ? "internal-note-item"
                          : ""
                      }`}
                      key={activity._id}
                    >

                      <div className="activity-marker">
                        <span></span>
                      </div>

                      <div className="activity-content">

                        <div className="activity-top">

                          <strong>
                            {activity.action}
                          </strong>

                          <time>
                            {new Date(
                              activity.createdAt
                            ).toLocaleString()}
                          </time>

                        </div>

                        <p>
                          {activity.description}
                        </p>

                        <small>
                          By {activity.performedBy}
                        </small>

                      </div>

                    </div>
                  ))
                )}

              </div>

              {/* Internal Notes - IT Staff Only */}

              <form
                className="internal-note-form"
                onSubmit={handleAddNote}
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
                    setNote(event.target.value)
                  }
                  placeholder="Add troubleshooting details, investigation notes, or follow-up information..."
                  maxLength={1000}
                  rows="4"
                />

                <div className="internal-note-footer">

                  <span>
                    {note.length} / 1000
                  </span>

                  <button
                    type="submit"
                    className="add-note-button"
                    disabled={
                      noteSaving || !note.trim()
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

          {/* Public Conversation - Staff + Requester */}

          <div className="public-conversation">

            <div className="public-conversation-header">

              <div>
                <h3>
                  Public Conversation
                </h3>

                <span>
                  Messages visible to the requester and IT staff
                </span>
              </div>

              <span className="conversation-badge">
                Customer Visible
              </span>

            </div>

            <div className="conversation-list">

              {commentsLoading ? (
                <div className="conversation-empty">
                  Loading conversation...
                </div>
              ) : comments.length === 0 ? (
                <div className="conversation-empty">
                  No public messages yet.
                </div>
              ) : (
                comments.map((item) => (
                  <div
                    className={`conversation-message ${
                      item.authorRole === "Requester"
                        ? "requester-message"
                        : "staff-message"
                    }`}
                    key={item._id}
                  >

                    <div className="conversation-message-header">

                      <div>

                        <strong>
                          {item.authorName}
                        </strong>

                        <span>
                          {item.authorRole}
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
                ))
              )}

            </div>

            <form
              className="public-comment-form"
              onSubmit={handleAddComment}
            >

              <textarea
                value={comment}
                onChange={(event) =>
                  setComment(event.target.value)
                }
                placeholder="Write a message to the requester or IT support..."
                maxLength={2000}
                rows="4"
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
                    !comment.trim()
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

            {/* Title - Everyone Can Edit */}

            <div className="form-group">

              <label>
                Ticket Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />

            </div>

            {/* Description - Everyone Can Edit */}

            <div className="form-group">

              <label>
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="6"
                maxLength={1000}
                required
              />

            </div>

            {/* Staff-only Controls */}

            {canManageTicket && (
              <>

                {formData.status === "Resolved" && (
                  <div className="form-group resolution-form-group">

                    <label>
                      Resolution Summary
                    </label>

                    <small>
                      (Required when resolving a ticket.)
                    </small>

                    <textarea
                      name="resolutionSummary"
                      value={
                        formData.resolutionSummary
                      }
                      onChange={handleChange}
                      rows="4"
                      maxLength={1000}
                      placeholder="Describe how the issue was resolved..."
                      required
                    />

                  </div>
                )}

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      Status
                    </label>

                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
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
                      value={formData.priority}
                      onChange={handleChange}
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

                <div className="form-row">

                  <div className="form-group">

                    <label>
                      Category
                    </label>

                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
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

                    <select
                      name="assignedToUser"
                      value={
                        formData.assignedToUser
                      }
                      onChange={handleChange}
                    >

                      <option value="">
                        {usersLoading
                          ? "Loading users..."
                          : "Unassigned"}
                      </option>

                      {!usersLoading &&
                        users.map((user) => (
                          <option
                            key={user._id}
                            value={user._id}
                          >
                            {user.name} —{" "}
                            {user.role} ·{" "}
                            {user.department}
                          </option>
                        ))}

                    </select>

                    <small>
                      Select the person responsible
                      for this ticket.
                    </small>

                  </div>

                </div>

              </>
            )}

            {/* Requester Information */}

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
                  Status, priority, category, and
                  assignment can only be changed by
                  IT staff.
                </small>

              </div>
            )}

          </div>

          <div className="edit-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() =>
                setIsEditing(false)
              }
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