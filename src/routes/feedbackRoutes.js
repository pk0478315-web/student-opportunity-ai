// ==========================================
// FEEDBACK ROUTES
// ==========================================
// Routes for collecting student feedback.

const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { optionalAuth } = require("../middleware/authMiddleware");

// GET /api/feedback -> Fetch all feedback
router.get("/", optionalAuth, feedbackController.getFeedback);

// POST /api/feedback -> Record new feedback
router.post("/", optionalAuth, feedbackController.createFeedback);

module.exports = router;
