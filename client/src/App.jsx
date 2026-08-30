import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <a href="#dashboard" className="nav-item active">
            <span>▦</span>
            Dashboard
          </a>

          <a href="#tickets" className="nav-item">
            <span>▤</span>
            Tickets
          </a>

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

          <button className="create-button">
            + Create Ticket
          </button>
        </header>

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

              <button className="view-all">
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
                      <tr key={ticket._id}>
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}

export default App;