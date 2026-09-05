import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api";

function Users() {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
const [editingUser, setEditingUser] = useState(null);
const [editing, setEditing] = useState(false);
const [editError, setEditError] = useState("");
const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
const [userToDeactivate, setUserToDeactivate] = useState(null);
const [deactivating, setDeactivating] = useState(false);
const [deactivationReason, setDeactivationReason] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Requester",
    department: "IT",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/users`);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();

      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");

      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create user"
        );
      }

      setUsers((previous) => [...previous, data]);

      setFormData({
        name: "",
        email: "",
        role: "Requester",
        department: "IT",
      });

      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = async (event) => {
    event.preventDefault();
  
    if (!editingUser) return;
  
    try {
      setEditing(true);
      setEditError("");
  
      const response = await fetch(
        `${API_URL}/users/${editingUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
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
      setEditError(err.message);
    } finally {
      setEditing(false);
    }
  };

  const handleDeactivateUser = async () => {
  if (!userToDeactivate) return;

  try {
    setDeactivating(true);
    setError("");

    const response = await fetch(
      `${API_URL}/users/${userToDeactivate._id}/deactivate`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: deactivationReason,
        }),
      }
    );

    const data = await response.json();

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
    setError(err.message);
  } finally {
    setDeactivating(false);
  }
};
  
  const handleReactivateUser = async (userId) => {
    try {
      const response = await fetch(
        `${API_URL}/users/${userId}/reactivate`,
        {
          method: "PATCH",
        }
      );
  
      const data = await response.json();
  
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
      setError(err.message);
    }
  };

  return (
    <section className="users-page">

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

          <button
            className="create-button"
            onClick={() => {
              setCreateError("");
              setShowCreateForm(true);
            }}
          >
            + Add User
          </button>

        </div>

      </div>

      {loading && (
        <div className="message">
          Loading users...
        </div>
      )}

      {error && (
        <div className="message error">
          {error}
        </div>
      )}

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

            <button
              className="create-button"
              onClick={() => {
                setCreateError("");
                setShowCreateForm(true);
              }}
            >
              + Add User
            </button>

          </div>
        )}

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

    <button
      className="edit-user-button"
      onClick={() => {
        setEditingUser({ ...user });
        setEditError("");
        setShowEditForm(true);
      }}
    >
      Edit
    </button>

    {user.active ? (
  <button
    className="deactivate-user-button"
    onClick={() => {
      setUserToDeactivate(user);
      setShowDeactivateConfirm(true);
    }}
  >
    Deactivate
  </button>
) : (
      <button
        className="reactivate-user-button"
        onClick={() =>
          handleReactivateUser(user._id)
        }
      >
        Reactivate
      </button>
    )}

  </div>
</td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

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

{showDeactivateConfirm && userToDeactivate && (
  <div className="modal-overlay">

    <div className="modal deactivate-modal">

      <div className="deactivate-modal-icon">
        !
      </div>

      <div className="deactivate-modal-content">

        <p className="eyebrow">
          ACCOUNT MANAGEMENT
        </p>

        <h3>Deactivate User?</h3>

        <p>
          Are you sure you want to deactivate{" "}
          <strong>{userToDeactivate.name}</strong>?
        </p>

        <p className="deactivate-warning">
          This user will no longer be available for
          active user assignments.
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
      setDeactivationReason(event.target.value)
    }
    rows="3"
  />

  <small>
    This reason will be saved in the user activity history.
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
    </section>
  );
}

export default Users;