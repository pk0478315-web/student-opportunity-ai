// ==========================================
// DATABASE ADAPTER (PostgreSQL / Supabase & Persistent Fallback)
// ==========================================
// Supports PostgreSQL (e.g., Supabase / Neon / Local Postgres)
// and seamlessly falls back to a persistent JSON store (data/database.json)
// if DATABASE_URL is not yet configured. This ensures zero-friction
// demo capability during a hackathon!

const fs = require("fs");
const path = require("path");

let pgPool = null;
let usePostgres = false;

// 1. Initialize PostgreSQL if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  try {
    const { Pool } = require("pg");
    pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" || process.env.DATABASE_URL.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : false
    });
    usePostgres = true;
    console.log("📦 Connected to PostgreSQL / Supabase Database");
  } catch (err) {
    console.warn("⚠️ Failed to initialize PostgreSQL pool, falling back to local persistent store:", err.message);
    usePostgres = false;
  }
} else {
  console.log("ℹ️ DATABASE_URL not set in .env. Using local persistent JSON storage in data/database.json");
}

// 2. Local Persistent File-based Store Setup (data/database.json)
const DATA_DIR = path.join(__dirname, "../../data");
const DB_FILE = path.join(DATA_DIR, "database.json");

const initialData = {
  users: [
    {
      id: 1,
      email: "alex.rivera@example.edu",
      // default demo password hash for: Password123!
      password_hash: "$2b$10$gZgqFCMj07xlG26qDN9H2ugx1A89aRWMqWsLvB.zH7lYaoc9EtUN2",
      name: "Alex Rivera",
      created_at: new Date().toISOString()
    }
  ],
  profiles: [
    {
      id: 1,
      user_id: 1,
      name: "Alex Rivera",
      education: "Bachelor of Science in Computer Science, Year 2",
      skills: ["JavaScript", "Node.js", "Express", "HTML/CSS", "Git", "Python"],
      interests: ["Web Development", "Open Source", "Artificial Intelligence"],
      career_goals: "Aspiring Full-Stack Software Engineer eager to build impactful web applications",
      experience: "Completed university projects in web development and contributed to local tech club.",
      location: "San Francisco, CA / Remote",
      preferred_opportunity_types: ["Internship", "Fellowship", "Open Source"],
      updated_at: new Date().toISOString()
    }
  ],
  opportunities: [
    {
      id: 1,
      user_id: 1,
      title: "Google Summer of Code (GSoC)",
      url: "https://summerofcode.withgoogle.com",
      organization: "Google Open Source",
      description: "An online mentoring program for student developers new to open source development.",
      requirements: "Must be 18+ and enrolled in or accepted into a post-secondary academic program.",
      required_skills: ["Open Source", "Git", "Python", "JavaScript"],
      eligibility: "Eligible students worldwide",
      location: "Remote / Online",
      deadline: "April 2026",
      opportunity_type: "Open Source Fellowship",
      tags: ["Open Source", "Mentorship", "Python", "JavaScript"],
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 1,
      title: "MLH Fellowship",
      url: "https://fellowship.mlh.io",
      organization: "Major League Hacking",
      description: "A 12-week internship alternative for aspiring software engineers to contribute to open source.",
      requirements: "Proficiency in at least one programming language, 30 hours per week commitment.",
      required_skills: ["Software Engineering", "Open Source", "Web Development", "Node.js"],
      eligibility: "Open globally",
      location: "Remote",
      deadline: "Rolling admission",
      opportunity_type: "Internship Alternative",
      tags: ["Software Engineering", "Open Source", "Web Development"],
      created_at: new Date().toISOString()
    }
  ],
  recommendations: [
    {
      id: 1,
      user_id: 1,
      opportunity_id: 1,
      title: "Google Summer of Code (GSoC)",
      match_score: 94,
      summary: "Exceptional alignment with your open source interest and JavaScript/Python skills.",
      matching_skills: ["JavaScript", "Python", "Git", "Open Source"],
      missing_skills: ["Advanced C++", "Docker"],
      matching_interests: ["Open Source", "Web Development"],
      education_match: "Compatible with undergraduate Computer Science standing.",
      career_goal_alignment: "Directly advances your goal of becoming a full-stack engineer through real-world contributions.",
      eligibility_notes: ["Must meet post-secondary student criteria."],
      strengths: ["Strong match in core programming languages", "Passionate about open-source collaboration"],
      gaps: ["Verify organizational eligibility requirements before applying"],
      recommendation: "Highly Recommended. Begin researching participating mentoring organizations early.",
      reason: "Matches your student profile skills and goals with a 94% compatibility index.",
      created_at: new Date().toISOString()
    }
  ],
  feedback: [
    {
      id: 1,
      user_id: 1,
      opportunity_id: 1,
      recommendation_id: 1,
      rating: 5,
      comment: "GSoC has been on my wishlist! Great suggestion based on my skills.",
      created_at: new Date().toISOString()
    }
  ]
};

const os = require("os");
const TMP_DB_FILE = path.join(os.tmpdir(), "opportunity_ai_database.json");

// In-memory store fallback for serverless deployments on read-only filesystems
let memoryDbStore = null;

// Ensure data folder and database.json exist
const ensureLocalDb = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf8");
    }
  } catch (err) {
    // Silently handle read-only file systems (e.g. /var/task on Vercel)
  }
};

const readLocalDb = () => {
  // 1. Return in-memory cache if updated during runtime
  if (memoryDbStore) return memoryDbStore;

  // 2. Try reading from serverless writable /tmp directory
  try {
    if (fs.existsSync(TMP_DB_FILE)) {
      const raw = fs.readFileSync(TMP_DB_FILE, "utf8");
      memoryDbStore = JSON.parse(raw);
      return memoryDbStore;
    }
  } catch (e) {
    // Ignore tmp file error
  }

  // 3. Try reading from project directory data/database.json
  ensureLocalDb();
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      memoryDbStore = JSON.parse(raw);
      return memoryDbStore;
    }
  } catch (err) {
    console.warn("Could not read project database.json, falling back to initial data:", err.message);
  }

  memoryDbStore = JSON.parse(JSON.stringify(initialData));
  return memoryDbStore;
};

const writeLocalDb = (data) => {
  memoryDbStore = data;

  // 1. Try writing to project data/database.json
  try {
    ensureLocalDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    return;
  } catch (err) {
    // 2. Fall back to writing to serverless writable /tmp directory on EROFS
    try {
      fs.writeFileSync(TMP_DB_FILE, JSON.stringify(data, null, 2), "utf8");
      console.log("ℹ️ Wrote database changes to serverless /tmp fallback file");
    } catch (tmpErr) {
      console.warn("⚠️ Saved changes to in-memory store:", tmpErr.message);
    }
  }
};

// ==========================================
// UNIFIED DATABASE ADAPTER API
// ==========================================
const db = {
  isPostgres: () => usePostgres,

  // Direct SQL execution helper when running on PostgreSQL
  query: async (text, params) => {
    if (usePostgres && pgPool) {
      return await pgPool.query(text, params);
    }
    throw new Error("Direct SQL query only available when DATABASE_URL is configured.");
  },

  // USERS
  findUserByEmail: async (email) => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
      return res.rows[0] || null;
    }
    const data = readLocalDb();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  findUserById: async (id) => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query("SELECT id, email, name, created_at FROM users WHERE id = $1", [id]);
      return res.rows[0] || null;
    }
    const data = readLocalDb();
    const user = data.users.find((u) => u.id === Number(id));
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  },

  createUser: async ({ email, password_hash, name }) => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query(
        "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at",
        [email, password_hash, name]
      );
      return res.rows[0];
    }
    const data = readLocalDb();
    const newId = data.users.length > 0 ? Math.max(...data.users.map((u) => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      email,
      password_hash,
      name,
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    writeLocalDb(data);
    const { password_hash: _, ...safeUser } = newUser;
    return safeUser;
  },

  // PROFILES
  getProfileByUserId: async (userId) => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query("SELECT * FROM profiles WHERE user_id = $1", [userId]);
      return res.rows[0] || null;
    }
    const data = readLocalDb();
    return data.profiles.find((p) => p.user_id === Number(userId)) || null;
  },

  upsertProfile: async (userId, profileData) => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query(
        `INSERT INTO profiles (user_id, name, education, skills, interests, career_goals, experience, location, preferred_opportunity_types, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET
           name = COALESCE(EXCLUDED.name, profiles.name),
           education = COALESCE(EXCLUDED.education, profiles.education),
           skills = COALESCE(EXCLUDED.skills, profiles.skills),
           interests = COALESCE(EXCLUDED.interests, profiles.interests),
           career_goals = COALESCE(EXCLUDED.career_goals, profiles.career_goals),
           experience = COALESCE(EXCLUDED.experience, profiles.experience),
           location = COALESCE(EXCLUDED.location, profiles.location),
           preferred_opportunity_types = COALESCE(EXCLUDED.preferred_opportunity_types, profiles.preferred_opportunity_types),
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          userId,
          profileData.name || null,
          profileData.education || null,
          profileData.skills || [],
          profileData.interests || [],
          profileData.careerGoals || profileData.career_goals || null,
          profileData.experience || null,
          profileData.location || null,
          profileData.preferredOpportunityTypes || profileData.preferred_opportunity_types || []
        ]
      );
      return res.rows[0];
    }

    const data = readLocalDb();
    let profile = data.profiles.find((p) => p.user_id === Number(userId));
    if (!profile) {
      const newId = data.profiles.length > 0 ? Math.max(...data.profiles.map((p) => p.id)) + 1 : 1;
      profile = {
        id: newId,
        user_id: Number(userId),
        name: profileData.name || "",
        education: profileData.education || "",
        skills: profileData.skills || [],
        interests: profileData.interests || [],
        career_goals: profileData.careerGoals || profileData.career_goals || "",
        experience: profileData.experience || "",
        location: profileData.location || "",
        preferred_opportunity_types: profileData.preferredOpportunityTypes || profileData.preferred_opportunity_types || [],
        updated_at: new Date().toISOString()
      };
      data.profiles.push(profile);
    } else {
      profile.name = profileData.name !== undefined ? profileData.name : profile.name;
      profile.education = profileData.education !== undefined ? profileData.education : profile.education;
      profile.skills = profileData.skills !== undefined ? profileData.skills : profile.skills;
      profile.interests = profileData.interests !== undefined ? profileData.interests : profile.interests;
      profile.career_goals =
        profileData.careerGoals !== undefined
          ? profileData.careerGoals
          : profileData.career_goals !== undefined
          ? profileData.career_goals
          : profile.career_goals;
      profile.experience = profileData.experience !== undefined ? profileData.experience : profile.experience;
      profile.location = profileData.location !== undefined ? profileData.location : profile.location;
      profile.preferred_opportunity_types =
        profileData.preferredOpportunityTypes !== undefined
          ? profileData.preferredOpportunityTypes
          : profileData.preferred_opportunity_types !== undefined
          ? profileData.preferred_opportunity_types
          : profile.preferred_opportunity_types;
      profile.updated_at = new Date().toISOString();
    }
    writeLocalDb(data);
    return profile;
  },

  // OPPORTUNITIES
  getOpportunities: async (userId = null) => {
    if (usePostgres && pgPool) {
      if (userId) {
        const res = await pgPool.query("SELECT * FROM opportunities WHERE user_id = $1 OR user_id IS NULL ORDER BY id DESC", [userId]);
        return res.rows;
      }
      const res = await pgPool.query("SELECT * FROM opportunities ORDER BY id DESC");
      return res.rows;
    }
    const data = readLocalDb();
    if (userId) {
      return data.opportunities.filter((o) => o.user_id === Number(userId) || !o.user_id);
    }
    return data.opportunities;
  },

  getOpportunityById: async (id) => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query("SELECT * FROM opportunities WHERE id = $1", [id]);
      return res.rows[0] || null;
    }
    const data = readLocalDb();
    return data.opportunities.find((o) => o.id === Number(id)) || null;
  },

  createOpportunity: async (userId, opp) => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query(
        `INSERT INTO opportunities (user_id, title, url, organization, description, requirements, required_skills, eligibility, location, deadline, opportunity_type, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          userId,
          opp.title || "Untitled Opportunity",
          opp.url,
          opp.organization || "Independent",
          opp.description || "No description provided",
          opp.requirements || "",
          opp.required_skills || opp.requiredSkills || [],
          opp.eligibility || "",
          opp.location || "Not specified",
          opp.deadline || "Not specified",
          opp.opportunity_type || opp.opportunityType || "General",
          opp.tags || []
        ]
      );
      return res.rows[0];
    }
    const data = readLocalDb();
    const newId = data.opportunities.length > 0 ? Math.max(...data.opportunities.map((o) => o.id)) + 1 : 1;
    const newOpp = {
      id: newId,
      user_id: Number(userId) || null,
      title: opp.title || "Untitled Opportunity",
      url: opp.url,
      organization: opp.organization || "Independent",
      description: opp.description || "No description provided",
      requirements: opp.requirements || "",
      required_skills: opp.required_skills || opp.requiredSkills || [],
      eligibility: opp.eligibility || "",
      location: opp.location || "Not specified",
      deadline: opp.deadline || "Not specified",
      opportunity_type: opp.opportunity_type || opp.opportunityType || "General",
      tags: opp.tags || [],
      created_at: new Date().toISOString()
    };
    data.opportunities.push(newOpp);
    writeLocalDb(data);
    return newOpp;
  },

  // RECOMMENDATIONS
  getRecommendations: async (userId = null) => {
    if (usePostgres && pgPool) {
      if (userId) {
        const res = await pgPool.query("SELECT * FROM recommendations WHERE user_id = $1 OR user_id IS NULL ORDER BY id DESC", [userId]);
        return res.rows;
      }
      const res = await pgPool.query("SELECT * FROM recommendations ORDER BY id DESC");
      return res.rows;
    }
    const data = readLocalDb();
    if (userId) {
      return data.recommendations.filter((r) => r.user_id === Number(userId) || !r.user_id);
    }
    return data.recommendations;
  },

  getRecommendationById: async (id) => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query("SELECT * FROM recommendations WHERE id = $1", [id]);
      return res.rows[0] || null;
    }
    const data = readLocalDb();
    return data.recommendations.find((r) => r.id === Number(id)) || null;
  },

  createRecommendation: async (userId, rec) => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query(
        `INSERT INTO recommendations (user_id, opportunity_id, title, match_score, summary, matching_skills, missing_skills, matching_interests, education_match, career_goal_alignment, eligibility_notes, strengths, gaps, recommendation, reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
        [
          userId,
          rec.opportunityId || rec.opportunity_id || null,
          rec.title || "Recommendation",
          rec.matchScore !== undefined ? rec.matchScore : rec.match_score || 75,
          rec.summary || "",
          rec.matchingSkills || rec.matching_skills || [],
          rec.missingSkills || rec.missing_skills || [],
          rec.matchingInterests || rec.matching_interests || [],
          rec.educationMatch || rec.education_match || "",
          rec.careerGoalAlignment || rec.career_goal_alignment || "",
          rec.eligibilityNotes || rec.eligibility_notes || [],
          rec.strengths || [],
          rec.gaps || [],
          rec.recommendation || "",
          rec.reason || ""
        ]
      );
      return res.rows[0];
    }
    const data = readLocalDb();
    const newId = data.recommendations.length > 0 ? Math.max(...data.recommendations.map((r) => r.id)) + 1 : 1;
    const newRec = {
      id: newId,
      user_id: Number(userId) || null,
      opportunity_id: Number(rec.opportunityId || rec.opportunity_id) || null,
      title: rec.title || "Recommendation",
      match_score: rec.matchScore !== undefined ? Number(rec.matchScore) : Number(rec.match_score) || 75,
      summary: rec.summary || "",
      matching_skills: rec.matchingSkills || rec.matching_skills || [],
      missing_skills: rec.missingSkills || rec.missing_skills || [],
      matching_interests: rec.matchingInterests || rec.matching_interests || [],
      education_match: rec.educationMatch || rec.education_match || "",
      career_goal_alignment: rec.careerGoalAlignment || rec.career_goal_alignment || "",
      eligibility_notes: rec.eligibilityNotes || rec.eligibility_notes || [],
      strengths: rec.strengths || [],
      gaps: rec.gaps || [],
      recommendation: rec.recommendation || "",
      reason: rec.reason || "",
      created_at: new Date().toISOString()
    };
    data.recommendations.push(newRec);
    writeLocalDb(data);
    return newRec;
  },

  // FEEDBACK
  getFeedback: async (userId = null) => {
    if (usePostgres && pgPool) {
      if (userId) {
        const res = await pgPool.query("SELECT * FROM feedback WHERE user_id = $1 OR user_id IS NULL ORDER BY id DESC", [userId]);
        return res.rows;
      }
      const res = await pgPool.query("SELECT * FROM feedback ORDER BY id DESC");
      return res.rows;
    }
    const data = readLocalDb();
    if (userId) {
      return data.feedback.filter((f) => f.user_id === Number(userId) || !f.user_id);
    }
    return data.feedback;
  },

  createFeedback: async (userId, fb) => {
    if (usePostgres && pgPool) {
      const res = await pgPool.query(
        `INSERT INTO feedback (user_id, opportunity_id, recommendation_id, rating, comment)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
          userId,
          fb.opportunityId || fb.opportunity_id || null,
          fb.recommendationId || fb.recommendation_id || null,
          fb.rating,
          fb.comment || ""
        ]
      );
      return res.rows[0];
    }
    const data = readLocalDb();
    const newId = data.feedback.length > 0 ? Math.max(...data.feedback.map((f) => f.id)) + 1 : 1;
    const newFb = {
      id: newId,
      user_id: Number(userId) || null,
      opportunity_id: Number(fb.opportunityId || fb.opportunity_id) || null,
      recommendation_id: Number(fb.recommendationId || fb.recommendation_id) || null,
      rating: Number(fb.rating),
      comment: fb.comment || "",
      created_at: new Date().toISOString()
    };
    data.feedback.push(newFb);
    writeLocalDb(data);
    return newFb;
  }
};

module.exports = db;
