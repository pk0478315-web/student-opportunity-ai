// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
// Verifies JWT tokens and attaches authenticated user to req.user

const jwt = require("jsonwebtoken");
const db = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "hackathon-secret-jwt-key-2026";

/**
 * Protect routes - requires valid JWT token
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication token required (Bearer <token>)."
      });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again."
      });
    }

    const user = await db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session expired or user no longer exists."
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - attaches user if token is valid,
 * otherwise proceeds as guest without throwing 401.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.findUserById(decoded.id);
        if (user) {
          req.user = user;
        }
      } catch (err) {
        // Ignore token errors for optional auth
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAuth,
  optionalAuth,
  JWT_SECRET
};
