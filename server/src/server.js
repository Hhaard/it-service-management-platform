const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/database");

const ticketRoutes = require("./routes/ticketRoutes");
const userRoutes = require("./routes/usersRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const authRoutes = require("./routes/authRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

const PORT = process.env.PORT || 5000;


// ============================================================
// GLOBAL MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());


// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "IT Service Management API is running",
  });
});


// ============================================================
// API ROUTES
// ============================================================

app.use("/api/tickets", ticketRoutes);

app.use("/api/users", userRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/dashboard", dashboardRoutes);


// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});


// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(errorMiddleware);


// ============================================================
// START SERVER
// ============================================================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
};

startServer();