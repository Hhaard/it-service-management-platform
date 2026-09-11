import { useEffect, useState } from "react";
import Login from "./Login";
import Tickets from "./components/Tickets";
import TicketDetails from "./components/TicketDetails";
import Users from "./components/Users";
import ChangePassword from "./ChangePassword";

import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setCurrentUser(null);
  };

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    priority: "Medium",
    requester: "",
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(`${API_URL}/tickets`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCurrentUser(null);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        throw new Error(
          data.message || "Failed to fetch tickets"
        );
      }

      const data = await response.json();

      setTickets(data);
    } catch (err) {
      console.error("Fetch tickets error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCreateTicket = async (event) => {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");

      const response = await fetch(`${API_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...formData,
          requester: currentUser.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create ticket"
        );
      }

      setTickets((previous) => [data, ...previous]);

      setFormData({
        title: "",
        description: "",
        category: "Other",
        priority: "Medium",
        requester: currentUser.name,
      });

      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      setFormData((previous) => ({
        ...previous,
        requester: currentUser.name,
      }));

      fetchTickets();
    }
  }, [currentUser]);

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "Open"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) => ticket.status === "Resolved"
  ).length;

  const closedTickets = tickets.filter(
    (ticket) => ticket.status === "Closed"
  ).length;

  const completedTickets =
    resolvedTickets + closedTickets;

  const resolutionRate =
    totalTickets === 0
      ? 0
      : Math.round(
          (completedTickets / totalTickets) * 100
        );

  const criticalTickets = tickets.filter(
    (ticket) => ticket.priority === "Critical"
  ).length;

  const categoryCounts = {
    Hardware: tickets.filter(
      (ticket) => ticket.category === "Hardware"
    ).length,

    Software: tickets.filter(
      (ticket) => ticket.category === "Software"
    ).length,

    Network: tickets.filter(
      (ticket) => ticket.category === "Network"
    ).length,

    Access: tickets.filter(
      (ticket) => ticket.category === "Access"
    ).length,

    Other: tickets.filter(
      (ticket) => ticket.category === "Other"
    ).length,
  };

  const priorityCounts = {
    Critical: tickets.filter(
      (ticket) => ticket.priority === "Critical"
    ).length,

    High: tickets.filter(
      (ticket) => ticket.priority === "High"
    ).length,

    Medium: tickets.filter(
      (ticket) => ticket.priority === "Medium"
    ).length,

    Low: tickets.filter(
      (ticket) => ticket.priority === "Low"
    ).length,
  };

  if (!currentUser) {
    return (
      <Login
        onLogin={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }
  
  const mustChangePassword =
    localStorage.getItem("mustChangePassword") === "true";
  
  if (mustChangePassword) {
    return (
      <ChangePassword
        onPasswordChanged={() => {
          window.location.reload();
        }}
      />
    );
  }
  
  const canAccessUsers = [
    "Administrator",
    "Manager",
    "IT Support Agent",
  ].includes(currentUser.role);

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">IT</div>

          <div>
            <h1>ITSM</h1>
            <span>Service Management</span>
          </div>
        </div>

        <nav className="navigation">

          <button
            className={`nav-item ${
              currentPage === "dashboard" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("dashboard")}
          >
            <span>▦</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${
              currentPage === "tickets" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("tickets")}
          >
            <span>▤</span>
            Tickets
          </button>

          {/* Users - hidden from Requesters */}
          {canAccessUsers && (
            <button
              className={`nav-item ${
                currentPage === "users" ? "active" : ""
              }`}
              onClick={() => setCurrentPage("users")}
            >
              <span>◎</span>
              Users
            </button>
          )}

          <a href="#reports" className="nav-item">
            <span>▥</span>
            Reports
          </a>

        </nav>

        <div className="sidebar-bottom">

          <div className="system-status">
            <span className="status-dot"></span>
            API Connected
          </div>

          <div className="user-card">

            <div className="avatar">
              {currentUser.name
                .split(" ")
                .map((name) => name[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.role}</span>
            </div>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* Main Content */}
      <main className="main-content">

        <header className="topbar">
          <div>
            <p className="eyebrow">IT OPERATIONS</p>
            <h2>Dashboard</h2>
          </div>

          <button
            className="create-button"
            onClick={() => {
              setCreateError("");
              setFormData((previous) => ({
                ...previous,
                requester: currentUser.name,
              }));
              setShowCreateForm(true);
            }}
          >
            + Create Ticket
          </button>
        </header>

        {/* Create Ticket Modal */}
        {showCreateForm && (
          <div className="modal-overlay">
            <div className="modal">

              <div className="modal-header">
                <div>
                  <p className="eyebrow">SERVICE DESK</p>
                  <h3>Create New Ticket</h3>
                </div>

                <button
                  className="close-button"
                  onClick={() => setShowCreateForm(false)}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateTicket}>

                <div className="form-group">
                  <label htmlFor="title">
                    <span className="label-icon">●</span>
                    TICKET TITLE*
                  </label>

                  <small>
                    (Keep the title short and specific.)
                  </small>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="Briefly describe the issue!!"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">
                    <span className="label-icon">▤</span>
                    DESCRIPTION*
                  </label>

                  <small>
                    (Provide enough detail to help the IT team
                    troubleshoot the issue.){" "}
                    {formData.description.length} / 1000
                    characters.
                  </small>

                  <textarea
                    id="description"
                    name="description"
                    placeholder="Describe the problem, what you were doing when it occurred, and any error messages you received..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="10"
                    maxLength={1000}
                    required
                  />
                </div>

                <div className="form-row">

                  <div className="form-group">
                    <label htmlFor="category">
                      <span className="label-icon">◈</span>
                      CATEGORY
                    </label>

                    <div className="select-wrapper">
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
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
                      <span className="label-icon">◆</span>
                      PRIORITY
                    </label>

                    <div className="select-wrapper">
                      <select
                        id="priority"
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
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
                    <span className="label-icon">♙</span>
                    REQUESTER
                    <span className="required">*</span>
                  </label>

                  <small>
                    The person reporting the issue.
                  </small>

                  <div className="requester-input">
                    <input
                      id="requester"
                      name="requester"
                      type="text"
                      value={currentUser.name}
                      readOnly
                    />
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
                      : "Create Ticket"}
                  </button>

                </div>

              </form>

            </div>
          </div>
        )}

        {/* Dashboard */}
        {currentPage === "dashboard" && (
          <section id="dashboard" className="dashboard">

            <div className="welcome">
              <div>
                <h3>
                  Welcome back,{" "}
                  {currentUser.name.split(" ")[0]}
                </h3>

                <p>
                  Here's an overview of your IT service desk.
                </p>
              </div>

              <button
                className="refresh-button"
                onClick={fetchTickets}
              >
                ↻ Refresh
              </button>
            </div>

            {/* Statistics */}
            <section className="stats-grid">

              <div className="stat-card">
                <div className="stat-icon blue">
                  ◆
                </div>

                <div>
                  <span>Total Tickets</span>
                  <strong>{totalTickets}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon orange">
                  !
                </div>

                <div>
                  <span>Open Tickets</span>
                  <strong>{openTickets}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon red">
                  !
                </div>

                <div>
                  <span>Critical Tickets</span>
                  <strong>{criticalTickets}</strong>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  ✓
                </div>

                <div>
                  <span>Resolution Rate</span>
                  <strong>{resolutionRate}%</strong>
                </div>
              </div>

            </section>

            {/* Tickets */}
            <section
              id="tickets"
              className="tickets-section"
            >

              <div className="section-header">

                <div>
                  <h3>Recent Tickets</h3>
                  <p>Latest service desk activity</p>
                </div>

                <button
                  className="view-all"
                  onClick={() =>
                    setCurrentPage("tickets")
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
                <div className="message error">
                  {error}
                </div>
              )}

              {!loading &&
                !error &&
                tickets.length === 0 && (
                  <div className="empty-state">

                    <div className="empty-icon">
                      ▤
                    </div>

                    <h4>No tickets yet</h4>

                    <p>
                      Create your first service ticket to
                      get started.
                    </p>

                  </div>
                )}

              {!loading &&
                !error &&
                tickets.length > 0 && (
                  <div className="ticket-table-wrapper">

                    <table className="ticket-table">

                      <thead>
                        <tr>
                          <th>Ticket</th>
                          <th>Category</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Requester</th>
                        </tr>
                      </thead>

                      <tbody>

                        {tickets
                          .slice(0, 10)
                          .map((ticket) => (
                            <tr
                              key={ticket._id}
                              className="ticket-row"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setCurrentPage(
                                  "ticket-details"
                                );
                              }}
                            >

                              <td>
                                <div className="ticket-title">
                                  <strong>
                                    {ticket.title}
                                  </strong>

                                  <span>
                                    #
                                    {ticket._id
                                      .slice(-6)
                                      .toUpperCase()}
                                  </span>
                                </div>
                              </td>

                              <td>{ticket.category}</td>

                              <td>
                                <span
                                  className={`priority ${ticket.priority
                                    .toLowerCase()
                                    .replace(
                                      " ",
                                      "-"
                                    )}`}
                                >
                                  {ticket.priority}
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
                                  {ticket.status}
                                </span>
                              </td>

                              <td>
                                {ticket.requester}
                              </td>

                            </tr>
                          ))}

                      </tbody>

                    </table>

                  </div>
                )}

            </section>

            {/* Analytics */}
            <section className="analytics-section">

              <div className="section-header">

                <div>
                  <h3>Ticket Overview</h3>
                  <p>
                    Current ticket distribution by status
                  </p>
                </div>

              </div>

              <div className="status-overview">

                <div className="overview-item">

                  <div className="overview-label">
                    <span>Open</span>
                    <strong>{openTickets}</strong>
                  </div>

                  <div className="overview-bar">
                    <div
                      className="overview-fill open-fill"
                      style={{
                        width: `${
                          totalTickets === 0
                            ? 0
                            : (openTickets /
                                totalTickets) *
                              100
                        }%`,
                      }}
                    ></div>
                  </div>

                </div>

                <div className="overview-item">

                  <div className="overview-label">
                    <span>In Progress</span>
                    <strong>
                      {inProgressTickets}
                    </strong>
                  </div>

                  <div className="overview-bar">
                    <div
                      className="overview-fill progress-fill"
                      style={{
                        width: `${
                          totalTickets === 0
                            ? 0
                            : (inProgressTickets /
                                totalTickets) *
                              100
                        }%`,
                      }}
                    ></div>
                  </div>

                </div>

                <div className="overview-item">

                  <div className="overview-label">
                    <span>Resolved</span>
                    <strong>
                      {resolvedTickets}
                    </strong>
                  </div>

                  <div className="overview-bar">
                    <div
                      className="overview-fill resolved-fill"
                      style={{
                        width: `${
                          totalTickets === 0
                            ? 0
                            : (resolvedTickets /
                                totalTickets) *
                              100
                        }%`,
                      }}
                    ></div>
                  </div>

                </div>

                <div className="overview-item">

                  <div className="overview-label">
                    <span>Closed</span>
                    <strong>
                      {closedTickets}
                    </strong>
                  </div>

                  <div className="overview-bar">
                    <div
                      className="overview-fill closed-fill"
                      style={{
                        width: `${
                          totalTickets === 0
                            ? 0
                            : (closedTickets /
                                totalTickets) *
                              100
                        }%`,
                      }}
                    ></div>
                  </div>

                </div>

              </div>

            </section>

          </section>
        )}

        {/* Tickets */}
        {currentPage === "tickets" && (
          <Tickets
            tickets={tickets}
            onRefresh={fetchTickets}
            onCreateTicket={() => {
              setCreateError("");
              setFormData((previous) => ({
                ...previous,
                requester: currentUser.name,
              }));
              setShowCreateForm(true);
            }}
            onSelectTicket={(ticket) => {
              setSelectedTicket(ticket);
              setCurrentPage("ticket-details");
            }}
          />
        )}

        {/* Users */}
        {currentPage === "users" &&
          canAccessUsers && (
            <Users currentUser={currentUser} />
          )}

        {/* Ticket Details */}
        {currentPage === "ticket-details" &&
          selectedTicket && (
            <TicketDetails
  ticket={selectedTicket}
  currentUser={currentUser}
  onBack={() => {
                setSelectedTicket(null);
                setCurrentPage("tickets");
              }}
              onTicketUpdated={(updatedTicket) => {
                setTickets((previous) =>
                  previous.map((ticket) =>
                    ticket._id === updatedTicket._id
                      ? updatedTicket
                      : ticket
                  )
                );

                setSelectedTicket(updatedTicket);
              }}
            />
          )}

      </main>
    </div>
  );
}

export default App;