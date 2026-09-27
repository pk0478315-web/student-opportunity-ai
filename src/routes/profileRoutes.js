// ==========================================
// PROFILE ROUTES
// ==========================================
// Routes for student profile management.

const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { optionalAuth } = require("../middleware/authMiddleware");

// GET /api/profile -> Retrieve student profile
router.get("/", optionalAuth, profileController.getProfile);

// POST /api/profile -> Update or create student profile
router.post("/", optionalAuth, profileController.saveProfile);

// PUT /api/profile -> Update student profile (standard REST convention)
router.put("/", optionalAuth, profileController.saveProfile);

module.exports = router;
