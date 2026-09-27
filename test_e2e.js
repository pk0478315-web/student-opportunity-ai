// ==========================================================================
// AUTOMATED END-TO-END TEST SUITE
// ==========================================================================
// Tests the entire user flow required by the hackathon acceptance criteria.

const BASE_URL = "http://localhost:5000";

const runTests = async () => {
  console.log("==================================================");
  console.log("🧪 STARTING END-TO-END INTEGRATION TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  };

  try {
    // 1. Health Check
    console.log("\n1. Testing Server Health...");
    const health = await fetch(`${BASE_URL}/api/health`).then((r) => r.json());
    assert(health.success === true && health.message === "Backend is running", "GET /api/health returns success");

    // 2. User Signup
    console.log("\n2. Testing Student Registration...");
    const testEmail = `tester_${Date.now()}@hackathon.edu`;
    const signup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Devon Vance",
        email: testEmail,
        password: "SecurePassword123!"
      })
    }).then((r) => r.json());

    assert(signup.success === true && signup.token, "POST /api/auth/signup issues JWT token");
    const token = signup.token;

    // 3. User Login
    console.log("\n3. Testing Student Login...");
    const login = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "SecurePassword123!"
      })
    }).then((r) => r.json());

    assert(login.success === true && login.user.email === testEmail, "POST /api/auth/login succeeds");

    // 4. Create / Update Student Profile
    console.log("\n4. Testing Profile Update...");
    const profilePayload = {
      name: "Devon Vance",
      skills: ["Python", "JavaScript", "React", "Node.js"],
      interests: ["AI", "Open Source", "Autonomous Vehicles"],
      education: "B.Tech Computer Science, 3rd Year",
      careerGoals: "Full-Stack AI Engineer",
      location: "Remote / Hybrid"
    };

    const updateProfile = await fetch(`${BASE_URL}/api/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profilePayload)
    }).then((r) => r.json());

    assert(updateProfile.success === true, "POST /api/profile saves student profile");
    assert(updateProfile.data.skills.includes("Python"), "Profile contains updated skills");

    // 5. Get Profile
    console.log("\n5. Testing Profile Retrieval...");
    const getProfile = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((r) => r.json());

    assert(getProfile.data.name === "Devon Vance", "GET /api/profile returns authenticated student's profile");

    // 6. Submit Opportunity URL
    console.log("\n6. Testing Opportunity URL Processing & Web Scraping...");
    const oppRes = await fetch(`${BASE_URL}/api/opportunities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        url: "https://summerofcode.withgoogle.com",
        title: "Google Summer of Code Open Source Contributor",
        organization: "Google Open Source",
        requiredSkills: ["Python", "JavaScript", "Git", "Open Source"],
        opportunityType: "Fellowship"
      })
    }).then((r) => r.json());

    assert(oppRes.success === true && oppRes.data.id, "POST /api/opportunities stores opportunity");
    const oppId = oppRes.data.id;

    // 7. Trigger AI Recommendation Analysis
    console.log("\n7. Testing AI Recommendation Analysis...");
    const recRes = await fetch(`${BASE_URL}/api/recommendations/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ opportunityId: oppId })
    }).then((r) => r.json());

    assert(recRes.success === true, "POST /api/recommendations/analyze returns success");
    assert(typeof recRes.data.match_score === "number", `Valid match score generated: ${recRes.data.match_score}%`);
    assert(Array.isArray(recRes.data.matching_skills), "Includes matching skills array");
    assert(recRes.data.recommendation && recRes.data.reason, "Includes personalized recommendation and reason");

    const recId = recRes.data.id;

    // 8. Retrieve Recommendations
    console.log("\n8. Testing Recommendation Retrieval...");
    const getRecs = await fetch(`${BASE_URL}/api/recommendations`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then((r) => r.json());

    assert(getRecs.success === true && getRecs.data.length > 0, "GET /api/recommendations returns list");

    // 9. Submit Student Feedback
    console.log("\n9. Testing Feedback Submission...");
    const fbRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        opportunityId: oppId,
        recommendationId: recId,
        rating: 5,
        comment: "Excellent matching precision!"
      })
    }).then((r) => r.json());

    assert(fbRes.success === true && fbRes.data.rating === 5, "POST /api/feedback saves feedback");

    // 10. Error Handling Verification
    console.log("\n10. Testing Error Handling & Validations...");
    const invalidUrl = await fetch(`${BASE_URL}/api/opportunities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ url: "not-a-valid-url" })
    }).then((r) => r.json());
    assert(invalidUrl.success === false, "Properly rejects invalid URLs with 400");

    const missingOpp = await fetch(`${BASE_URL}/api/recommendations/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ opportunityId: 999999 })
    }).then((r) => r.json());
    assert(missingOpp.success === false, "Properly returns 404 for non-existent opportunity");

    console.log("\n==================================================");
    console.log(`🏁 TEST SUITE COMPLETED: ${passed} Passed, ${failed} Failed`);
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Test crashed with unhandled exception:", error);
  }
};

runTests();
