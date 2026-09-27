// ==========================================
// FEEDBACK CONTROLLER
// ==========================================
// Handles feedback submitted by students on opportunities and recommendations.

const feedbackModel = require("../models/feedbackModel");

/**
 * Handle GET /api/feedback
 * Returns all submitted feedback
 */
const getFeedback = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const list = await feedbackModel.getAllFeedback(userId);
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
 * Handle POST /api/feedback
 * Records student feedback for an opportunity/recommendation
 */
const createFeedback = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const { opportunityId, recommendationId, rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: "A rating between 1 and 5 is required."
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 (poor) and 5 (excellent)."
      });
    }

    const newFeedback = await feedbackModel.addFeedback(userId, {
      opportunityId,
      recommendationId,
      rating: numRating,
      comment: comment ? String(comment).trim() : ""
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully! Thank you.",
      data: newFeedback
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeedback,
  createFeedback
};
