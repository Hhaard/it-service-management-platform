import { useEffect, useState } from "react";
import { getSlaStatus } from "../utils/sla";

function TicketDetails({
  ticket,
  onBack,
  onTicketUpdated,
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    category: ticket.category,
    requester: ticket.requester,
    assignedTo: ticket.assignedTo || "Unassigned",
    assignedToUser:
        ticket.assignedToUser?._id || "",
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const [error, setError] = useState("");

  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
  
        const response = await fetch(
          "http://localhost:5000/api/users"
        );
  
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
  
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setUsersLoading(false);
      }
    };
  
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setActivityLoading(true);

        const response = await fetch(
          `http://localhost:5000/api/tickets/${ticket._id}/activity`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch ticket activity");
        }

        const data = await response.json();
        setActivities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setActivityLoading(false);
      }
    };

    fetchActivities();
  }, [ticket._id]);

  const refreshActivities = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}/activity`
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setActivities(data);
    } catch (err) {
      console.error(err);
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
      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            assignedTo:
              users.find(
                (user) =>
                  user._id === formData.assignedToUser
              )?.name || "Unassigned",
          }),
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

      setIsEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
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
      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}`,
        {
          method: "DELETE",
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
    setWorkflowLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
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

    if (!note.trim()) {
      return;
    }

    setNoteSaving(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/tickets/${ticket._id}/activity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: note,
            performedBy: "Haard Patel",
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

          {!isEditing && ticket.status === "Open" && (
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

          {!isEditing &&
            ticket.status === "In Progress" && (
              <button
                className="workflow-button success"
                onClick={() =>
                  handleWorkflowAction({
                    status: "Resolved",
                  })
                }
                disabled={
                  workflowLoading || deleting
                }
              >
                {workflowLoading
                  ? "Updating..."
                  : "Resolve"}
              </button>
            )}

          {!isEditing &&
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
                  <span>Requester</span>

                  <strong>
                    {ticket.requester}
                  </strong>
                </div>

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
    ticket.assignedTo || "Unassigned"
  )}
</strong>

              </div>

            </div>

          </div>

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
        </>

      ) : (

        <form
          className="ticket-edit-card"
          onSubmit={handleSave}
        >

          <div className="details-card-header">
            <h3>Edit Ticket</h3>
            <span>
              Update ticket information
            </span>
          </div>

          <div className="edit-form">

            <div className="form-group">
              <label>Ticket Title</label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="6"
                maxLength={1000}
                required
              />
            </div>

            <div className="form-row">

              <div className="form-group">
                <label>Status</label>

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

                  <option value="Closed">
                    Closed
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Priority</label>

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
                <label>Category</label>

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


                <div className="form-group">
  <label>Assigned To</label>

  <select
    name="assignedToUser"
    value={formData.assignedToUser}
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
          {user.name} — {user.role} · {user.department}
        </option>
      ))}
  </select>

  <small>
    Select the person responsible for this ticket.
  </small>
</div>

            </div>

          </div>
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