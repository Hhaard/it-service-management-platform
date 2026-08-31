import { useEffect, useState } from "react";
import Tickets from "./components/Tickets";
import TicketDetails from "./components/TicketDetails";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    priority: "Medium",
    requester: "Haard Patel",
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

      const response = await fetch(`${API_URL}/tickets`);

      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }

      const data = await response.json();
      setTickets(data);
    } catch (err) {
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
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create ticket");
      }

      setTickets((previous) => [data, ...previous]);

      setFormData({
        title: "",
        description: "",
        category: "Other",
        priority: "Medium",
        requester: "Haard Patel",
      });

      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const totalTickets = tickets.length;

  const openTickets = tickets.filter(
    (ticket) => ticket.status === "Open"
  ).length;

  const inProgressTickets = tickets.filter(
    (ticket) => ticket.status === "In Progress"
  ).length;

  const resolvedTickets = tickets.filter(
    (ticket) =>
      ticket.status === "Resolved" || ticket.status === "Closed"
  ).length;

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

          <a href="#users" className="nav-item">
            <span>♙</span>
            Users
          </a>

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
            <div className="avatar">HP</div>
            <div>
              <strong>Haard Patel</strong>
              <span>Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">IT OPERATIONS</p>
            <h2>Dashboard</h2>
          </div>

          <button className="create-button"
          onClick={() => {
            setCreateError("");
            setShowCreateForm(true);
            }}
>
  + Create Ticket
</button>
        </header>

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
    (Provide enough detail to help the IT team troubleshoot the issue.) {formData.description.length} / 1000 characters.   
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

        <small>What type of issue is this?</small>
        <option value="Hardware">💻 Hardware</option>
        <option value="Software">⚙ Software</option>
        <option value="Network">🌐 Network</option>
        <option value="Access">🔐 Access</option>
        <option value="Other">📋 Other</option>
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
        <small>How urgent is this issue?</small>

        <option value="Low">Low — Normal request</option>
        <option value="Medium">Medium — Standard issue</option>
        <option value="High">High — Needs attention</option>
        <option value="Critical">Critical — Urgent</option>
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
  value={formData.requester}
  onChange={handleInputChange}
  required
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
            onClick={() => setShowCreateForm(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="submit-button"
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
        {currentPage === "dashboard" && (
          <section id="dashboard" className="dashboard">
          <div className="welcome">
            <div>
              <h3>Welcome back, Haard</h3>
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
              <div className="stat-icon blue">▦</div>
              <div>
                <span>Total Tickets</span>
                <strong>{totalTickets}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon orange">!</div>
              <div>
                <span>Open Tickets</span>
                <strong>{openTickets}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">◷</div>
              <div>
                <span>In Progress</span>
                <strong>{inProgressTickets}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">✓</div>
              <div>
                <span>Resolved</span>
                <strong>{resolvedTickets}</strong>
              </div>
            </div>
          </section>

          {/* Tickets */}
          <section id="tickets" className="tickets-section">
            <div className="section-header">
              <div>
                <h3>Recent Tickets</h3>
                <p>Latest service desk activity</p>
              </div>

              <button
  className="view-all"
  onClick={() => setCurrentPage("tickets")}
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

            {!loading && !error && tickets.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">▤</div>
                <h4>No tickets yet</h4>
                <p>
                  Create your first service ticket to get started.
                </p>
              </div>
            )}

            {!loading && !error && tickets.length > 0 && (
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
                  {tickets.slice(0, 10).map((ticket) => (
                  <tr
                    key={ticket._id}
                    className="ticket-row"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setCurrentPage("ticket-details");
                    }}
                  >
                        <td>
                          <div className="ticket-title">
                            <strong>{ticket.title}</strong>
                            <span>
                              #{ticket._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </td>

                        <td>{ticket.category}</td>

                        <td>
                          <span
                            className={`priority ${ticket.priority
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {ticket.priority}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`status ${ticket.status
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {ticket.status}
                          </span>
                        </td>

                        <td>{ticket.requester}</td>
                      </tr>
                    ))
                    
                    }
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
                )}
                {currentPage === "tickets" && (
                  <Tickets
                  tickets={tickets}
                  onRefresh={fetchTickets}
                  onCreateTicket={() => {
                    setCreateError("");
                    setShowCreateForm(true);
                  }}
                  onSelectTicket={(ticket) => {
                    setSelectedTicket(ticket);
                    setCurrentPage("ticket-details");
                  }}
                />
                )}
                {currentPage === "ticket-details" && selectedTicket && (
                  <TicketDetails
                    ticket={selectedTicket}
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