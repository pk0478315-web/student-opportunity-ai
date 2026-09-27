// ==========================================
// HEALTH CHECK ROUTE
// ==========================================
// Simple route to check if the server is alive and functioning properly.

const express = require("express");
const router = express.Router();

/**
 * GET /api/health
 * Returns server health status
 */
router.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Backend is running"
  });
});

module.exports = router;
