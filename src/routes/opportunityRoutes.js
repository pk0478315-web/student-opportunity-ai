// ==========================================
// OPPORTUNITY ROUTES
// ==========================================
// Routes for managing student opportunities.

const express = require("express");
const router = express.Router();
const opportunityController = require("../controllers/opportunityController");
const { optionalAuth } = require("../middleware/authMiddleware");

// GET /api/opportunities -> Fetch all saved opportunities
router.get("/", optionalAuth, opportunityController.getOpportunities);

// GET /api/opportunities/explore -> Discover active scholarships & opportunities
router.get("/explore", optionalAuth, opportunityController.exploreOpportunities);

// GET /api/opportunities/:id -> Fetch single opportunity details
router.get("/:id", optionalAuth, opportunityController.getOpportunityById);

// POST /api/opportunities -> Save a new opportunity URL
router.post("/", optionalAuth, opportunityController.createOpportunity);

module.exports = router;
