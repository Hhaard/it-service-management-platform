import { useEffect, useState } from "react";
import Login from "./Login";
import Tickets from "./components/Tickets";
import TicketDetails from "./components/TicketDetails";
import Users from "./components/Users";
import ChangePassword from "./ChangePassword";

import "./App.css";

const API_URL = "http://localhost:5000/api";


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
// APP
// ============================================================

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser =
      localStorage.getItem("user");

    try {
      return savedUser
        ? JSON.parse(savedUser)
        : null;
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
  };

  const [currentPage, setCurrentPage] =
    useState("dashboard");

  const [selectedTicket, setSelectedTicket] =
    useState(null);

  const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    priority: "Medium",
    requester: "",
  });

  const [creating, setCreating] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

  const [tickets, setTickets] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [dashboardData, setDashboardData] =
    useState(null);

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState("");


// ============================================================
// FETCH TICKETS
// ============================================================

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Your session has expired. Please sign in again."
        );

        setCurrentUser(null);
        return;
      }

      const response = await fetch(
        `${API_URL}/tickets`,
        {
          method: "GET",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCurrentUser(null);

        return;
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to load tickets."
          );

        throw new Error(message);
      }

      const data =
        await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "The server returned an unexpected ticket response."
        );
      }

      setTickets(data);
    } catch (err) {
      console.error(
        "Fetch tickets error:",
        err
      );

      setError(
        err.message ||
          "Unable to load tickets. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


// ============================================================
// FETCH DASHBOARD
// ============================================================

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      setDashboardError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setDashboardError(
          "Your session has expired. Please sign in again."
        );

        setCurrentUser(null);
        return;
      }

      const response = await fetch(
        `${API_URL}/dashboard`,
        {
          method: "GET",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCurrentUser(null);

        return;
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to load dashboard analytics."
          );

        throw new Error(message);
      }

      const data =
        await response.json();

      if (
        !data ||
        typeof data !== "object"
      ) {
        throw new Error(
          "The server returned an unexpected dashboard response."
        );
      }

      setDashboardData(data);
    } catch (err) {
      console.error(
        "Fetch dashboard error:",
        err
      );

      setDashboardError(
        err.message ||
          "Unable to load dashboard analytics. Please try again."
      );
    } finally {
      setDashboardLoading(false);
    }
  };


// ============================================================
// REFRESH DASHBOARD
// ============================================================

  const refreshDashboard = async () => {
    await Promise.all([
      fetchTickets(),
      fetchDashboard(),
    ]);
  };


// ============================================================
// FORM INPUT
// ============================================================

  const handleInputChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


// ============================================================
// CREATE TICKET
// ============================================================

  const handleCreateTicket = async (
    event
  ) => {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setCreateError(
          "Your session has expired. Please sign in again."
        );

        setCurrentUser(null);
        return;
      }

      const response = await fetch(
        `${API_URL}/tickets`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            requester:
              currentUser.name,
          }),
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCurrentUser(null);

        return;
      }

      if (!response.ok) {
        const message =
          await getApiErrorMessage(
            response,
            "Unable to create ticket."
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

      setTickets((previous) => [
        data,
        ...previous,
      ]);

      setFormData({
        title: "",
        description: "",
        category: "Other",
        priority: "Medium",
        requester:
          currentUser.name,
      });

      setShowCreateForm(false);

      await fetchDashboard();
    } catch (err) {
      console.error(
        "Create ticket error:",
        err
      );

      setCreateError(
        err.message ||
          "Unable to create ticket. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };


// ============================================================
// INITIAL DATA LOAD
// ============================================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setFormData((previous) => ({
      ...previous,
      requester:
        currentUser.name,
    }));

    fetchTickets();
    fetchDashboard();
  }, [currentUser]);


// ============================================================
// DASHBOARD DATA
// ============================================================

  const summary =
    dashboardData?.summary || {};

  const totalTickets =
    summary.totalTickets || 0;

  const openTickets =
    summary.openTickets || 0;

  const inProgressTickets =
    summary.inProgressTickets || 0;

  const resolvedTickets =
    summary.resolvedTickets || 0;

  const closedTickets =
    summary.closedTickets || 0;

  const reopenedTickets =
    summary.reopenedTickets || 0;

  const criticalTickets =
    summary.criticalTickets || 0;

  const resolutionRate =
    summary.resolutionRate || 0;

  const averageResolutionTimeHours =
    summary.averageResolutionTimeHours || 0;

  const slaCompliance =
    summary.slaCompliance || 0;

  const categoryCounts =
    dashboardData?.categoryCounts || {
      Hardware: 0,
      Software: 0,
      Network: 0,
      Access: 0,
      Other: 0,
    };

  const priorityCounts =
    dashboardData?.priorityCounts || {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

  const statusCounts =
    dashboardData?.statusCounts || {
      Open: 0,
      "In Progress": 0,
      Resolved: 0,
      Closed: 0,
      Reopen: 0,
    };

  const slaCounts =
    dashboardData?.slaCounts || {
      "On Track": 0,
      "At Risk": 0,
      Breached: 0,
      Completed: 0,
      Unknown: 0,
    };


// ============================================================
// LOGIN
// ============================================================

  if (!currentUser) {
    return (
      <Login
        onLogin={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }


// ============================================================
// FORCE PASSWORD CHANGE
// ============================================================

  const mustChangePassword =
    localStorage.getItem(
      "mustChangePassword"
    ) === "true";

  if (mustChangePassword) {
    return (
      <ChangePassword
        onPasswordChanged={() => {
          window.location.reload();
        }}
      />
    );
  }


// ============================================================
// PERMISSIONS
// ============================================================

  const canAccessUsers = [
    "Administrator",
    "Manager",
    "IT Support Agent",
  ].includes(currentUser.role);


// ============================================================
// CREATE TICKET MODAL
// ============================================================

  const openCreateTicket = () => {
    setCreateError("");

    setFormData((previous) => ({
      ...previous,
      requester:
        currentUser.name,
    }));

    setShowCreateForm(true);
  };


// ============================================================
// MAIN APPLICATION
// ============================================================

  return (
    <div className="app">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            IT
          </div>

          <div className="brand-text">
            <h1>ITSM</h1>

            <span>
              Service Management
            </span>
          </div>
        </div>


        <nav className="navigation">

          <button
            type="button"
            className={`nav-item ${
              currentPage === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setCurrentPage(
                "dashboard"
              )
            }
          >
            <span className="nav-icon">
              ▦
            </span>

            <span>
              Dashboard
            </span>
          </button>


          <button
            type="button"
            className={`nav-item ${
              currentPage === "tickets"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setCurrentPage(
                "tickets"
              )
            }
          >
            <span className="nav-icon">
              ▤
            </span>

            <span>
              Tickets
            </span>
          </button>


          {canAccessUsers && (
            <button
              type="button"
              className={`nav-item ${
                currentPage === "users"
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setCurrentPage(
                  "users"
                )
              }
            >
              <span className="nav-icon">
                ◎
              </span>

              <span>
                Users
              </span>
            </button>
          )}


          <button
            type="button"
            className={`nav-item ${
              currentPage === "reports"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setCurrentPage(
                "reports"
              )
            }
          >
            <span className="nav-icon">
              ▥
            </span>

            <span>
              Reports
            </span>
          </button>

        </nav>


        <div className="sidebar-bottom">

          <div className="system-status">
            <span className="status-dot"></span>

            <span>
              API Connected
            </span>
          </div>


          <div className="user-card">

            <div className="avatar">
              {currentUser.name
                .split(" ")
                .map(
                  (name) =>
                    name[0]
                )
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>


            <div className="user-info">

              <strong>
                {currentUser.name}
              </strong>

              <span>
                {currentUser.role}
              </span>

            </div>

          </div>


          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>


      {/* ======================================================
          MAIN CONTENT
      ====================================================== */}

      <main className="main-content">

        {/* ====================================================
            TOPBAR
        ==================================================== */}

        <header className="topbar">

          <div className="topbar-heading">

            <p className="eyebrow">
              IT OPERATIONS
            </p>

            <h2>
              {currentPage ===
              "ticket-details"
                ? "Ticket Details"
                : currentPage ===
                  "tickets"
                ? "Tickets"
                : currentPage ===
                  "users"
                ? "User Management"
                : currentPage ===
                  "reports"
                ? "Reports"
                : "Dashboard"}
            </h2>

          </div>


          <button
            type="button"
            className="create-button"
            onClick={
              openCreateTicket
            }
          >
            <span>+</span>

            Create Ticket
          </button>

        </header>


        {/* ====================================================
            CREATE TICKET MODAL
        ==================================================== */}

        {showCreateForm && (
          <div className="modal-overlay">

            <div className="modal">

              <div className="modal-header">

                <div>

                  <p className="eyebrow">
                    SERVICE DESK
                  </p>

                  <h3>
                    Create New Ticket
                  </h3>

                  <p className="modal-subtitle">
                    Submit an issue or service
                    request to the IT team.
                  </p>

                </div>


                <button
                  type="button"
                  className="close-button"
                  onClick={() =>
                    setShowCreateForm(
                      false
                    )
                  }
                  aria-label="Close"
                >
                  ×
                </button>

              </div>


              <form
                onSubmit={
                  handleCreateTicket
                }
              >

                <div className="form-group">

                  <label htmlFor="title">

                    <span className="label-icon">
                      ●
                    </span>

                    TICKET TITLE

                    <span className="required">
                      *
                    </span>

                  </label>


                  <small>
                    Keep the title short and
                    specific.
                  </small>


                  <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Briefly describe the issue..."
                    value={
                      formData.title
                    }
                    onChange={
                      handleInputChange
                    }
                    required
                  />

                </div>


                <div className="form-group">

                  <label htmlFor="description">

                    <span className="label-icon">
                      ▤
                    </span>

                    DESCRIPTION

                    <span className="required">
                      *
                    </span>

                  </label>


                  <small>
                    Provide enough detail to help
                    the IT team troubleshoot the
                    issue.{" "}
                    {
                      formData
                        .description
                        .length
                    }{" "}
                    / 1000
                    {" "}
                    characters.
                  </small>


                  <textarea
                    id="description"
                    name="description"
                    placeholder="Describe the problem, what you were doing when it occurred, and any error messages you received..."
                    value={
                      formData.description
                    }
                    onChange={
                      handleInputChange
                    }
                    rows="9"
                    maxLength={1000}
                    required
                  />

                </div>


                <div className="form-row">

                  <div className="form-group">

                    <label htmlFor="category">

                      <span className="label-icon">
                        ◈
                      </span>

                      CATEGORY

                    </label>


                    <div className="select-wrapper">

                      <select
                        id="category"
                        name="category"
                        value={
                          formData.category
                        }
                        onChange={
                          handleInputChange
                        }
                      >

                        <option value="Hardware">
                          💻 Hardware
                        </option>

                        <option value="Software">
                          ⚙ Software
                        </option>

                        <option value="Network">
                          🌐 Network
                        </option>

                        <option value="Access">
                          🔐 Access
                        </option>

                        <option value="Other">
                          📋 Other
                        </option>

                      </select>

                      <span className="select-arrow"></span>

                    </div>

                  </div>


                  <div className="form-group">

                    <label htmlFor="priority">

                      <span className="label-icon">
                        ◆
                      </span>

                      PRIORITY

                    </label>


                    <div className="select-wrapper">

                      <select
                        id="priority"
                        name="priority"
                        value={
                          formData.priority
                        }
                        onChange={
                          handleInputChange
                        }
                      >

                        <option value="Low">
                          Low — Normal request
                        </option>

                        <option value="Medium">
                          Medium — Standard issue
                        </option>

                        <option value="High">
                          High — Needs attention
                        </option>

                        <option value="Critical">
                          Critical — Urgent
                        </option>

                      </select>

                      <span className="select-arrow"></span>

                    </div>

                  </div>

                </div>


                <div className="form-group">

                  <label htmlFor="requester">

                    <span className="label-icon">
                      ♙
                    </span>

                    REQUESTER

                    <span className="required">
                      *
                    </span>

                  </label>


                  <small>
                    The person reporting the
                    issue.
                  </small>


                  <div className="requester-input">

                    <input
                      id="requester"
                      name="requester"
                      type="text"
                      value={
                        currentUser.name
                      }
                      readOnly
                    />

                  </div>

                </div>


                {createError && (
                  <div
                    className="form-error"
                    role="alert"
                  >
                    {createError}
                  </div>
                )}


                <div className="form-actions">

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() =>
                      setShowCreateForm(
                        false
                      )
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
                      : "Create Ticket"}
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}


        {/* ====================================================
            DASHBOARD PAGE
        ==================================================== */}

        {currentPage ===
          "dashboard" && (
          <section
            id="dashboard"
            className="dashboard"
          >

            <div className="welcome">

              <div className="welcome-content">

                <p className="welcome-kicker">
                  SERVICE DESK OVERVIEW
                </p>

                <h3>
                  Welcome back,{" "}
                  {
                    currentUser.name.split(
                      " "
                    )[0]
                  }
                </h3>

                <p>
                  Monitor your team's service
                  requests, workload, and
                  operational performance.
                </p>

              </div>


              <button
                type="button"
                className="refresh-button"
                onClick={
                  refreshDashboard
                }
                disabled={
                  loading ||
                  dashboardLoading
                }
              >

                <span className="refresh-icon">
                  ↻
                </span>

                {loading ||
                dashboardLoading
                  ? "Refreshing..."
                  : "Refresh"}

              </button>

            </div>


            {/* Dashboard Error */}

            {dashboardError && (
              <div
                className="message error"
                role="alert"
              >

                <div>
                  {dashboardError}
                </div>

                <button
                  type="button"
                  className="retry-button"
                  onClick={
                    fetchDashboard
                  }
                  disabled={
                    dashboardLoading
                  }
                >
                  {dashboardLoading
                    ? "Retrying..."
                    : "Retry"}
                </button>

              </div>
            )}


            {/* Dashboard Metrics */}

            <section className="stats-grid">

              {dashboardLoading ? (

                <div className="message">
                  Loading dashboard
                  analytics...
                </div>

              ) : dashboardError ? (

                <div className="message">
                  Dashboard analytics are
                  temporarily unavailable.
                  Use Retry above to try
                  again.
                </div>

              ) : (

                <>

                  <div className="stat-card">

                    <div className="stat-icon blue">
                      ◆
                    </div>

                    <div className="stat-content">

                      <span>
                        Total Tickets
                      </span>

                      <strong>
                        {totalTickets}
                      </strong>

                      <small>
                        All service requests
                      </small>

                    </div>

                  </div>


                  <div className="stat-card">

                    <div className="stat-icon orange">
                      !
                    </div>

                    <div className="stat-content">

                      <span>
                        Open Tickets
                      </span>

                      <strong>
                        {openTickets}
                      </strong>

                      <small>
                        Awaiting action
                      </small>

                    </div>

                  </div>


                  <div className="stat-card">

                    <div className="stat-icon red">
                      !
                    </div>

                    <div className="stat-content">

                      <span>
                        Critical Tickets
                      </span>

                      <strong>
                        {criticalTickets}
                      </strong>

                      <small>
                        Highest priority
                      </small>

                    </div>

                  </div>


                  <div className="stat-card">

                    <div className="stat-icon green">
                      ✓
                    </div>

                    <div className="stat-content">

                      <span>
                        Resolution Rate
                      </span>

                      <strong>
                        {resolutionRate}%
                      </strong>

                      <small>
                        Resolved or closed
                      </small>

                    </div>

                  </div>


                  <div className="stat-card">

                    <div className="stat-icon blue">
                      ◷
                    </div>

                    <div className="stat-content">

                      <span>
                        Avg. Resolution Time
                      </span>

                      <strong>
                        {
                          averageResolutionTimeHours
                        }
                        h
                      </strong>

                      <small>
                        Average completion time
                      </small>

                    </div>

                  </div>


                  <div className="stat-card">

                    <div className="stat-icon green">
                      ✓
                    </div>

                    <div className="stat-content">

                      <span>
                        SLA Compliance
                      </span>

                      <strong>
                        {slaCompliance}%
                      </strong>

                      <small>
                        Service-level performance
                      </small>

                    </div>

                  </div>

                </>

              )}

            </section>


            {/* Recent Tickets */}

            <section className="tickets-section">

              <div className="section-header">

                <div>

                  <p className="eyebrow">
                    ACTIVITY
                  </p>

                  <h3>
                    Recent Tickets
                  </h3>

                  <p>
                    Latest service desk activity
                  </p>

                </div>


                <button
                  type="button"
                  className="view-all"
                  onClick={() =>
                    setCurrentPage(
                      "tickets"
                    )
                  }
                >
                  View all →
                </button>

              </div>


              {loading && (
                <div className="message">
                  Loading tickets...
                </div>
              )}


              {error && (
                <div
                  className="message error"
                  role="alert"
                >

                  <div>
                    {error}
                  </div>

                  <button
                    type="button"
                    className="retry-button"
                    onClick={
                      fetchTickets
                    }
                    disabled={loading}
                  >
                    {loading
                      ? "Retrying..."
                      : "Retry"}
                  </button>

                </div>
              )}


              {!loading &&
                !error &&
                tickets.length === 0 && (
                  <div className="empty-state">

                    <div className="empty-icon">
                      ▤
                    </div>

                    <h4>
                      No tickets yet
                    </h4>

                    <p>
                      Create your first service
                      ticket to get started.
                    </p>

                    <button
                      type="button"
                      className="submit-button"
                      onClick={
                        openCreateTicket
                      }
                    >
                      Create First Ticket
                    </button>

                  </div>
                )}


              {!loading &&
                !error &&
                tickets.length > 0 && (
                  <div className="ticket-table-wrapper">

                    <table className="ticket-table">

                      <thead>

                        <tr>
                          <th>
                            Ticket
                          </th>

                          <th>
                            Category
                          </th>

                          <th>
                            Priority
                          </th>

                          <th>
                            Status
                          </th>

                          <th>
                            Requester
                          </th>
                        </tr>

                      </thead>


                      <tbody>

                        {tickets
                          .slice(0, 10)
                          .map(
                            (
                              ticket
                            ) => (
                              <tr
                                key={
                                  ticket._id
                                }
                                className="ticket-row"
                                onClick={() => {
                                  setSelectedTicket(
                                    ticket
                                  );

                                  setCurrentPage(
                                    "ticket-details"
                                  );
                                }}
                              >

                                <td>

                                  <div className="ticket-title">

                                    <strong>
                                      {
                                        ticket.title
                                      }
                                    </strong>

                                    <span>
                                      #
                                      {ticket._id
                                        .slice(
                                          -6
                                        )
                                        .toUpperCase()}
                                    </span>

                                  </div>

                                </td>


                                <td>
                                  {
                                    ticket.category
                                  }
                                </td>


                                <td>

                                  <span
                                    className={`priority ${ticket.priority
                                      .toLowerCase()
                                      .replace(
                                        " ",
                                        "-"
                                      )}`}
                                  >
                                    {
                                      ticket.priority
                                    }
                                  </span>

                                </td>


                                <td>

                                  <span
                                    className={`status ${ticket.status
                                      .toLowerCase()
                                      .replace(
                                        " ",
                                        "-"
                                      )}`}
                                  >
                                    {
                                      ticket.status
                                    }
                                  </span>

                                </td>


                                <td>
                                  {
                                    ticket.requester
                                  }
                                </td>

                              </tr>
                            )
                          )}

                      </tbody>

                    </table>

                  </div>
                )}

            </section>

          </section>
        )}


        {/* ====================================================
            REPORTS PAGE
        ==================================================== */}

        {currentPage ===
          "reports" && (
          <section className="reports-page">

            <section className="dashboard-analytics">

              <div className="analytics-heading">

                <div>

                  <p className="eyebrow">
                    PERFORMANCE
                  </p>

                  <h3>
                    Service Desk Analytics
                  </h3>

                  <p>
                    Understand ticket workload,
                    severity, classification,
                    and SLA performance.
                  </p>

                </div>

              </div>


              {dashboardError && (
                <div
                  className="message error"
                  role="alert"
                >

                  <div>
                    {dashboardError}
                  </div>

                  <button
                    type="button"
                    className="retry-button"
                    onClick={
                      fetchDashboard
                    }
                    disabled={
                      dashboardLoading
                    }
                  >
                    {dashboardLoading
                      ? "Retrying..."
                      : "Retry"}
                  </button>

                </div>
              )}


              {dashboardLoading ? (

                <div className="message">
                  Loading report analytics...
                </div>

              ) : dashboardError ? (

                <div className="message">
                  Report analytics are
                  temporarily unavailable.
                  Use Retry above to try
                  again.
                </div>

              ) : (

                <div className="analytics-grid">

                  {/* Tickets by Status */}

                  <div className="analytics-card">

                    <div className="analytics-card-header">

                      <div>

                        <span className="analytics-kicker">
                          WORKFLOW
                        </span>

                        <h3>
                          Tickets by Status
                        </h3>

                      </div>


                      <div className="analytics-total">

                        <strong>
                          {totalTickets}
                        </strong>

                        <span>
                          Total
                        </span>

                      </div>

                    </div>


                    <div className="analytics-list">

                      {Object.entries(
                        statusCounts
                      ).map(
                        ([
                          status,
                          count,
                        ]) => {

                          const percentage =
                            totalTickets ===
                            0
                              ? 0
                              : Math.round(
                                  (count /
                                    totalTickets) *
                                    100
                                );

                          return (
                            <div
                              className="analytics-row"
                              key={
                                status
                              }
                            >

                              <div className="analytics-label">

                                <span>
                                  {
                                    status
                                  }
                                </span>

                                <strong>
                                  {
                                    count
                                  }
                                </strong>

                              </div>


                              <div className="analytics-bar">

                                <div
                                  className={`analytics-fill status-${status
                                    .toLowerCase()
                                    .replace(
                                      " ",
                                      "-"
                                    )}`}
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />

                              </div>


                              <span className="analytics-percentage">
                                {
                                  percentage
                                }%
                              </span>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>


                  {/* Tickets by Priority */}

                  <div className="analytics-card">

                    <div className="analytics-card-header">

                      <div>

                        <span className="analytics-kicker">
                          SEVERITY
                        </span>

                        <h3>
                          Tickets by Priority
                        </h3>

                      </div>


                      <div className="analytics-total">

                        <strong>
                          {
                            criticalTickets
                          }
                        </strong>

                        <span>
                          Critical
                        </span>

                      </div>

                    </div>


                    <div className="analytics-list">

                      {Object.entries(
                        priorityCounts
                      ).map(
                        ([
                          priority,
                          count,
                        ]) => {

                          const percentage =
                            totalTickets ===
                            0
                              ? 0
                              : Math.round(
                                  (count /
                                    totalTickets) *
                                    100
                                );

                          return (
                            <div
                              className="analytics-row"
                              key={
                                priority
                              }
                            >

                              <div className="analytics-label">

                                <span>
                                  {
                                    priority
                                  }
                                </span>

                                <strong>
                                  {
                                    count
                                  }
                                </strong>

                              </div>


                              <div className="analytics-bar">

                                <div
                                  className={`analytics-fill priority-${priority.toLowerCase()}`}
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />

                              </div>


                              <span className="analytics-percentage">
                                {
                                  percentage
                                }%
                              </span>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>


                  {/* Tickets by Category */}

                  <div className="analytics-card">

                    <div className="analytics-card-header">

                      <div>

                        <span className="analytics-kicker">
                          CLASSIFICATION
                        </span>

                        <h3>
                          Tickets by Category
                        </h3>

                      </div>


                      <div className="analytics-total">

                        <strong>
                          {totalTickets}
                        </strong>

                        <span>
                          Tickets
                        </span>

                      </div>

                    </div>


                    <div className="analytics-list">

                      {Object.entries(
                        categoryCounts
                      ).map(
                        ([
                          category,
                          count,
                        ]) => {

                          const percentage =
                            totalTickets ===
                            0
                              ? 0
                              : Math.round(
                                  (count /
                                    totalTickets) *
                                    100
                                );

                          return (
                            <div
                              className="analytics-row"
                              key={
                                category
                              }
                            >

                              <div className="analytics-label">

                                <span>
                                  {
                                    category
                                  }
                                </span>

                                <strong>
                                  {
                                    count
                                  }
                                </strong>

                              </div>


                              <div className="analytics-bar">

                                <div
                                  className="analytics-fill"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />

                              </div>


                              <span className="analytics-percentage">
                                {
                                  percentage
                                }%
                              </span>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>


                  {/* SLA Performance */}

                  <div className="analytics-card">

                    <div className="analytics-card-header">

                      <div>

                        <span className="analytics-kicker">
                          SERVICE LEVEL
                        </span>

                        <h3>
                          SLA Performance
                        </h3>

                      </div>


                      <div className="sla-compliance">

                        <strong>
                          {
                            slaCompliance
                          }%
                        </strong>

                        <span>
                          Compliance
                        </span>

                      </div>

                    </div>


                    <div className="analytics-list">

                      {Object.entries(
                        slaCounts
                      ).map(
                        ([
                          status,
                          count,
                        ]) => {

                          const percentage =
                            totalTickets ===
                            0
                              ? 0
                              : Math.round(
                                  (count /
                                    totalTickets) *
                                    100
                                );

                          return (
                            <div
                              className="analytics-row"
                              key={
                                status
                              }
                            >

                              <div className="analytics-label">

                                <span>
                                  {
                                    status
                                  }
                                </span>

                                <strong>
                                  {
                                    count
                                  }
                                </strong>

                              </div>


                              <div className="analytics-bar">

                                <div
                                  className={`analytics-fill sla-${status
                                    .toLowerCase()
                                    .replace(
                                      " ",
                                      "-"
                                    )}`}
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />

                              </div>


                              <span className="analytics-percentage">
                                {
                                  percentage
                                }%
                              </span>

                            </div>
                          );
                        }
                      )}

                    </div>

                  </div>

                </div>

              )}

            </section>

          </section>
        )}


        {/* ====================================================
            TICKETS PAGE
        ==================================================== */}

        {currentPage ===
          "tickets" && (
          <Tickets
            tickets={tickets}
            onRefresh={() => {
              fetchTickets();
              fetchDashboard();
            }}
            onCreateTicket={
              openCreateTicket
            }
            onSelectTicket={(
              ticket
            ) => {
              setSelectedTicket(
                ticket
              );

              setCurrentPage(
                "ticket-details"
              );
            }}
          />
        )}


        {/* ====================================================
            USERS PAGE
        ==================================================== */}

        {currentPage === "users" &&
          canAccessUsers && (
            <Users
              currentUser={
                currentUser
              }
            />
          )}


        {/* ====================================================
            TICKET DETAILS PAGE
        ==================================================== */}

        {currentPage ===
          "ticket-details" &&
          selectedTicket && (
            <TicketDetails
              ticket={
                selectedTicket
              }
              currentUser={
                currentUser
              }
              onBack={() => {
                setSelectedTicket(
                  null
                );

                setCurrentPage(
                  "tickets"
                );
              }}
              onTicketUpdated={(
                updatedTicket
              ) => {
                setTickets(
                  (previous) =>
                    previous.map(
                      (ticket) =>
                        ticket._id ===
                        updatedTicket._id
                          ? updatedTicket
                          : ticket
                    )
                );

                setSelectedTicket(
                  updatedTicket
                );

                fetchDashboard();
              }}
            />
          )}

      </main>

    </div>
  );
}

export default App;