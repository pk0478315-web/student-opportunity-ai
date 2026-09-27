// ==========================================
// RECOMMENDATION MODEL (Persistent Database)
// ==========================================
// Manages AI recommendation results stored in the persistent database.

const db = require("../config/db");

/**
 * Retrieve all recommendations (optionally filtered by student)
 * @param {number|null} userId
 * @returns {Promise<Array>}
 */
const getAllRecommendations = async (userId = null) => {
  return await db.getRecommendations(userId);
};

/**
 * Find recommendation by ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const getRecommendationById = async (id) => {
  return await db.getRecommendationById(id);
};

/**
 * Add a new recommendation
 * @param {number} userId
 * @param {Object} data - Contains AI analysis, matchScore, reasons, etc.
 * @returns {Promise<Object>}
 */
const addRecommendation = async (userId = 1, data) => {
  return await db.createRecommendation(userId, data);
};

module.exports = {
  getAllRecommendations,
  getRecommendationById,
  addRecommendation
};
