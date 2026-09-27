// ==========================================
// APP.JS - Express Application Setup
// ==========================================
// Configures Express, middleware, static files, and mounts all API routes.

const express = require("express");
const cors = require("cors");
const path = require("path");

// Import route files
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const opportunityRoutes = require("./routes/opportunityRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

// Import error handler middleware
const errorHandler = require("./middleware/errorHandler");

// Initialize express app
const app = express();

// ==========================================
// GLOBAL MIDDLEWARE
// ==========================================

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming requests with JSON payloads (req.body)
app.use(express.json({ limit: "5mb" }));

// Parse urlencoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets from 'public' folder
app.use(express.static(path.join(__dirname, "../public")));

// ==========================================
// API ROUTES
// ==========================================

// Mount modular routes under /api
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/opportunities", opportunityRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/feedback", feedbackRoutes);

// Base API description endpoint (returns JSON if requested or fallback to index.html)
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Personalized AI Opportunity Recommendation Platform API",
    version: "2.0.0",
    endpoints: {
      health: "GET /api/health",
      auth: ["POST /api/auth/signup", "POST /api/auth/login", "GET /api/auth/me"],
      profile: ["GET /api/profile", "POST /api/profile", "PUT /api/profile"],
      opportunities: ["GET /api/opportunities", "GET /api/opportunities/:id", "POST /api/opportunities"],
      recommendations: ["GET /api/recommendations", "GET /api/recommendations/:id", "POST /api/recommendations/analyze", "POST /api/recommendations"],
      feedback: ["GET /api/feedback", "POST /api/feedback"]
    }
  });
});

// For any non-API routes, serve frontend index.html if it exists
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  const indexPath = path.join(__dirname, "../public/index.html");
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If frontend index.html not yet present, return clean JSON
      res.json({
        success: true,
        message: "Student Opportunity Platform API is running. Visit /api for endpoint documentation."
      });
    }
  });
});

// ==========================================
// 404 CATCH-ALL ROUTE FOR API
// ==========================================
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}. Route not found.`
  });
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================
app.use(errorHandler);

module.exports = app;
