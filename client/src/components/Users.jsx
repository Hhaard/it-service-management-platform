import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function Users({ currentUser }) {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showTemporaryPassword, setShowTemporaryPassword] =
    useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [passwordCopied, setPasswordCopied] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState("");

  const [showDeactivateConfirm, setShowDeactivateConfirm] =
    useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState("");

  const [showActivity, setShowActivity] = useState(false);
const [activityUser, setActivityUser] = useState(null);
const [userActivities, setUserActivities] = useState([]);
const [activityLoading, setActivityLoading] = useState(false);
const [activityError, setActivityError] = useState("");

  // --------------------------------------------------
  // ROLE PERMISSIONS
  // --------------------------------------------------

  const isAdmin = currentUser?.role === "Administrator";
  const isManager = currentUser?.role === "Manager";
  const isAgent = currentUser?.role === "IT Support Agent";

  const canCreateUser = isAdmin;
  const canEditUser = isAdmin || isManager;
  const canManageUserStatus = isAdmin;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Requester",
    department: "IT",
  });

  // --------------------------------------------------
  // FETCH USERS
  // --------------------------------------------------

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      const usersEndpoint = isAdmin
  ? `${API_URL}/users?includeInactive=true`
  : `${API_URL}/users`;

const response = await fetch(usersEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError("Authentication required");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch users"
        );
      }

      setUsers(data);
    } catch (err) {
      console.error("Fetch users error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --------------------------------------------------
  // FORM INPUT
  // --------------------------------------------------

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // CREATE USER
  // --------------------------------------------------

  const handleCreateUser = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setCreateError("Authentication required");
        return;
      }

      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.status === 401) {
        setCreateError("Authentication required");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create user"
        );
      }

      setUsers((previous) => [
        data.user,
        ...previous,
      ]);

      setCreatedUser(data.user);
      setTemporaryPassword(data.temporaryPassword);

      setShowCreateForm(false);

      setShowTemporaryPassword(true);

      setFormData({
        name: "",
        email: "",
        role: "Requester",
        department: "IT",
      });
    } catch (error) {
      console.error("Create user error:", error);
      setCreateError(error.message);
    } finally {
      setCreating(false);
    }
  };

  // --------------------------------------------------
  // COPY TEMPORARY PASSWORD
  // --------------------------------------------------

  const handleCopyTemporaryPassword = async () => {
    try {
      await navigator.clipboard.writeText(
        temporaryPassword
      );

      setPasswordCopied(true);

      setTimeout(() => {
        setPasswordCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy password:",
        error
      );
    }
  };

  // --------------------------------------------------
  // CLOSE TEMPORARY PASSWORD
  // --------------------------------------------------

  const closeTemporaryPassword = () => {
    setShowTemporaryPassword(false);
    setCreatedUser(null);
    setTemporaryPassword("");
    setPasswordCopied(false);
  };

  // --------------------------------------------------
  // EDIT USER
  // --------------------------------------------------

  const handleEditUser = async (event) => {
    event.preventDefault();

    if (!editingUser) return;

    try {
      setEditing(true);
      setEditError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setEditError("Authentication required");
        return;
      }

      const response = await fetch(
        `${API_URL}/users/${editingUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editingUser.name,
            email: editingUser.email,
            role: editingUser.role,
            department: editingUser.department,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setEditError("Authentication required");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update user"
        );
      }

      setUsers((previous) =>
        previous.map((user) =>
          user._id === editingUser._id
            ? data.user
            : user
        )
      );

      setShowEditForm(false);
      setEditingUser(null);
    } catch (err) {
      console.error("Edit user error:", err);
      setEditError(err.message);
    } finally {
      setEditing(false);
    }
  };

  // --------------------------------------------------
  // DEACTIVATE USER
  // --------------------------------------------------

  const handleDeactivateUser = async () => {
    if (!userToDeactivate) return;

    try {
      setDeactivating(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${API_URL}/users/${userToDeactivate._id}/deactivate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: deactivationReason,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setError("Authentication required");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to deactivate user"
        );
      }

      setUsers((previous) =>
        previous.map((user) =>
          user._id === userToDeactivate._id
            ? data.user
            : user
        )
      );

      setShowDeactivateConfirm(false);
      setUserToDeactivate(null);
      setDeactivationReason("");
    } catch (err) {
      console.error(
        "Deactivate user error:",
        err
      );
      setError(err.message);
    } finally {
      setDeactivating(false);
    }
  };

  // --------------------------------------------------
  // REACTIVATE USER
  // --------------------------------------------------

  const handleReactivateUser = async (userId) => {
    try {
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${API_URL}/users/${userId}/reactivate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setError("Authentication required");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to reactivate user"
        );
      }

      setUsers((previous) =>
        previous.map((user) =>
          user._id === userId
            ? data.user
            : user
        )
      );
    } catch (err) {
      console.error(
        "Reactivate user error:",
        err
      );
      setError(err.message);
    }
  };

  // --------------------------------------------------
// USER ACTIVITY HISTORY
// --------------------------------------------------

const handleViewActivity = async (user) => {
  try {
    setActivityUser(user);
    setUserActivities([]);
    setActivityError("");
    setActivityLoading(true);
    setShowActivity(true);

    const token = localStorage.getItem("token");

    if (!token) {
      setActivityError("Authentication required");
      return;
    }

    const response = await fetch(
      `${API_URL}/users/${user._id}/activity`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      setActivityError("Authentication required");
      return;
    }

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to fetch user activity"
      );
    }

    setUserActivities(data);
  } catch (err) {
    console.error(
      "Fetch user activity error:",
      err
    );

    setActivityError(err.message);
  } finally {
    setActivityLoading(false);
  }
};

const closeActivity = () => {
  setShowActivity(false);
  setActivityUser(null);
  setUserActivities([]);
  setActivityError("");
};

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <section className="users-page">

      {/* PAGE HEADER */}

      <div className="page-heading">

        <div>
          <p className="eyebrow">
            ADMINISTRATION
          </p>

          <h2>Users</h2>

          <p className="page-description">
            Manage users, roles, departments, and account status.
          </p>
        </div>

        <div className="users-page-actions">

          <div className="users-count">
            {users.length}{" "}
            {users.length === 1
              ? "user"
              : "users"}
          </div>

          {canCreateUser && (
            <button
              className="create-button"
              onClick={() => {
                setCreateError("");
                setShowCreateForm(true);
              }}
            >
              + Add User
            </button>
          )}

        </div>

      </div>

      {/* LOADING */}

      {loading && (
        <div className="message">
          Loading users...
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

      {/* EMPTY STATE */}

      {!loading &&
        !error &&
        users.length === 0 && (
          <div className="empty-state">

            <div className="empty-icon">
              ◎
            </div>

            <h4>No users found</h4>

            <p>
              Add your first user to start managing
              your service desk team.
            </p>

            {canCreateUser && (
              <button
                className="create-button"
                onClick={() => {
                  setCreateError("");
                  setShowCreateForm(true);
                }}
              >
                + Add User
              </button>
            )}

          </div>
        )}

      {/* USERS TABLE */}

      {!loading &&
        !error &&
        users.length > 0 && (
          <div className="users-table-wrapper">

            <table className="users-table">

              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {users.map((user) => (
                  <tr key={user._id}>

                    <td>
                      <div className="user-table-info">

                        <div className="user-table-avatar">
                          {user.name
                            .split(" ")
                            .map(
                              (part) =>
                                part[0]
                            )
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {user.name}
                          </strong>

                          <span>
                            {user.email}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>
                      <span className="role-badge">
                        {user.role}
                      </span>
                    </td>

                    <td>
                      {user.department}
                    </td>

                    <td>
                      <span
                        className={`user-status ${
                          user.active
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {user.active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>

                      <div className="user-actions">

                        {canEditUser && (
                          <div>
                            <button
                              className="secondary-button"
                              onClick={() => handleViewActivity(user)}
                            >
                              View Activity
                            </button>
                            <button
                              className="edit-user-button"
                              onClick={() => {
                                setEditingUser({
                                  ...user,
                                });
                                setEditError("");
                                setShowEditForm(true);
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        )}

                        {canManageUserStatus &&
                          (user.active ? (
                            <button
                              className="deactivate-user-button"
                              onClick={() => {
                                setUserToDeactivate(user);
                                setDeactivationReason("");
                                setShowDeactivateConfirm(true);
                              }}
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              className="reactivate-user-button"
                              onClick={() =>
                                handleReactivateUser(
                                  user._id
                                )
                              }
                            >
                              Reactivate
                            </button>
                          ))}

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      {/* CREATE USER MODAL */}

      {showCreateForm && (
        <div className="modal-overlay">

          <div className="modal user-modal">

            <div className="modal-header">

              <div>
                <p className="eyebrow">
                  ADMINISTRATION
                </p>

                <h3>Add New User</h3>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() =>
                  setShowCreateForm(false)
                }
              >
                ×
              </button>

            </div>

            <form onSubmit={handleCreateUser}>

              <div className="form-group">

                <label htmlFor="user-name">
                  FULL NAME
                </label>

                <small>
                  Enter the user's full name.
                </small>

                <input
                  id="user-name"
                  name="name"
                  type="text"
                  placeholder="e.g. John Smith"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="user-email">
                  EMAIL ADDRESS
                </label>

                <small>
                  Use a unique work email address.
                </small>

                <input
                  id="user-email"
                  name="email"
                  type="email"
                  placeholder="e.g. john.smith@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="user-role">
                    ROLE
                  </label>

                  <select
                    id="user-role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="Administrator">
                      Administrator
                    </option>

                    <option value="IT Support Agent">
                      IT Support Agent
                    </option>

                    <option value="Manager">
                      Manager
                    </option>

                    <option value="Requester">
                      Requester
                    </option>
                  </select>

                </div>

                <div className="form-group">

                  <label htmlFor="user-department">
                    DEPARTMENT
                  </label>

                  <select
                    id="user-department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  >
                    <option value="IT">
                      IT
                    </option>

                    <option value="Management">
                      Management
                    </option>

                    <option value="HR">
                      HR
                    </option>

                    <option value="Finance">
                      Finance
                    </option>

                    <option value="Operations">
                      Operations
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>

                </div>

              </div>

              {createError && (
                <div className="form-error">
                  {createError}
                </div>
              )}

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() =>
                    setShowCreateForm(false)
                  }
                  disabled={creating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={creating}
                >
                  {creating
                    ? "Creating..."
                    : "Create User"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* TEMPORARY PASSWORD MODAL */}

      {showTemporaryPassword && createdUser && (
        <div className="modal-overlay">

          <div className="modal temporary-password-modal">

            <div className="modal-header">

              <div>
                <h2>
                  User Created Successfully
                </h2>

                <p>
                  Give the user their temporary login credentials.
                </p>
              </div>

            </div>

            <div className="temporary-user-summary">

              <strong>
                {createdUser.name}
              </strong>

              <span>
                {createdUser.email}
              </span>

            </div>

            <div className="temporary-password-section">

              <label>
                Temporary Password
              </label>

              <div className="temporary-password-box">

                <span>
                  {temporaryPassword}
                </span>

                <button
                  type="button"
                  onClick={handleCopyTemporaryPassword}
                  className="copy-password-button"
                >
                  {passwordCopied
                    ? "Copied!"
                    : "Copy"}
                </button>

              </div>

            </div>

            <div className="temporary-password-warning">
              This temporary password is shown only once.
              Share it securely with the user.
            </div>

            <div className="modal-actions">

              <button
                type="button"
                className="submit-button"
                onClick={closeTemporaryPassword}
              >
                Done
              </button>

            </div>

          </div>

        </div>
      )}

      {/* EDIT USER MODAL */}

      {showEditForm && editingUser && (
        <div className="modal-overlay">

          <div className="modal user-modal">

            <div className="modal-header">

              <div>
                <p className="eyebrow">
                  ADMINISTRATION
                </p>

                <h3>Edit User</h3>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingUser(null);
                }}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleEditUser}>

              <div className="form-group">

                <label htmlFor="edit-user-name">
                  FULL NAME
                </label>

                <small>
                  Update the user's full name.
                </small>

                <input
                  id="edit-user-name"
                  name="name"
                  type="text"
                  value={editingUser.name}
                  onChange={(event) =>
                    setEditingUser({
                      ...editingUser,
                      name: event.target.value,
                    })
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="edit-user-email">
                  EMAIL ADDRESS
                </label>

                <small>
                  Update the user's email address.
                </small>

                <input
                  id="edit-user-email"
                  name="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(event) =>
                    setEditingUser({
                      ...editingUser,
                      email: event.target.value,
                    })
                  }
                  required
                />

              </div>

              <div className="form-row">

                <div className="form-group">

                  <label htmlFor="edit-user-role">
                    ROLE
                  </label>

                  <select
                    id="edit-user-role"
                    value={editingUser.role}
                    onChange={(event) =>
                      setEditingUser({
                        ...editingUser,
                        role: event.target.value,
                      })
                    }
                  >
                    <option value="Administrator">
                      Administrator
                    </option>

                    <option value="IT Support Agent">
                      IT Support Agent
                    </option>

                    <option value="Manager">
                      Manager
                    </option>

                    <option value="Requester">
                      Requester
                    </option>
                  </select>

                </div>

                <div className="form-group">

                  <label htmlFor="edit-user-department">
                    DEPARTMENT
                  </label>

                  <select
                    id="edit-user-department"
                    value={editingUser.department}
                    onChange={(event) =>
                      setEditingUser({
                        ...editingUser,
                        department: event.target.value,
                      })
                    }
                  >
                    <option value="IT">
                      IT
                    </option>

                    <option value="Management">
                      Management
                    </option>

                    <option value="HR">
                      HR
                    </option>

                    <option value="Finance">
                      Finance
                    </option>

                    <option value="Operations">
                      Operations
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>

                </div>

              </div>

              {editError && (
                <div className="form-error">
                  {editError}
                </div>
              )}

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingUser(null);
                  }}
                  disabled={editing}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={editing}
                >
                  {editing
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* DEACTIVATE USER MODAL */}

      {showDeactivateConfirm &&
        userToDeactivate && (
          <div className="modal-overlay">

            <div className="modal deactivate-modal">

              <div className="deactivate-modal-icon">
                !
              </div>

              <div className="deactivate-modal-content">

                <p className="eyebrow">
                  ACCOUNT MANAGEMENT
                </p>

                <h3>
                  Deactivate User?
                </h3>

                <p>
                  Are you sure you want to deactivate{" "}
                  <strong>
                    {userToDeactivate.name}
                  </strong>
                  ?
                </p>

                <p className="deactivate-warning">
                  This user will no longer be available
                  for active user assignments.
                </p>

                <div className="deactivation-reason">

                  <label htmlFor="deactivation-reason">
                    REASON FOR DEACTIVATION
                  </label>

                  <textarea
                    required
                    id="deactivation-reason"
                    placeholder="e.g. Employee left the organization"
                    value={deactivationReason}
                    onChange={(event) =>
                      setDeactivationReason(
                        event.target.value
                      )
                    }
                    rows="3"
                  />

                  <small>
                    This reason will be saved in the
                    user activity history.
                  </small>

                </div>

              </div>

              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowDeactivateConfirm(false);
                    setUserToDeactivate(null);
                    setDeactivationReason("");
                  }}
                  disabled={deactivating}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="confirm-deactivate-button"
                  onClick={handleDeactivateUser}
                  disabled={
                    deactivating ||
                    !deactivationReason.trim()
                  }
                >
                  {deactivating
                    ? "Deactivating..."
                    : "Yes, Deactivate"}
                </button>

              </div>

            </div>

          </div>
        )}

        {/* USER ACTIVITY MODAL */}
{showActivity && activityUser && (
  <div className="modal-overlay">
    <div className="modal activity-modal">
      <div className="modal-header">
        <div>
          <h2>User Activity</h2>
          <p>
            Activity history for{" "}
            <strong>{activityUser.name}</strong>
          </p>
        </div>

        <button
          className="modal-close"
          onClick={closeActivity}
        >
          ×
        </button>
      </div>

      {activityLoading ? (
        <div className="activity-state">
          Loading activity...
        </div>
      ) : activityError ? (
        <div className="activity-error">
          {activityError}
        </div>
      ) : userActivities.length === 0 ? (
        <div className="activity-state">
          No activity recorded for this user.
        </div>
      ) : (
        <div className="activity-list">
          {userActivities.map((activity) => (
            <div
              className="activity-item"
              key={activity._id}
            >
              <div className="activity-icon">
                {activity.action === "Created"
                  ? "+"
                  : activity.action === "Deactivated"
                  ? "−"
                  : activity.action === "Reactivated"
                  ? "✓"
                  : "↻"}
              </div>

              <div className="activity-content">
                <div className="activity-top">
                  <strong>{activity.action}</strong>

                  <span>
                    {new Date(
                      activity.createdAt
                    ).toLocaleString()}
                  </span>
                </div>

                <p>{activity.description}</p>

                <small>
                  Performed by:{" "}
                  <strong>
                    {activity.performedBy}
                  </strong>
                </small>

                {activity.reason && (
                  <small>
                    Reason: {activity.reason}
                  </small>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="modal-actions">
        <button
          className="secondary-button"
          onClick={closeActivity}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </section>
  );
}



export default Users;