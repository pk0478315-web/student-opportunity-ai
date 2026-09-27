// ==========================================
// OPPORTUNITY CONTROLLER
// ==========================================
// Handles opportunity URL processing, web scraping, and database persistence.

const opportunityModel = require("../models/opportunityModel");
const scraperService = require("../services/scraperService");

/**
 * Handle GET /api/opportunities
 * Returns opportunities saved by or available to the student
 */
const getOpportunities = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const list = await opportunityModel.getAllOpportunities(userId);
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
 * Handle GET /api/opportunities/:id
 * Returns a specific opportunity by ID
 */
const getOpportunityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const opp = await opportunityModel.getOpportunityById(id);
    if (!opp) {
      return res.status(404).json({
        success: false,
        message: `Opportunity with ID ${id} not found.`
      });
    }
    return res.status(200).json({
      success: true,
      data: opp
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle POST /api/opportunities
 * Takes an opportunity URL, scrapes the webpage content, and saves it.
 */
const createOpportunity = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const { url, title, organization, description, requirements, tags, requiredSkills } = req.body;

    // 1. Validation
    if (!url || typeof url !== "string" || url.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "A valid 'url' is required to process and save an opportunity."
      });
    }

    if (!scraperService.isValidUrl(url.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL format. Please provide a full URL starting with http:// or https://"
      });
    }

    // 2. Web Scraping & Metadata Extraction
    console.log(`🔍 Scraping opportunity page from: ${url.trim()}`);
    const scrapedData = await scraperService.scrapeOpportunityUrl(url.trim());

    // 3. Merge scraped fields with any optional manual overrides provided in body
    const finalOpportunityData = {
      url: url.trim(),
      title: title || scrapedData.title,
      organization: organization || scrapedData.organization,
      description: description || scrapedData.description,
      requirements: requirements || scrapedData.requirements,
      required_skills: requiredSkills || scrapedData.requiredSkills || [],
      eligibility: scrapedData.eligibility,
      location: scrapedData.location,
      deadline: scrapedData.deadline,
      opportunity_type: scrapedData.opportunityType,
      tags: tags || scrapedData.tags || []
    };

    // 4. Save to persistent database
    const savedOpportunity = await opportunityModel.addOpportunity(userId, finalOpportunityData);

    return res.status(201).json({
      success: true,
      message: "Opportunity processed and saved successfully!",
      scraped: scrapedData.scraped,
      data: savedOpportunity
    });
  } catch (error) {
    next(error);
  }
};

const profileModel = require("../models/profileModel");
const discoveryService = require("../services/opportunityDiscoveryService");

/**
 * Handle GET /api/opportunities/explore
 * Returns AI-suggested active scholarships, fellowships, and hackathons matched to student profile
 */
const exploreOpportunities = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : 1;
    const category = req.query.category || "all";
    const profile = await profileModel.getProfile(userId);

    const suggestions = discoveryService.discoverOpportunities(profile, category);

    return res.status(200).json({
      success: true,
      category,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOpportunities,
  getOpportunityById,
  exploreOpportunities,
  createOpportunity
};
