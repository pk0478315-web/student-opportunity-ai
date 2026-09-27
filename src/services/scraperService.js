// ==========================================
// OPPORTUNITY SCRAPER SERVICE
// ==========================================
// Robust web page scraper using axios & cheerio
// Extracts title, organization, description, requirements,
// skills, eligibility, location, deadline, and opportunity type.

const axios = require("axios");
const cheerio = require("cheerio");
const { URL } = require("url");

// Common technical skills list for detection
const KNOWN_SKILLS = [
  "Python", "JavaScript", "TypeScript", "Node.js", "React", "Express",
  "HTML", "CSS", "Git", "GitHub", "SQL", "PostgreSQL", "MongoDB",
  "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Linux", "C++", "C#",
  "Java", "Go", "Rust", "Machine Learning", "Deep Learning", "AI",
  "Data Science", "Computer Vision", "NLP", "Cybersecurity", "REST API"
];

/**
 * Validate whether a string is a valid HTTP/HTTPS URL
 */
const isValidUrl = (urlString) => {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (err) {
    return false;
  }
};

/**
 * Scrapes opportunity metadata from a public URL
 * @param {string} targetUrl
 * @returns {Promise<Object>} extracted metadata
 */
const scrapeOpportunityUrl = async (targetUrl) => {
  if (!isValidUrl(targetUrl)) {
    throw new Error("Invalid URL format. Please provide a full http:// or https:// URL.");
  }

  const parsedUrl = new URL(targetUrl);
  const hostname = parsedUrl.hostname.replace(/^www\./, "");

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      },
      timeout: 10000, // 10 second timeout
      maxRedirects: 5
    });

    const html = response.data;
    if (typeof html !== "string") {
      throw new Error("Received non-HTML response from target website.");
    }

    const $ = cheerio.load(html);

    // 1. Title Extraction
    const ogTitle = $('meta[property="og:title"]').attr("content");
    const twitterTitle = $('meta[name="twitter:title"]').attr("content");
    const htmlTitle = $("title").text();
    const h1Title = $("h1").first().text();

    const title = (ogTitle || twitterTitle || h1Title || htmlTitle || `${hostname} Opportunity`)
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 180);

    // 2. Organization Extraction
    const ogSiteName = $('meta[property="og:site_name"]').attr("content");
    const domainParts = hostname.split(".");
    const fallbackOrg = domainParts.length > 1 ? domainParts[domainParts.length - 2] : hostname;
    const organization = (ogSiteName || fallbackOrg.charAt(0).toUpperCase() + fallbackOrg.slice(1)).trim();

    // 3. Description Extraction
    const ogDesc = $('meta[property="og:description"]').attr("content");
    const metaDesc = $('meta[name="description"]').attr("content");
    const twitterDesc = $('meta[name="twitter:description"]').attr("content");
    const firstParagraph = $("main p, article p, .content p, p").first().text();

    const description = (ogDesc || metaDesc || twitterDesc || firstParagraph || "Opportunity details available at source link.")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 600);

    // Full text content for keyword scanning
    const pageText = $("body").text().replace(/\s+/g, " ");

    // 4. Requirements & Eligibility Extraction
    let requirements = "";
    let eligibility = "";

    $("h2, h3, h4, strong").each((_, elem) => {
      const heading = $(elem).text().toLowerCase();
      if (heading.includes("requirement") || heading.includes("qualification") || heading.includes("what you need")) {
        const nextElem = $(elem).next("ul, ol, p");
        if (nextElem.length && !requirements) {
          requirements = nextElem.text().trim().replace(/\s+/g, " ").slice(0, 400);
        }
      }
      if (heading.includes("eligib") || heading.includes("who can apply") || heading.includes("criteria")) {
        const nextElem = $(elem).next("ul, ol, p");
        if (nextElem.length && !eligibility) {
          eligibility = nextElem.text().trim().replace(/\s+/g, " ").slice(0, 300);
        }
      }
    });

    if (!requirements) {
      requirements = "See opportunity link for full prerequisites and requirements.";
    }
    if (!eligibility) {
      eligibility = "Open to eligible students and early-career candidates.";
    }

    // 5. Skills Detection
    const detectedSkills = [];
    const lowerPageText = pageText.toLowerCase();
    for (const skill of KNOWN_SKILLS) {
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(?:^|[^a-zA-Z0-9_])${escapedSkill}(?:$|[^a-zA-Z0-9_])`, "i");
      if (pattern.test(lowerPageText)) {
        detectedSkills.push(skill);
      }
    }

    // 6. Location Detection
    let location = "Not specified / Check link";
    if (/remote|online|virtual|work from home/i.test(pageText)) {
      location = "Remote / Online";
    } else if (/hybrid/i.test(pageText)) {
      location = "Hybrid";
    } else if (/on-site|onsite|in-person/i.test(pageText)) {
      location = "On-site";
    }

    // 7. Deadline Detection
    let deadline = "Rolling / Check source link";
    const deadlineMatch = pageText.match(/(?:deadline|apply by|applications close|due date)[:\s]+([A-Za-z]+ \d{1,2},? \d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    if (deadlineMatch && deadlineMatch[1]) {
      deadline = deadlineMatch[1].trim();
    }

    // 8. Opportunity Type Detection
    let opportunityType = "Opportunity";
    if (/hackathon/i.test(title + " " + pageText.slice(0, 1500))) {
      opportunityType = "Hackathon";
    } else if (/fellowship/i.test(title + " " + pageText.slice(0, 1500))) {
      opportunityType = "Fellowship";
    } else if (/internship|intern\b/i.test(title + " " + pageText.slice(0, 1500))) {
      opportunityType = "Internship";
    } else if (/scholarship|grant/i.test(title + " " + pageText.slice(0, 1500))) {
      opportunityType = "Scholarship / Grant";
    } else if (/full-time|full time|junior developer/i.test(title + " " + pageText.slice(0, 1500))) {
      opportunityType = "Full-Time / Junior Role";
    }

    return {
      success: true,
      scraped: true,
      url: targetUrl,
      title,
      organization,
      description,
      requirements,
      requiredSkills: detectedSkills.slice(0, 8),
      eligibility,
      location,
      deadline,
      opportunityType,
      tags: [opportunityType, ...detectedSkills.slice(0, 4)].filter(Boolean)
    };
  } catch (error) {
    console.warn(`⚠️ Scraping notice for ${targetUrl}: ${error.message}`);
    // Safe graceful fallback: extract basics from URL hostname so server NEVER crashes
    return {
      success: true,
      scraped: false,
      url: targetUrl,
      title: `${hostname} Opportunity`,
      organization: hostname,
      description: "Opportunity page was saved successfully. Details can be viewed directly at the source URL.",
      requirements: "Check opportunity source URL for specific qualifications.",
      requiredSkills: [],
      eligibility: "Open to eligible students",
      location: "Check source URL",
      deadline: "Check source URL",
      opportunityType: "Opportunity",
      tags: ["Opportunity"],
      scrapeNote: "Webpage content could not be fully parsed automatically (source site may require JavaScript or authentication)."
    };
  }
};

module.exports = {
  isValidUrl,
  scrapeOpportunityUrl
};
