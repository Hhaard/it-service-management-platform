const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");
const ticketRoutes = require("./routes/ticketRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "IT Service Management API is running",
  });
});

// Ticket routes
app.use("/api/tickets", ticketRoutes);

// Start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();