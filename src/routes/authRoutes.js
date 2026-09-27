// ==========================================
// AUTH ROUTES
// ==========================================
// Defines authentication endpoints for signup, login, and current user.

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

// POST /api/auth/signup -> Register a new student
router.post("/signup", authController.signup);

// POST /api/auth/login -> Sign in existing student
router.post("/login", authController.login);

// GET /api/auth/me -> Get current authenticated student
router.get("/me", requireAuth, authController.getMe);

module.exports = router;
