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

const allowedOrigins = (
  process.env.CLIENT_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("CORS origin not allowed")
      );
    },
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "IT Service Management API is running",
  });
});

app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
  });
});

app.use(errorMiddleware);

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