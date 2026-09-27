// ==========================================
// FEEDBACK MODEL (Persistent Database)
// ==========================================
// Manages student feedback stored in the persistent database.

const db = require("../config/db");

/**
 * Retrieve all feedback entries (optionally filtered by student)
 * @param {number|null} userId
 * @returns {Promise<Array>}
 */
const getAllFeedback = async (userId = null) => {
  return await db.getFeedback(userId);
};

/**
 * Add a new feedback entry
 * @param {number} userId
 * @param {Object} data - Contains opportunityId, recommendationId, rating, comment
 * @returns {Promise<Object>}
 */
const addFeedback = async (userId = 1, data) => {
  return await db.createFeedback(userId, data);
};

module.exports = {
  getAllFeedback,
  addFeedback
};
