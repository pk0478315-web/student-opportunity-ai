// ==========================================
// AI RECOMMENDATION SERVICE
// ==========================================
// Analyzes student profile against opportunity data.
// Supports Google Gemini API (gemini-1.5-flash) with a robust,
// deterministic heuristic engine fallback for offline/demo reliability.

const axios = require("axios");

/**
 * Deterministic local matcher (used as fallback or when AI_PROVIDER=mock)
 * Analyzes real skill overlaps, interests, and career goals to compute
 * a genuine, consistent match score (0-100) and actionable advice.
 */
const runDeterministicMatcher = (profile, opportunity) => {
  const studentSkills = (profile.skills || []).map((s) => s.trim().toLowerCase());
  const studentInterests = (profile.interests || []).map((i) => i.trim().toLowerCase());
  const opportunitySkills = (opportunity.required_skills || opportunity.requiredSkills || []).map((s) =>
    s.trim().toLowerCase()
  );

  const oppText = `${opportunity.title || ""} ${opportunity.description || ""} ${opportunity.requirements || ""}`.toLowerCase();

  // 1. Matching & Missing Skills
  const matchingSkills = [];
  const missingSkills = [];

  // Match against explicit opportunity skills if available
  if (opportunitySkills.length > 0) {
    for (const oppSkill of opportunitySkills) {
      const isMatch = studentSkills.some((s) => s.includes(oppSkill) || oppSkill.includes(s));
      const formatted = oppSkill.charAt(0).toUpperCase() + oppSkill.slice(1);
      if (isMatch) {
        matchingSkills.push(formatted);
      } else {
        missingSkills.push(formatted);
      }
    }
  } else {
    // If opportunity didn't specify explicit skills, check student's skills in description
    for (const skill of profile.skills || []) {
      if (oppText.includes(skill.toLowerCase())) {
        matchingSkills.push(skill);
      }
    }
  }

  // 2. Matching Interests
  const matchingInterests = [];
  for (const interest of profile.interests || []) {
    if (oppText.includes(interest.toLowerCase())) {
      matchingInterests.push(interest);
    }
  }

  // 3. Score Calculation (Deterministic)
  let skillScore = 70;
  if (opportunitySkills.length > 0) {
    skillScore = Math.round((matchingSkills.length / opportunitySkills.length) * 100);
  } else if (matchingSkills.length > 0) {
    skillScore = Math.min(60 + matchingSkills.length * 10, 95);
  }

  let interestScore = 60;
  if (studentInterests.length > 0 && matchingInterests.length > 0) {
    interestScore = Math.min(65 + matchingInterests.length * 15, 95);
  }

  let goalScore = 75;
  if (profile.careerGoals || profile.career_goals) {
    const goals = (profile.careerGoals || profile.career_goals).toLowerCase();
    if (oppText.includes("engineer") || oppText.includes("developer") || oppText.includes("intern") || oppText.includes("research")) {
      goalScore = 85;
    }
  }

  // Weighted composite score
  const rawScore = Math.round(skillScore * 0.45 + interestScore * 0.3 + goalScore * 0.25);
  const matchScore = Math.max(35, Math.min(rawScore, 96));

  // 4. Detailed Structured Explanations
  const educationMatch = profile.education
    ? `Your education background (${profile.education}) is well-suited for this ${opportunity.opportunity_type || "program"}.`
    : "Education requirements were not specified; check the opportunity page for degree prerequisites.";

  const careerGoalAlignment = profile.careerGoals || profile.career_goals
    ? `Participating directly supports your ambition: "${profile.careerGoals || profile.career_goals}".`
    : "Aligns with technical career growth and hands-on portfolio development.";

  const strengths = [
    matchingSkills.length > 0
      ? `Strong foundation in: ${matchingSkills.join(", ")}`
      : "Broad foundational technical readiness",
    matchingInterests.length > 0
      ? `High domain interest in: ${matchingInterests.join(", ")}`
      : "Eagerness to explore new project areas"
  ];

  const gaps = missingSkills.length > 0
    ? [`Opportunity highlights these skills which are not listed on your profile: ${missingSkills.join(", ")}`]
    : ["Ensure your GitHub / portfolio displays tangible projects demonstrating your listed skills."];

  const recommendation =
    matchScore >= 80
      ? "Strongly Recommended to apply. Tailor your resume to showcase the matching skills identified."
      : matchScore >= 60
      ? "Recommended with preparation. Spend time brushing up on missing skills before submitting your application."
      : "Consider as a stretch goal. Review prerequisites carefully to verify eligibility.";

  return {
    matchScore,
    summary: `This opportunity at ${opportunity.organization || "the host organization"} matches ${matchScore}% of your profile criteria.`,
    matchingSkills,
    missingSkills,
    matchingInterests,
    educationMatch,
    careerGoalAlignment,
    eligibilityNotes: [opportunity.eligibility || "Open to eligible students and early-career candidates."],
    strengths,
    gaps,
    recommendation,
    reason: `Calculated from a ${skillScore}% skill match, ${interestScore}% interest alignment, and strong career goal compatibility.`
  };
};

/**
 * Call Google Gemini API to analyze match
 */
const callGeminiApi = async (apiKey, profile, opportunity) => {
  const prompt = `
You are an expert student career and opportunity matching AI.
Analyze the following student profile and opportunity data.
Compare their skills, interests, education, career goals, and eligibility against the opportunity.

STUDENT PROFILE:
- Name: ${profile.name || "Student"}
- Education: ${profile.education || "Not specified"}
- Skills: ${(profile.skills || []).join(", ") || "Not specified"}
- Interests: ${(profile.interests || []).join(", ") || "Not specified"}
- Career Goals: ${profile.careerGoals || profile.career_goals || "Not specified"}
- Experience: ${profile.experience || "Not specified"}
- Location: ${profile.location || "Not specified"}

OPPORTUNITY DATA:
- Title: ${opportunity.title || "Untitled"}
- Organization: ${opportunity.organization || "Not specified"}
- Type: ${opportunity.opportunity_type || opportunity.opportunityType || "Not specified"}
- Location: ${opportunity.location || "Not specified"}
- Deadline: ${opportunity.deadline || "Not specified"}
- Description: ${opportunity.description || "Not provided"}
- Requirements: ${opportunity.requirements || "Not specified"}
- Required Skills: ${(opportunity.required_skills || opportunity.requiredSkills || []).join(", ") || "Not specified"}
- Eligibility: ${opportunity.eligibility || "Not specified"}

RULES:
1. Generate a consistent match score between 0 and 100 based strictly on compatibility.
2. Do NOT invent opportunity requirements or facts not provided. If unknown, state clearly that it is not specified.
3. Return ONLY a valid JSON object strictly matching this schema with NO markdown wrapping and NO backticks:
{
  "matchScore": number,
  "summary": "string",
  "matchingSkills": ["string"],
  "missingSkills": ["string"],
  "matchingInterests": ["string"],
  "educationMatch": "string",
  "careerGoalAlignment": "string",
  "eligibilityNotes": ["string"],
  "strengths": ["string"],
  "gaps": ["string"],
  "recommendation": "string",
  "reason": "string"
}
`;

  // Gemini 1.5 Flash endpoint
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await axios.post(
    url,
    {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    },
    { timeout: 15000 }
  );

  const candidate = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidate) {
    throw new Error("Empty response received from Gemini API");
  }

  // Parse structured JSON
  const cleaned = candidate.trim().replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
};

/**
 * Main AI Service Entry Point
 * @param {Object} profile - Student Profile
 * @param {Object} opportunity - Opportunity Data
 * @returns {Promise<Object>} Structured recommendation analysis
 */
const analyzeMatch = async (profile, opportunity) => {
  const provider = (process.env.AI_PROVIDER || "gemini").toLowerCase();
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  if (provider === "gemini" && apiKey && apiKey !== "your_gemini_api_key_here") {
    try {
      console.log(`🤖 Invoking Gemini AI for opportunity: "${opportunity.title}"`);
      const aiResult = await callGeminiApi(apiKey, profile, opportunity);

      // Validate required fields
      if (typeof aiResult.matchScore === "number") {
        return {
          ...aiResult,
          matchScore: Math.max(0, Math.min(100, Math.round(aiResult.matchScore))),
          provider: "gemini"
        };
      }
    } catch (err) {
      console.warn(`⚠️ Gemini API call failed (${err.message}). Using deterministic matching engine fallback.`);
    }
  }

  // Fallback engine
  const result = runDeterministicMatcher(profile, opportunity);
  return {
    ...result,
    provider: "heuristic-matcher"
  };
};

module.exports = {
  analyzeMatch,
  runDeterministicMatcher
};
