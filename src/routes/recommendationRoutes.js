// ==========================================
// RECOMMENDATION ROUTES
// ==========================================
// Routes for student opportunity recommendations.

const express = require("express");
const router = express.Router();
const recommendationController = require("../controllers/recommendationController");
const { optionalAuth } = require("../middleware/authMiddleware");

// GET /api/recommendations -> Fetch all recommendations
router.get("/", optionalAuth, recommendationController.getRecommendations);

// GET /api/recommendations/:id -> Fetch single recommendation details
router.get("/:id", optionalAuth, recommendationController.getRecommendationById);

// POST /api/recommendations/analyze -> Generate AI personalized recommendation
router.post("/analyze", optionalAuth, recommendationController.analyzeRecommendation);

// POST /api/recommendations -> Direct create (backward compatible)
router.post("/", optionalAuth, recommendationController.createRecommendation);

module.exports = router;
