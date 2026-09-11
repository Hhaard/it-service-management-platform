import { useState } from "react";

const API_URL = "http://localhost:5000/api";

function ChangePassword({ onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required.");
        return;
      }

      const response = await fetch(
        `${API_URL}/auth/change-password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to change password"
        );
      }

      localStorage.removeItem("mustChangePassword");

      setSuccess(
        "Password changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        onPasswordChanged();
      }, 1000);
    } catch (err) {
      console.error(
        "Change password error:",
        err
      );

      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            ITSM
          </div>

          <h1>Set Your Password</h1>

          <p>
            For security, you must create a new
            password before continuing.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label>Current Password</label>

            <input
              type="password"
              value={currentPassword}
              onChange={(e) =>
                setCurrentPassword(e.target.value)
              }
              placeholder="Enter temporary password"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>New Password</label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              placeholder="Enter new password"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              placeholder="Confirm new password"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success">
              {success}
            </div>
          )}

          <button
            type="submit"
            className="primary-button auth-submit"
            disabled={loading}
          >
            {loading
              ? "Updating Password..."
              : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;