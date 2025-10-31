const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { ORIGINS } = require("../config/env");

// Import route groups
const publicRoutes = require("../routes");
const adminUsersRoutes = require("../routes/admin/users.routes");
const adminListingsRoutes = require("../routes/admin/listings.routes");
const adminLogsRoutes = require("../routes/admin/logs.routes");

const app = express();

// ===== Middleware =====
app.use(morgan("dev"));
app.use(express.json());
app.use(cors({ origin: ORIGINS, optionsSuccessStatus: 200 }));

// ===== Route mounting =====

// Public / general routes
app.use("/api", publicRoutes);

// Admin routes (segmented)
app.use("/api/admin", adminUsersRoutes);
app.use("/api/admin", adminListingsRoutes);
app.use("/api/admin", adminLogsRoutes);

// Health check (optional quick endpoint)
app.get("/api/health", (_req, res) => res.json({ ok: true, uptime: process.uptime() }));

// ===== 404 handler =====
app.use((req, res) => {
  res.status(404).json({ error: "not_found", path: req.originalUrl });
});

// ===== Centralized error handler =====
app.use((err, _req, res, _next) => {
  console.error("❌ SERVER ERROR:", err);
  res.status(500).json({
    error: "server_error",
    details: err.message || "Unexpected server error",
  });
});

module.exports = app;
