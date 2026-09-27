// ==========================================================================
// OPPORTUNITY AI - REACT APPLICATION (Frontend)
// ==========================================================================

const { useState, useEffect } = React;

// API Helpers
const API_BASE = "";

const COURSE_OPTIONS = [
  "B.Tech / B.E. Computer Science & Engineering",
  "B.Tech / B.E. Information Technology",
  "B.Tech / B.E. Artificial Intelligence & Data Science",
  "B.Tech / B.E. Electronics & Communication",
  "B.Tech / B.E. Electrical / Mechanical / Civil",
  "B.Sc. Computer Science / IT",
  "BCA (Bachelor of Computer Applications)",
  "M.Tech / M.E. Computer Science / IT",
  "MCA (Master of Computer Applications)",
  "M.Sc. Computer Science / Data Science",
  "B.B.A / M.B.A (Business / Tech Management)",
  "Diploma in Computer Engineering",
  "Other / Custom Course"
];

const SKILL_OPTIONS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Express.js",
  "React",
  "Next.js",
  "HTML / CSS",
  "Git & GitHub",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "C++",
  "Java",
  "C#",
  "Go",
  "Rust",
  "Docker",
  "Kubernetes",
  "AWS / Cloud",
  "Machine Learning",
  "Deep Learning / PyTorch",
  "Artificial Intelligence",
  "Data Science",
  "Cybersecurity",
  "REST API Design"
];

const INTEREST_OPTIONS = [
  "Web Development",
  "Artificial Intelligence",
  "Machine Learning",
  "Open Source",
  "Robotics & Autonomous Systems",
  "Cloud Computing & DevOps",
  "Cybersecurity & Ethical Hacking",
  "Mobile App Development",
  "Data Science & Analytics",
  "Blockchain & Web3",
  "Game Development",
  "UI/UX Design & Frontend",
  "Competitive Programming / Hackathons"
];

const apiRequest = async (endpoint, method = "GET", body = null, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok && !data.success) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
};

// Main App Component
function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [profile, setProfile] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [toast, setToast] = useState(null);

  // Auth Form State
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");

  // Add Opportunity State
  const [oppUrl, setOppUrl] = useState("");
  const [oppTitle, setOppTitle] = useState("");
  const [oppOrg, setOppOrg] = useState("");
  const [oppDesc, setOppDesc] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: "",
    education: "",
    skills: [],
    interests: [],
    careerGoals: "",
    experience: "",
    location: ""
  });
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  // Discovery State
  const [discoveredOpps, setDiscoveredOpps] = useState([]);
  const [discoveryCategory, setDiscoveryCategory] = useState("all");
  const [importingId, setImportingId] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDiscoveredOpportunities = async (category = "all", activeToken = token) => {
    try {
      const res = await apiRequest(`/api/opportunities/explore?category=${category}`, "GET", null, activeToken);
      setDiscoveredOpps(res.data || []);
    } catch (err) {
      console.error("Error loading discovered opportunities:", err);
    }
  };

  useEffect(() => {
    loadDiscoveredOpportunities(discoveryCategory, token);
  }, [discoveryCategory, token]);

  // 1. Initial Load & Auth Check
  useEffect(() => {
    if (token) {
      loadUserData(token);
    } else {
      // Auto-load demo data so visitors can test immediately
      loadPublicData();
    }
  }, [token]);

  const loadUserData = async (activeToken) => {
    try {
      setLoading(true);
      const meRes = await apiRequest("/api/auth/me", "GET", null, activeToken);
      setUser(meRes.user);

      const [profRes, oppsRes, recsRes] = await Promise.all([
        apiRequest("/api/profile", "GET", null, activeToken),
        apiRequest("/api/opportunities", "GET", null, activeToken),
        apiRequest("/api/recommendations", "GET", null, activeToken)
      ]);

      setProfile(profRes.data);
      if (profRes.data) {
        setProfileForm({
          name: profRes.data.name || "",
          education: profRes.data.education || "",
          skills: profRes.data.skills || [],
          interests: profRes.data.interests || [],
          careerGoals: profRes.data.career_goals || profRes.data.careerGoals || "",
          experience: profRes.data.experience || "",
          location: profRes.data.location || ""
        });
      }

      setOpportunities(oppsRes.data || []);
      setRecommendations(recsRes.data || []);
    } catch (err) {
      console.warn("Auth token invalid or expired:", err.message);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const loadPublicData = async () => {
    try {
      const [oppsRes, recsRes, profRes] = await Promise.all([
        apiRequest("/api/opportunities"),
        apiRequest("/api/recommendations"),
        apiRequest("/api/profile")
      ]);
      setOpportunities(oppsRes.data || []);
      setRecommendations(recsRes.data || []);
      setProfile(profRes.data);
    } catch (err) {
      console.error("Error loading public data:", err);
    }
  };

  // 2. Auth Handlers
  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (authMode === "signup") {
        const res = await apiRequest("/api/auth/signup", "POST", {
          name: authName,
          email: authEmail,
          password: authPassword
        });
        localStorage.setItem("token", res.token);
        setToken(res.token);
        setUser(res.user);
        showToast("Account created successfully!");
      } else {
        const res = await apiRequest("/api/auth/login", "POST", {
          email: authEmail,
          password: authPassword
        });
        localStorage.setItem("token", res.token);
        setToken(res.token);
        setUser(res.user);
        showToast("Welcome back!");
      }
      setActiveTab("dashboard");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail, demoPass) => {
    setAuthEmail(demoEmail);
    setAuthPassword(demoPass);
    try {
      setLoading(true);
      const res = await apiRequest("/api/auth/login", "POST", {
        email: demoEmail,
        password: demoPass
      });
      localStorage.setItem("token", res.token);
      setToken(res.token);
      setUser(res.user);
      showToast(`Logged in as ${res.user.name}`);
      setActiveTab("dashboard");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    loadPublicData();
    showToast("Logged out successfully");
  };

  // 3. Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await apiRequest("/api/profile", "POST", profileForm, token);
      setProfile(res.data);
      showToast("Profile saved successfully!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !profileForm.skills.includes(newSkill.trim())) {
      setProfileForm({
        ...profileForm,
        skills: [...profileForm.skills, newSkill.trim()]
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setProfileForm({
      ...profileForm,
      skills: profileForm.skills.filter((s) => s !== skillToRemove)
    });
  };

  const addInterest = () => {
    if (newInterest.trim() && !profileForm.interests.includes(newInterest.trim())) {
      setProfileForm({
        ...profileForm,
        interests: [...profileForm.interests, newInterest.trim()]
      });
      setNewInterest("");
    }
  };

  const removeInterest = (interestToRemove) => {
    setProfileForm({
      ...profileForm,
      interests: profileForm.interests.filter((i) => i !== interestToRemove)
    });
  };

  // 4. Add Opportunity with Scraper
  const handleAddOpportunity = async (e) => {
    e.preventDefault();
    if (!oppUrl.trim()) {
      showToast("Please enter a valid opportunity URL", "error");
      return;
    }

    try {
      setIsScraping(true);
      const res = await apiRequest(
        "/api/opportunities",
        "POST",
        {
          url: oppUrl.trim(),
          title: oppTitle.trim() || undefined,
          organization: oppOrg.trim() || undefined,
          description: oppDesc.trim() || undefined
        },
        token
      );

      setOpportunities([res.data, ...opportunities]);
      setOppUrl("");
      setOppTitle("");
      setOppOrg("");
      setOppDesc("");
      showToast("Opportunity processed and added!");
      setActiveTab("opportunities");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsScraping(false);
    }
  };

  // 5. Trigger AI Recommendation Analysis
  const handleAnalyzeOpportunity = async (oppId) => {
    try {
      setAnalyzingId(oppId);
      const res = await apiRequest(
        "/api/recommendations/analyze",
        "POST",
        { opportunityId: oppId },
        token
      );

      // Add new recommendation to top of list
      setRecommendations([res.data, ...recommendations.filter((r) => r.id !== res.data.id)]);
      setSelectedRec(res.data);
      showToast(`AI Match Complete! Score: ${res.data.match_score}%`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setAnalyzingId(null);
    }
  };

  // 5b. Auto-Import Discovered Opportunity & AI Match
  const handleAutoImportAndMatch = async (item) => {
    try {
      setImportingId(item.id);
      showToast(`Importing ${item.title}...`);

      // 1. Save opportunity
      const oppRes = await apiRequest(
        "/api/opportunities",
        "POST",
        {
          url: item.url,
          title: item.title,
          organization: item.organization,
          description: item.description,
          requirements: item.requirements,
          requiredSkills: item.requiredSkills,
          tags: item.tags
        },
        token
      );

      const newOpp = oppRes.data;
      setOpportunities([newOpp, ...opportunities]);

      // 2. Automatically trigger AI Match
      const recRes = await apiRequest(
        "/api/recommendations/analyze",
        "POST",
        { opportunityId: newOpp.id },
        token
      );

      setRecommendations([recRes.data, ...recommendations.filter((r) => r.id !== recRes.data.id)]);
      setSelectedRec(recRes.data);
      showToast(`Imported & Matched! Score: ${recRes.data.match_score}%`);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setImportingId(null);
    }
  };

  // 6. Submit Feedback
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!selectedRec) return;

    try {
      await apiRequest(
        "/api/feedback",
        "POST",
        {
          opportunityId: selectedRec.opportunity_id,
          recommendationId: selectedRec.id,
          rating: feedbackRating,
          comment: feedbackComment
        },
        token
      );
      showToast("Thank you for your feedback!");
      setFeedbackComment("");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Calculate Average Match Score
  const avgScore =
    recommendations.length > 0
      ? Math.round(recommendations.reduce((acc, r) => acc + (r.match_score || 0), 0) / recommendations.length)
      : 0;

  return (
    <div>
      {/* NAVBAR */}
      <header className="navbar">
        <div className="logo-container" onClick={() => setActiveTab("dashboard")}>
          <div className="logo-icon">🚀</div>
          <span className="logo-text">OpportunityAI</span>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-btn ${activeTab === "opportunities" ? "active" : ""}`}
            onClick={() => setActiveTab("opportunities")}
          >
            🎯 Opportunities ({opportunities.length})
          </button>
          <button
            className={`nav-btn ${activeTab === "discover" ? "active" : ""}`}
            onClick={() => setActiveTab("discover")}
          >
            💡 Discover Scholarships
          </button>
          <button
            className={`nav-btn ${activeTab === "recommendations" ? "active" : ""}`}
            onClick={() => setActiveTab("recommendations")}
          >
            ✨ AI Matches ({recommendations.length})
          </button>
          <button
            className={`nav-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            👤 Profile
          </button>
          <button
            className={`nav-btn ${activeTab === "add-opportunity" ? "active" : ""}`}
            onClick={() => setActiveTab("add-opportunity")}
          >
            ➕ Add URL
          </button>

          {user ? (
            <div className="user-badge">
              <div className="user-avatar">{user.name ? user.name.charAt(0) : "S"}</div>
              <span>{user.name}</span>
              <button className="btn btn-sm btn-danger" onClick={handleLogout} style={{ marginLeft: "6px" }}>
                Logout
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setActiveTab("auth")}>
              Sign In
            </button>
          )}
        </nav>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="container">
        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            {/* Quick Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👤</div>
                <div>
                  <div className="stat-val">{profile ? profile.name || "Student" : "Guest"}</div>
                  <div className="stat-label">
                    {profile ? `${(profile.skills || []).length} Skills Listed` : "No Profile"}
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div>
                  <div className="stat-val">{opportunities.length}</div>
                  <div className="stat-label">Saved Opportunities</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✨</div>
                <div>
                  <div className="stat-val">{recommendations.length}</div>
                  <div className="stat-label">AI Analyses Generated</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div>
                  <div className="stat-val">{avgScore}%</div>
                  <div className="stat-label">Average Match Score</div>
                </div>
              </div>
            </div>

            {/* Profile Summary Card */}
            {profile && (
              <div className="card" style={{ marginBottom: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <h2 className="card-title">🎓 Student Profile Summary</h2>
                    <div className="card-subtitle">
                      {profile.education || "Undergraduate Student"} • {profile.location || "Remote"}
                    </div>
                  </div>
                  <button className="btn btn-sm btn-secondary" onClick={() => setActiveTab("profile")}>
                    ✏️ Edit Profile
                  </button>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <div className="rec-section-title">Career Goal</div>
                  <p style={{ color: "#e2e8f0", fontSize: "14px", marginBottom: "14px" }}>
                    {profile.career_goals || profile.careerGoals || "Explore opportunities & build engineering skills"}
                  </p>

                  <div className="rec-section-title">Current Skills</div>
                  <div className="tags-wrap" style={{ marginBottom: "14px" }}>
                    {(profile.skills || []).length > 0 ? (
                      profile.skills.map((s, i) => (
                        <span key={i} className="tag">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "var(--text-dim)", fontSize: "13px" }}>No skills added yet</span>
                    )}
                  </div>

                  <div className="rec-section-title">Interests</div>
                  <div className="tags-wrap">
                    {(profile.interests || []).length > 0 ? (
                      profile.interests.map((it, i) => (
                        <span key={i} className="tag tag-success">
                          {it}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "var(--text-dim)", fontSize: "13px" }}>No interests added yet</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Opportunities */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 className="card-title">🌟 Opportunities Ready For AI Matching</h2>
              <button className="btn btn-sm btn-primary" onClick={() => setActiveTab("add-opportunity")}>
                ➕ Add Opportunity URL
              </button>
            </div>

            <div className="opp-grid">
              {opportunities.slice(0, 4).map((opp) => (
                <div key={opp.id} className="opp-card">
                  <div>
                    <div className="opp-header">
                      <div className="opp-title">{opp.title}</div>
                      <span className="tag">{opp.opportunity_type || "Opportunity"}</span>
                    </div>
                    <div className="opp-org">🏢 {opp.organization || "Independent"}</div>
                    <p className="opp-desc">{opp.description}</p>
                    <div className="opp-meta">
                      <span>📍 {opp.location || "Remote"}</span>
                      <span>⏰ {opp.deadline || "Rolling"}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ flex: 1 }}
                      disabled={analyzingId === opp.id}
                      onClick={() => handleAnalyzeOpportunity(opp.id)}
                    >
                      {analyzingId === opp.id ? "Analyzing..." : "⚡ AI Match"}
                    </button>
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-secondary"
                    >
                      🔗 Link
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: OPPORTUNITIES LIST */}
        {activeTab === "opportunities" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h1 className="card-title" style={{ fontSize: "22px" }}>🎯 Saved Opportunities</h1>
                <p className="card-subtitle">
                  Provide any program or internship URL to analyze compatibility against your profile.
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setActiveTab("add-opportunity")}>
                ➕ Add New Opportunity
              </button>
            </div>

            {opportunities.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-state-icon">📭</div>
                <h3>No opportunities saved yet</h3>
                <p>Add your first opportunity URL to get started!</p>
              </div>
            ) : (
              <div className="opp-grid">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="opp-card">
                    <div>
                      <div className="opp-header">
                        <div className="opp-title">{opp.title}</div>
                        <span className="tag">{opp.opportunity_type || "Opportunity"}</span>
                      </div>
                      <div className="opp-org">🏢 {opp.organization}</div>
                      <p className="opp-desc">{opp.description}</p>

                      <div className="tags-wrap" style={{ marginBottom: "14px" }}>
                        {(opp.required_skills || opp.requiredSkills || []).map((sk, idx) => (
                          <span key={idx} className="tag tag-warning">
                            {sk}
                          </span>
                        ))}
                      </div>

                      <div className="opp-meta">
                        <span>📍 {opp.location || "Remote"}</span>
                        <span>⏰ {opp.deadline || "Rolling"}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ flex: 1 }}
                        disabled={analyzingId === opp.id}
                        onClick={() => handleAnalyzeOpportunity(opp.id)}
                      >
                        {analyzingId === opp.id ? "Analyzing Match..." : "⚡ Generate AI Match"}
                      </button>
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        Source
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2b: DISCOVER SCHOLARSHIPS & FEEDS */}
        {activeTab === "discover" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h1 className="card-title" style={{ fontSize: "22px" }}>💡 Discover Active Scholarships & Grants</h1>
                <p className="card-subtitle">
                  Curated active opportunities matched dynamically against your skills and degree program.
                </p>
              </div>

              {/* Category Filters */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { id: "all", label: "All" },
                  { id: "scholarship", label: "🎓 Scholarships" },
                  { id: "hackathon", label: "💻 Hackathons" },
                  { id: "internship", label: "💼 Internships" },
                  { id: "fellowship", label: "🏛️ Fellowships" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    className={`btn btn-sm ${discoveryCategory === cat.id ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setDiscoveryCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {discoveredOpps.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-state-icon">🔍</div>
                <h3>No opportunities found in this category</h3>
                <p>Try switching to "All" or update your profile skills!</p>
              </div>
            ) : (
              <div className="opp-grid">
                {discoveredOpps.map((item) => (
                  <div key={item.id} className="opp-card">
                    <div>
                      <div className="opp-header">
                        <div className="opp-title">{item.title}</div>
                        <span className="tag tag-success">
                          ⚡ {item.estimatedMatch}% Match
                        </span>
                      </div>

                      <div className="opp-org">🏢 {item.organization} • <span style={{ color: "#a5b4fc" }}>{item.opportunityType}</span></div>

                      <p className="opp-desc">{item.description}</p>

                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px" }}>
                        <strong>📋 Eligibility:</strong> {item.eligibility}
                      </div>

                      <div className="tags-wrap" style={{ marginBottom: "14px" }}>
                        {(item.requiredSkills || []).map((sk, idx) => (
                          <span key={idx} className="tag">
                            {sk}
                          </span>
                        ))}
                      </div>

                      <div className="opp-meta">
                        <span>📍 {item.location}</span>
                        <span>⏰ Deadline: {item.deadline}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                      <button
                        className="btn btn-sm btn-primary"
                        style={{ flex: 1 }}
                        disabled={importingId === item.id}
                        onClick={() => handleAutoImportAndMatch(item)}
                      >
                        {importingId === item.id ? "Processing..." : "⚡ 1-Click Import & AI Match"}
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-secondary"
                      >
                        Website 🔗
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: RECOMMENDATIONS */}
        {activeTab === "recommendations" && (
          <div>
            <h1 className="card-title" style={{ fontSize: "22px" }}>✨ AI Match Results & Recommendations</h1>
            <p className="card-subtitle">
              Detailed personalized matching analyses comparing your student profile with opportunity requirements.
            </p>

            {recommendations.length === 0 ? (
              <div className="empty-state card">
                <div className="empty-state-icon">🤖</div>
                <h3>No recommendations generated yet</h3>
                <p>Click "Generate AI Match" on any opportunity in the Opportunities tab!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {recommendations.map((rec) => {
                  const score = rec.match_score || rec.matchScore || 0;
                  const scoreClass = score >= 80 ? "score-high" : score >= 60 ? "score-med" : "score-low";

                  return (
                    <div key={rec.id} className="card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                        <div>
                          <h2 className="card-title" style={{ fontSize: "19px" }}>
                            {rec.title}
                          </h2>
                          <p style={{ color: "#a5b4fc", fontSize: "14px", marginBottom: "8px" }}>
                            {rec.summary}
                          </p>
                        </div>
                        <div className={`score-badge-lg ${scoreClass}`}>
                          <span style={{ fontSize: "22px" }}>{score}%</span>
                          <span style={{ fontSize: "10px", textTransform: "uppercase" }}>Match</span>
                        </div>
                      </div>

                      <div className="form-row" style={{ marginTop: "16px" }}>
                        <div>
                          <div className="rec-section-title">✅ Matching Skills</div>
                          <div className="tags-wrap">
                            {(rec.matching_skills || rec.matchingSkills || []).length > 0 ? (
                              (rec.matching_skills || rec.matchingSkills).map((s, i) => (
                                <span key={i} className="tag tag-success">
                                  ✓ {s}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: "var(--text-dim)", fontSize: "13px" }}>None detected</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="rec-section-title">⚠️ Skills to Develop (Missing)</div>
                          <div className="tags-wrap">
                            {(rec.missing_skills || rec.missingSkills || []).length > 0 ? (
                              (rec.missing_skills || rec.missingSkills).map((s, i) => (
                                <span key={i} className="tag tag-warning">
                                  + {s}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: "var(--text-dim)", fontSize: "13px" }}>
                                All listed skills match!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="recommendation-box">
                        <div className="rec-section-title">💡 Personalized AI Advice</div>
                        <p style={{ color: "#f8fafc", fontSize: "14px", marginBottom: "8px" }}>
                          {rec.recommendation}
                        </p>
                        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                          <strong>Reasoning:</strong> {rec.reason}
                        </p>
                      </div>

                      <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelectedRec(rec)}>
                          💬 View Details & Give Feedback
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === "profile" && (
          <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h1 className="card-title" style={{ fontSize: "22px" }}>👤 Student Profile</h1>
            <p className="card-subtitle">
              Your profile is matched directly by the AI against saved opportunities to compute your score.
            </p>

            <form onSubmit={handleSaveProfile}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="e.g. Sam Chen"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Course / Degree Program</label>
                  <select
                    className="form-select"
                    value={
                      COURSE_OPTIONS.includes(profileForm.education)
                        ? profileForm.education
                        : profileForm.education
                        ? "Other / Custom Course"
                        : ""
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Other / Custom Course") {
                        setProfileForm({ ...profileForm, education: "" });
                      } else {
                        setProfileForm({ ...profileForm, education: val });
                      }
                    }}
                  >
                    <option value="">-- Select Your Course --</option>
                    {COURSE_OPTIONS.map((course, idx) => (
                      <option key={idx} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>

                  {(!COURSE_OPTIONS.includes(profileForm.education) || profileForm.education === "" || profileForm.education === "Other / Custom Course") && (
                    <input
                      type="text"
                      className="form-input"
                      style={{ marginTop: "10px" }}
                      value={profileForm.education}
                      onChange={(e) => setProfileForm({ ...profileForm, education: e.target.value })}
                      placeholder="Or specify custom course name / academic year (e.g. B.Tech CS, 3rd Year)"
                    />
                  )}
                </div>
              </div>

              {/* Skills Tag Input & Dropdown */}
              <div className="form-group">
                <label className="form-label">Technical Skills</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <select
                    className="form-select"
                    value=""
                    onChange={(e) => {
                      const selected = e.target.value;
                      if (selected && !profileForm.skills.includes(selected)) {
                        setProfileForm({
                          ...profileForm,
                          skills: [...profileForm.skills, selected]
                        });
                      }
                    }}
                  >
                    <option value="">-- Select Skill from Dropdown --</option>
                    {SKILL_OPTIONS.map((sk, idx) => (
                      <option key={idx} value={sk} disabled={profileForm.skills.includes(sk)}>
                        {profileForm.skills.includes(sk) ? `✓ ${sk} (Added)` : sk}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      className="form-input"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Or type a custom skill (e.g. OpenCV, PyTorch) and click Add"
                    />
                    <button type="button" className="btn btn-secondary" onClick={addSkill}>
                      Add
                    </button>
                  </div>
                </div>
                <div className="tags-wrap" style={{ marginTop: "12px" }}>
                  {profileForm.skills.map((s, idx) => (
                    <span key={idx} className="tag">
                      {s}
                      <button type="button" className="tag-remove" onClick={() => removeSkill(s)}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Interests Tag Input & Dropdown */}
              <div className="form-group">
                <label className="form-label">Interests & Domains</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <select
                    className="form-select"
                    value=""
                    onChange={(e) => {
                      const selected = e.target.value;
                      if (selected && !profileForm.interests.includes(selected)) {
                        setProfileForm({
                          ...profileForm,
                          interests: [...profileForm.interests, selected]
                        });
                      }
                    }}
                  >
                    <option value="">-- Select Interest / Domain from Dropdown --</option>
                    {INTEREST_OPTIONS.map((it, idx) => (
                      <option key={idx} value={it} disabled={profileForm.interests.includes(it)}>
                        {profileForm.interests.includes(it) ? `✓ ${it} (Added)` : it}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      className="form-input"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addInterest();
                        }
                      }}
                      placeholder="Or type a custom domain (e.g. Quantum Computing) and click Add"
                    />
                    <button type="button" className="btn btn-secondary" onClick={addInterest}>
                      Add
                    </button>
                  </div>
                </div>
                <div className="tags-wrap" style={{ marginTop: "12px" }}>
                  {profileForm.interests.map((it, idx) => (
                    <span key={idx} className="tag tag-success">
                      {it}
                      <button type="button" className="tag-remove" onClick={() => removeInterest(it)}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Career Goals</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.careerGoals}
                  onChange={(e) => setProfileForm({ ...profileForm, careerGoals: e.target.value })}
                  placeholder="e.g. AI Systems Engineer building robotics software"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location / Work Preference</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  placeholder="e.g. Remote / New York"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Experience & Notable Projects</label>
                <textarea
                  className="form-textarea"
                  value={profileForm.experience}
                  onChange={(e) => setProfileForm({ ...profileForm, experience: e.target.value })}
                  placeholder="e.g. Built hackathon projects using Express & React, contributed to open source."
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving Profile..." : "💾 Save Profile"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: ADD OPPORTUNITY */}
        {activeTab === "add-opportunity" && (
          <div className="card" style={{ maxWidth: "700px", margin: "0 auto" }}>
            <h1 className="card-title" style={{ fontSize: "22px" }}>➕ Add Opportunity by URL</h1>
            <p className="card-subtitle">
              Paste any URL (hackathon, internship, fellowship, grant). Our scraper extracts details automatically.
            </p>

            <form onSubmit={handleAddOpportunity}>
              <div className="form-group">
                <label className="form-label">Opportunity Webpage URL *</label>
                <input
                  type="url"
                  required
                  className="form-input"
                  value={oppUrl}
                  onChange={(e) => setOppUrl(e.target.value)}
                  placeholder="https://example.com/internship-2026"
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>
                  💡 Optional: You can provide manual overrides below if the page requires authentication.
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Title (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={oppTitle}
                    onChange={(e) => setOppTitle(e.target.value)}
                    placeholder="e.g. Autonomous AI Fellowship"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Organization (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={oppOrg}
                    onChange={(e) => setOppOrg(e.target.value)}
                    placeholder="e.g. OpenAI / Google"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Brief Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  value={oppDesc}
                  onChange={(e) => setOppDesc(e.target.value)}
                  placeholder="Leave empty to extract automatically from the webpage"
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={isScraping}>
                {isScraping ? "Scraping & Processing..." : "🚀 Process & Save Opportunity"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: AUTH */}
        {activeTab === "auth" && (
          <div className="card" style={{ maxWidth: "460px", margin: "40px auto" }}>
            <h1 className="card-title" style={{ fontSize: "22px", justifyContent: "center" }}>
              {authMode === "signup" ? "Create Student Account" : "Sign In to OpportunityAI"}
            </h1>
            <p className="card-subtitle" style={{ textAlign: "center" }}>
              {authMode === "signup"
                ? "Start receiving personalized opportunity recommendations"
                : "Enter your student credentials"}
            </p>

            <form onSubmit={handleAuth}>
              {authMode === "signup" && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Sam Chen"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="student@university.edu"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginBottom: "16px" }} disabled={loading}>
                {loading ? "Processing..." : authMode === "signup" ? "Sign Up" : "Log In"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
              >
                {authMode === "signup"
                  ? "Already have an account? Sign In"
                  : "Need an account? Sign Up"}
              </button>
            </div>

            {/* Quick Demo Login Button for Hackathon Judges */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "14px", textAlign: "center" }}>
              <div style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
                ⚡ Hackathon Instant Demo:
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleQuickDemoLogin("alex.rivera@example.edu", "Password123!")}
              >
                Demo Login (Alex Rivera)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: RECOMMENDATION DETAILS & FEEDBACK */}
      {selectedRec && (
        <div className="modal-overlay" onClick={() => setSelectedRec(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: "700" }}>{selectedRec.title}</h2>
                <div style={{ color: "#a5b4fc", fontSize: "14px" }}>Detailed Compatibility Report</div>
              </div>
              <button
                onClick={() => setSelectedRec(null)}
                style={{ background: "none", border: "none", color: "white", fontSize: "22px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
              <div className={`score-badge-lg ${(selectedRec.match_score || selectedRec.matchScore) >= 80 ? "score-high" : "score-med"}`}>
                <span style={{ fontSize: "24px" }}>{selectedRec.match_score || selectedRec.matchScore}%</span>
                <span style={{ fontSize: "10px" }}>MATCH</span>
              </div>
              <div>
                <div style={{ fontWeight: "700", fontSize: "15px", marginBottom: "4px" }}>Executive Summary</div>
                <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>{selectedRec.summary}</div>
              </div>
            </div>

            <div className="recommendation-box" style={{ marginBottom: "16px" }}>
              <div className="rec-section-title">Career Goal Alignment</div>
              <p style={{ fontSize: "14px", color: "#f8fafc", marginBottom: "10px" }}>
                {selectedRec.career_goal_alignment || selectedRec.careerGoalAlignment}
              </p>

              <div className="rec-section-title">Education & Eligibility</div>
              <p style={{ fontSize: "14px", color: "#f8fafc" }}>
                {selectedRec.education_match || selectedRec.educationMatch}
              </p>
            </div>

            <div className="form-row" style={{ marginBottom: "16px" }}>
              <div>
                <div className="rec-section-title">Matching Skills</div>
                <div className="tags-wrap">
                  {(selectedRec.matching_skills || selectedRec.matchingSkills || []).map((s, i) => (
                    <span key={i} className="tag tag-success">
                      ✓ {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="rec-section-title">Missing Skills</div>
                <div className="tags-wrap">
                  {(selectedRec.missing_skills || selectedRec.missingSkills || []).map((s, i) => (
                    <span key={i} className="tag tag-warning">
                      + {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Feedback Form */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "8px" }}>💬 Rate This Recommendation</h3>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= feedbackRating ? "active" : ""}`}
                    onClick={() => setFeedbackRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>

              <form onSubmit={handleSubmitFeedback}>
                <div className="form-group" style={{ marginBottom: "10px" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Leave a comment (e.g. Very helpful suggestion, I will apply!)"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-sm btn-primary">
                  Submit Feedback
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// Mount React Root
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
