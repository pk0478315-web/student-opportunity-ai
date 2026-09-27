// ==========================================
// OPPORTUNITY MODEL (Persistent Database)
// ==========================================
// Manages opportunities saved by students in the persistent database.

const db = require("../config/db");

/**
 * Retrieve all saved opportunities (optionally filtered by student)
 * @param {number|null} userId
 * @returns {Promise<Array>}
 */
const getAllOpportunities = async (userId = null) => {
  return await db.getOpportunities(userId);
};

/**
 * Find a specific opportunity by its ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const getOpportunityById = async (id) => {
  return await db.getOpportunityById(id);
};

/**
 * Add a new opportunity
 * @param {number} userId
 * @param {Object} data - Contains title, url, organization, description, requirements, etc.
 * @returns {Promise<Object>}
 */
const addOpportunity = async (userId = 1, data) => {
  return await db.createOpportunity(userId, data);
};

module.exports = {
  getAllOpportunities,
  getOpportunityById,
  addOpportunity
};
