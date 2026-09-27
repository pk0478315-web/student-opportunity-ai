// ==========================================
// RECOMMENDATION CONTROLLER
// ==========================================
// Coordinates student profile + opportunity data -> AI service -> persistent recommendation.

const recommendationModel = require("../models/recommendationModel");
const opportunityModel = require("../models/opportunityModel");
const profileModel = require("../models/profileModel");
const aiService = require("../services/aiService");

/**
 * Handle GET /api/recommendations
 * Returns recommendations for the student
 */
const getRecommendations = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const list = await recommendationModel.getAllRecommendations(userId);
    return res.status(200).json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle GET /api/recommendations/:id
 * Returns a specific recommendation
 */
const getRecommendationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rec = await recommendationModel.getRecommendationById(id);
    if (!rec) {
      return res.status(404).json({
        success: false,
        message: `Recommendation with ID ${id} not found.`
      });
    }
    return res.status(200).json({
      success: true,
      data: rec
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle POST /api/recommendations/analyze
 * CORE FEATURE: Loads student profile + opportunity, runs AI analysis, stores and returns result.
 */
const analyzeRecommendation = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const { opportunityId } = req.body;

    if (!opportunityId) {
      return res.status(400).json({
        success: false,
        message: "An 'opportunityId' is required to generate a personalized recommendation."
      });
    }

    // 1. Fetch Opportunity
    const opportunity = await opportunityModel.getOpportunityById(opportunityId);
    if (!opportunity) {
      return res.status(404).json({
        success: false,
        message: `Opportunity with ID ${opportunityId} not found.`
      });
    }

    // 2. Fetch Student Profile
    const profile = await profileModel.getProfile(userId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found. Please create or update your profile first."
      });
    }

    // 3. Execute AI Matching Service
    console.log(`🤖 Analyzing match for Student (User ${userId}) <-> Opportunity "${opportunity.title}"`);
    const aiAnalysis = await aiService.analyzeMatch(profile, opportunity);

    // 4. Store Recommendation in Database
    const recommendationRecord = {
      opportunityId: opportunity.id,
      title: opportunity.title,
      matchScore: aiAnalysis.matchScore,
      summary: aiAnalysis.summary,
      matchingSkills: aiAnalysis.matchingSkills,
      missingSkills: aiAnalysis.missingSkills,
      matchingInterests: aiAnalysis.matchingInterests,
      educationMatch: aiAnalysis.educationMatch,
      careerGoalAlignment: aiAnalysis.careerGoalAlignment,
      eligibilityNotes: aiAnalysis.eligibilityNotes,
      strengths: aiAnalysis.strengths,
      gaps: aiAnalysis.gaps,
      recommendation: aiAnalysis.recommendation,
      reason: aiAnalysis.reason
    };

    const savedRecommendation = await recommendationModel.addRecommendation(userId, recommendationRecord);

    return res.status(201).json({
      success: true,
      message: "Personalized AI recommendation generated successfully!",
      provider: aiAnalysis.provider,
      data: savedRecommendation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle POST /api/recommendations (Backward compatible direct create)
 */
const createRecommendation = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const { opportunityId, title, matchScore, reason } = req.body;

    if (!title && !opportunityId) {
      return res.status(400).json({
        success: false,
        message: "Please provide an 'opportunityId' or 'title' for the recommendation."
      });
    }

    const newRecommendation = await recommendationModel.addRecommendation(userId, {
      opportunityId,
      title,
      matchScore,
      reason
    });

    return res.status(201).json({
      success: true,
      message: "Recommendation added successfully!",
      data: newRecommendation
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecommendations,
  getRecommendationById,
  analyzeRecommendation,
  createRecommendation
};
