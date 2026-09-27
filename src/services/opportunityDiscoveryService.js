// ==========================================
// OPPORTUNITY & SCHOLARSHIP DISCOVERY SERVICE
// ==========================================
// Provides curated active scholarships, fellowships, hackathons, and grants.
// Intelligently ranks and scores suggestions against student profile.

const CURATED_CATALOG = [
  {
    id: "disc-1",
    title: "Reliance Foundation Undergraduate Scholarship",
    organization: "Reliance Foundation",
    opportunityType: "Scholarship",
    category: "scholarship",
    url: "https://www.buddy4study.com/page/reliance-foundation-scholarships",
    description: "Financial support up to INR 2 Lakhs over the degree duration to empower meritorious Indian students pursuing undergraduate degrees.",
    requirements: "Enrolled in 1st or 2nd year B.Tech, B.Sc, BCA, or B.E. degree program in India. Household income < 15 Lakhs.",
    eligibility: "Indian undergraduate students in Tech/Science",
    requiredSkills: ["Engineering", "Computer Science", "Technology"],
    deadline: "December 2026",
    location: "India (Pan-India)",
    tags: ["Scholarship", "Undergraduate", "India", "Financial Aid"]
  },
  {
    id: "disc-2",
    title: "Google Generation Scholarship (APAC)",
    organization: "Google Education",
    opportunityType: "Scholarship",
    category: "scholarship",
    url: "https://buildyourfuture.withgoogle.com/scholarships/generation-google-scholarship-apac",
    description: "Designed to help computer science students excel in technology and become leaders in the field ($2,500 USD award + mentorship).",
    requirements: "Pursuing a Computer Science, Computer Engineering, or related technical degree as an undergraduate student.",
    eligibility: "Open to female students in Asia-Pacific universities",
    requiredSkills: ["Computer Science", "Python", "Java", "C++", "Problem Solving"],
    deadline: "March 2026",
    location: "APAC / Remote",
    tags: ["Scholarship", "Google", "Women in Tech", "Computer Science"]
  },
  {
    id: "disc-3",
    title: "PM Research Fellowship (PMRF)",
    organization: "Ministry of Education, Govt. of India",
    opportunityType: "Fellowship",
    category: "fellowship",
    url: "https://pmrf.in",
    description: "Prestigious fellowship offering financial assistance up to ₹80,000/month to top students for direct Ph.D. research at IITs and IISc.",
    requirements: "Completed or in final year of B.Tech/M.Tech/M.Sc with minimum CGPA 8.0.",
    eligibility: "Top 15% academic performers in Science & Tech",
    requiredSkills: ["Artificial Intelligence", "Research", "Data Science", "Engineering"],
    deadline: "May 2026",
    location: "India (IITs / IISc)",
    tags: ["Fellowship", "Research", "IIT", "Government"]
  },
  {
    id: "disc-4",
    title: "Amazon ML Summer School 2026",
    organization: "Amazon Science",
    opportunityType: "Mentorship & Internship",
    category: "internship",
    url: "https://www.amazon.science/academic-engagement/amazon-ml-summer-school",
    description: "In-depth machine learning training modules taught by Amazon ML scientists with direct interview opportunities for ML roles.",
    requirements: "Enrolled in 3rd/4th year B.Tech, M.Tech, or MCA degree in Computer Science/AI.",
    eligibility: "Engineering students with foundation in Math & Coding",
    requiredSkills: ["Machine Learning", "Python", "Deep Learning", "SQL"],
    deadline: "July 2026",
    location: "India / Virtual",
    tags: ["Amazon", "Machine Learning", "Mentorship", "AI"]
  },
  {
    id: "disc-5",
    title: "MLH Global Hackathon Season 2026",
    organization: "Major League Hacking",
    opportunityType: "Hackathon",
    category: "hackathon",
    url: "https://mlh.io/seasons/2026/events",
    description: "Participate in weekend hackathons, build innovative projects with peers, learn new APIs, and win swag and cash grants.",
    requirements: "High school, university, or bootcamp student interested in coding.",
    eligibility: "Open to all students globally",
    requiredSkills: ["Web Development", "React", "Node.js", "Python", "Git"],
    deadline: "Weekly Events 2026",
    location: "Global / Remote",
    tags: ["Hackathon", "MLH", "Projects", "Swag"]
  },
  {
    id: "disc-6",
    title: "GitHub Octernships",
    organization: "GitHub Education",
    opportunityType: "Paid Remote Internship",
    category: "internship",
    url: "https://education.github.com/students/octernships",
    description: "Paid remote internships for student developers to work directly on open-source codebases for international partner companies.",
    requirements: "Active GitHub Student Developer Pack holder with verified student status.",
    eligibility: "Verified student developers worldwide",
    requiredSkills: ["Git", "GitHub", "JavaScript", "Python", "Open Source"],
    deadline: "Rolling Admission 2026",
    location: "Remote",
    tags: ["GitHub", "Internship", "Paid", "Open Source"]
  },
  {
    id: "disc-7",
    title: "Tata Building India Student Grant",
    organization: "Tata Group",
    opportunityType: "Scholarship",
    category: "scholarship",
    url: "https://www.tatabuildingindia.com",
    description: "Merit scholarship recognizing academic excellence and social innovation among Indian undergraduate and diploma students.",
    requirements: "Undergraduate degree student in recognized Indian college.",
    eligibility: "Meritorious Indian students",
    requiredSkills: ["Academic Excellence", "Technology", "Innovation"],
    deadline: "November 2026",
    location: "India",
    tags: ["Scholarship", "Tata", "India"]
  },
  {
    id: "disc-8",
    title: "Women Who Code Tech Grant",
    organization: "Women Who Code",
    opportunityType: "Grant",
    category: "scholarship",
    url: "https://www.womenwhocode.com/grants",
    description: "Financial micro-grants and tech conference tickets for women developers building open-source and software projects.",
    requirements: "Undergraduate female student pursuing tech or software engineering.",
    eligibility: "Women in tech globally",
    requiredSkills: ["Software Engineering", "Web Development", "Data Science"],
    deadline: "August 2026",
    location: "Remote / Global",
    tags: ["Grant", "Women in Tech", "Software"]
  }
];

/**
 * Get personalized scholarship and opportunity suggestions for a student profile
 * @param {Object} profile - Student profile (skills, interests, education, goals)
 * @param {string} categoryFilter - 'all', 'scholarship', 'hackathon', 'internship', 'fellowship'
 * @returns {Array} List of curated suggestions with estimated match score & reasons
 */
const discoverOpportunities = (profile = {}, categoryFilter = "all") => {
  const studentSkills = (profile.skills || []).map((s) => s.toLowerCase());
  const studentInterests = (profile.interests || []).map((i) => i.toLowerCase());
  const educationText = (profile.education || "").toLowerCase();
  const goalsText = (profile.careerGoals || profile.career_goals || "").toLowerCase();

  let catalog = CURATED_CATALOG;
  if (categoryFilter && categoryFilter !== "all") {
    catalog = catalog.filter((item) => item.category === categoryFilter.toLowerCase());
  }

  const suggestions = catalog.map((item) => {
    let matchPoints = 50; // base score
    const matchingSkills = [];

    // 1. Skill overlap
    for (const reqSkill of item.requiredSkills) {
      if (studentSkills.some((s) => s.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(s))) {
        matchPoints += 12;
        matchingSkills.push(reqSkill);
      }
    }

    // 2. Interest match
    for (const tag of item.tags) {
      if (studentInterests.some((i) => i.includes(tag.toLowerCase()) || tag.toLowerCase().includes(i))) {
        matchPoints += 10;
      }
    }

    // 3. Education relevance
    if (educationText.includes("b.tech") || educationText.includes("cs") || educationText.includes("bca") || educationText.includes("engineering")) {
      matchPoints += 8;
    }

    // 4. Career Goal relevance
    if (goalsText.includes("ai") || goalsText.includes("engineer") || goalsText.includes("research")) {
      matchPoints += 8;
    }

    const estimatedMatch = Math.min(Math.max(matchPoints, 55), 98);

    let suggestedReason = `Recommended for ${profile.name || "students"} based on degree stream and tech skills.`;
    if (matchingSkills.length > 0) {
      suggestedReason = `Matches your skills in ${matchingSkills.join(", ")} and your academic profile.`;
    }

    return {
      ...item,
      estimatedMatch,
      suggestedReason,
      matchingSkills
    };
  });

  // Sort by highest estimated match score
  return suggestions.sort((a, b) => b.estimatedMatch - a.estimatedMatch);
};

module.exports = {
  discoverOpportunities,
  CURATED_CATALOG
};
