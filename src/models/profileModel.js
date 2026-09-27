// ==========================================
// PROFILE MODEL (Persistent Database)
// ==========================================
// Manages student profile storage and updates via db adapter.

const db = require("../config/db");

/**
 * Get profile for a specific student
 * @param {number} userId
 * @returns {Promise<Object>} student profile object
 */
const getProfile = async (userId = 1) => {
  let profile = await db.getProfileByUserId(userId);
  if (!profile) {
    // If no profile exists yet, retrieve user info and initialize default profile
    const user = await db.findUserById(userId);
    profile = await db.upsertProfile(userId, {
      name: user ? user.name : "Student",
      education: "",
      skills: [],
      interests: [],
      careerGoals: "",
      experience: "",
      location: "",
      preferredOpportunityTypes: []
    });
  }
  return profile;
};

/**
 * Save or update the student profile
 * @param {number} userId
 * @param {Object} updatedData
 * @returns {Promise<Object>} updated student profile
 */
const saveProfile = async (userId = 1, updatedData = {}) => {
  return await db.upsertProfile(userId, updatedData);
};

module.exports = {
  getProfile,
  saveProfile
};
