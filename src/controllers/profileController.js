// ==========================================
// PROFILE CONTROLLER
// ==========================================
// Handles student profile retrieval and updates.

const profileModel = require("../models/profileModel");

/**
 * Handle GET /api/profile
 * Returns the profile for the authenticated student
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const profile = await profileModel.getProfile(userId);
    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle POST or PUT /api/profile
 * Updates the student profile
 */
const saveProfile = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const {
      name,
      education,
      skills,
      interests,
      careerGoals,
      experience,
      location,
      preferredOpportunityTypes
    } = req.body;

    // Validate that at least one field is provided
    if (
      !name &&
      !education &&
      !skills &&
      !interests &&
      !careerGoals &&
      !experience &&
      !location &&
      !preferredOpportunityTypes
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one profile field to update (e.g. skills, interests, education, careerGoals)."
      });
    }

    // Ensure array format for skills/interests if passed as comma strings
    const formattedSkills = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;

    const formattedInterests = Array.isArray(interests)
      ? interests
      : typeof interests === "string"
      ? interests.split(",").map((i) => i.trim()).filter(Boolean)
      : undefined;

    const formattedTypes = Array.isArray(preferredOpportunityTypes)
      ? preferredOpportunityTypes
      : typeof preferredOpportunityTypes === "string"
      ? preferredOpportunityTypes.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;

    const updatedProfile = await profileModel.saveProfile(userId, {
      name,
      education,
      skills: formattedSkills,
      interests: formattedInterests,
      careerGoals,
      experience,
      location,
      preferredOpportunityTypes: formattedTypes
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      data: updatedProfile
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  saveProfile
};
