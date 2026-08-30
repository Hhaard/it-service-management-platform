import { useMemo, useState } from "react";

function Tickets({
    tickets,
    onRefresh,
    onCreateTicket,
    onSelectTicket,
  }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        ticket.title.toLowerCase().includes(searchText) ||
        ticket.description.toLowerCase().includes(searchText) ||
        ticket.requester.toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        ticket.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        ticket.priority === priorityFilter;

      const matchesCategory =
        categoryFilter === "All" ||
        ticket.category === categoryFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory
      );
    });
  }, [
    tickets,
    search,
    statusFilter,
    priorityFilter,
    categoryFilter,
  ]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setCategoryFilter("All");
  };

  return (
    <section className="tickets-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SERVICE DESK</p>
          <h2>Tickets</h2>
          <p className="page-description">
            View, search, and manage all service desk tickets.
          </p>
        </div>

        <button
          className="create-button"
          onClick={onCreateTicket}
        >
          + Create Ticket
        </button>
      </div>

      <div className="ticket-controls">
        <div className="search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search tickets, requesters, or descriptions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="filter-group">
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value)
            }
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option value="All">All Categories</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Network">Network</option>
            <option value="Access">Access</option>
            <option value="Other">Other</option>
          </select>

          <button
            className="clear-filters"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="ticket-results">
        <div className="results-header">
          <div>
            <strong>{filteredTickets.length}</strong>{" "}
            {filteredTickets.length === 1
              ? "ticket"
              : "tickets"}
          </div>

          <button
            className="refresh-button"
            onClick={onRefresh}
          >
            ↻ Refresh
          </button>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">⌕</div>
            <h3>No tickets found</h3>
            <p>
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="full-ticket-table-wrapper">
            <table className="ticket-table full-ticket-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Requester</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                  key={ticket._id}
                  className="ticket-row"
                  onClick={() => onSelectTicket(ticket)}
                >
                    <td>
                      <div className="ticket-title">
                        <strong>{ticket.title}</strong>

                        <span>
                          #{ticket._id
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

                    <td>
                      {ticket.assignedTo || "Unassigned"}
                    </td>

                    <td>
                      {new Date(
                        ticket.createdAt
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default Tickets;