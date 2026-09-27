# 🚀 Personalized AI Opportunity Recommendation Platform

A full-stack, demo-ready hackathon platform built with **Node.js**, **Express.js**, **React**, and **AI Matching (Google Gemini)** following the clean **MVC (Model-View-Controller)** pattern.

Students create a comprehensive profile (`skills`, `interests`, `education`, `career goals`), provide any opportunity URL (internships, hackathons, fellowships, grants), and the system automatically **scrapes the webpage**, **extracts criteria**, and uses **AI** to generate a personalized match score, skills gap analysis, and tailored recommendations.

---

## 📑 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Key Features](#-key-features)
3. [Component Breakdown](#-component-breakdown)
   - [Backend (Express & MVC)](#1-backend-express--mvc)
   - [Frontend (React UI)](#2-frontend-react-ui)
   - [Database (PostgreSQL / Supabase & Persistent Local Fallback)](#3-database-postgresql--supabase--persistent-fallback)
   - [URL Scraper Service](#4-url-scraper-service)
   - [AI Recommendation Service](#5-ai-recommendation-service)
4. [Folder Structure](#-folder-structure)
5. [Prerequisites & Installation](#-prerequisites--installation)
6. [Environment Variables (.env)](#-environment-variables-env)
7. [Database Setup (Supabase / PostgreSQL)](#-database-setup-supabase--postgresql)
8. [AI Setup (Google Gemini API)](#-ai-setup-google-gemini-api)
9. [Running the Application](#-running-the-application)
10. [API Reference](#-api-reference)
11. [Automated Testing & Verification](#-automated-testing--verification)
12. [End-to-End Hackathon Demo Script](#-end-to-end-hackathon-demo-script)
13. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🏛️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend UI                        │
│          (Dashboard, Profile, Opportunities, Match)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API (JSON + Bearer Token)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Express API Layer                       │
│    routes/ ──► middleware/ ──► controllers/ ──► services/   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      Scraper Service         │ │        AI Service          │
│   (axios + cheerio parser)   │ │  (Gemini + Local Matcher)  │
└──────────────┬───────────────┘ └────────────┬───────────────┘
               │                              │
               └──────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer (Adapter)                  │
│       PostgreSQL (Supabase) OR Local data/database.json      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

1. **JWT User Authentication**: Secure signup and login with bcrypt password hashing.
2. **Student Profile Engine**: Tracks name, education, skills tags, domain interests, career aspirations, experience, and location.
3. **Automated URL Processing**: Accepts any public web link and extracts title, organization, description, requirements, and detected skills using Cheerio.
4. **AI-Powered Recommendation & Matching**:
   - Calculates a deterministic compatibility score (0–100%).
   - Identifies exact **Matching Skills** and **Missing Skills**.
   - Assesses education prerequisites and career goal alignment.
   - Provides personalized actionable guidance.
   - Powered by Google Gemini 1.5 Flash with an intelligent local heuristic matcher fallback.
5. **Student Feedback Loop**: Collects 1–5 star ratings and reviews on recommendations.
6. **Zero-Friction Dual Database Engine**:
   - Production-ready for **PostgreSQL / Supabase**.
   - Zero-config persistent local JSON storage in `data/database.json` so the app works offline immediately!
7. **Complete React Dashboard**: Clean, responsive dark-mode interface served directly by the Express backend.

---

## 🔍 Component Breakdown

### 1. Backend (Express & MVC)
- **Routes (`src/routes/`)**: Receives incoming requests and directs them to the appropriate controller. Protected by `authMiddleware.js`.
- **Controllers (`src/controllers/`)**: Coordinates input validation, service invocation, and database queries.
- **Models (`src/models/`)**: Abstraction layer over data storage for Users, Profiles, Opportunities, Recommendations, and Feedback.

### 2. Frontend (React UI)
- Hosted statically from `public/` and served directly on `http://localhost:5000`.
- Built with React 18, zero build step needed.
- Contains interactive tabs for Dashboard, Saved Opportunities, AI Matches, Student Profile Editor, Opportunity URL Submission, and Instant Feedback.

### 3. Database (PostgreSQL / Supabase & Persistent Fallback)
- **Supabase / PostgreSQL**: Set `DATABASE_URL` in `.env` to connect directly to PostgreSQL. The schema is defined in `schema.sql`.
- **Local Persistent Store**: If `DATABASE_URL` is omitted, the app persists records in `data/database.json`. Data survives server restarts!

### 4. URL Scraper Service (`src/services/scraperService.js`)
- Validates URLs and retrieves HTML via `axios` with browser headers.
- Parses OpenGraph tags, title tags, body text, and requirements headings using `cheerio`.
- Uses regex pattern matching to detect programming languages and technology keywords.
- Gracefully falls back if a site blocks automated bots, preventing crashes.

### 5. AI Service (`src/services/aiService.js`)
- Analyzes compatibility between the student profile and the opportunity data.
- Calls Google Gemini 1.5 Flash when `GEMINI_API_KEY` is provided.
- Returns strict structured JSON containing `matchScore`, `matchingSkills`, `missingSkills`, `careerGoalAlignment`, `educationMatch`, and `recommendation`.
- Includes an intelligent heuristic matcher fallback so your hackathon demo never fails even without an API key or Wi-Fi!

---

## 📁 Folder Structure

```text
├── data/
│   └── database.json          <- Persistent local storage file (auto-generated)
├── public/                    <- Frontend React Application
│   ├── app.js                 <- React 18 frontend logic & components
│   ├── index.html             <- HTML shell & font imports
│   └── styles.css             <- Modern dark-mode responsive design system
├── src/
│   ├── app.js                 <- Express configuration, static serving, route mounting
│   ├── config/
│   │   └── db.js              <- Unified database adapter (PostgreSQL + Local fallback)
│   ├── controllers/
│   │   ├── authController.js          <- Signup, login, getMe
│   │   ├── feedbackController.js      <- Submit & list student feedback
│   │   ├── opportunityController.js   <- URL scraping & opportunity listing
│   │   ├── profileController.js       <- Student profile CRUD
│   │   └── recommendationController.js<- AI matching & recommendations
│   ├── middleware/
│   │   ├── authMiddleware.js          <- JWT verification & route protection
│   │   └── errorHandler.js            <- Global clean error handler
│   ├── models/
│   │   ├── feedbackModel.js
│   │   ├── opportunityModel.js
│   │   ├── profileModel.js
│   │   ├── recommendationModel.js
│   │   └── userModel.js
│   ├── routes/
│   │   ├── authRoutes.js              <- /api/auth
│   │   ├── feedbackRoutes.js          <- /api/feedback
│   │   ├── healthRoutes.js            <- /api/health
│   │   ├── opportunityRoutes.js       <- /api/opportunities
│   │   ├── profileRoutes.js           <- /api/profile
│   │   └── recommendationRoutes.js    <- /api/recommendations
│   └── services/
│       ├── aiService.js               <- Gemini AI & deterministic heuristic matching
│       └── scraperService.js          <- Axios + Cheerio webpage parser
├── .env                       <- Active environment variables
├── .env.example               <- Template for team environment setup
├── .gitignore
├── package.json
├── schema.sql                 <- SQL schema for PostgreSQL / Supabase
├── server.js                  <- Entry point; starts HTTP server
└── test_e2e.js                <- Automated end-to-end integration test suite
```

---

## 🛠️ Prerequisites & Installation

### 1. Prerequisites
- **Node.js** (v18 or higher). Check with:
  ```bash
  node -v
  ```

### 2. Install Dependencies
```powershell
# On Windows PowerShell
npm.cmd install

# On Mac / Linux / Bash
npm install
```

Installed packages:
- `express`: REST API web framework
- `cors`: Cross-Origin Resource Sharing
- `dotenv`: Environment configuration
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT authentication
- `axios`: HTTP client for scraping and AI calls
- `cheerio`: HTML parsing and extraction
- `pg`: PostgreSQL client for Supabase

---

## ⚙️ Environment Variables (.env)

Create or update `.env` in the root folder:

```ini
# Server Port
PORT=5000

# Database Configuration (Optional)
# Leave empty for persistent local storage, or paste your Supabase connection string:
DATABASE_URL=
DATABASE_SSL=false

# AI Service Configuration
AI_PROVIDER=gemini
# Get a free Gemini key from: https://aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key_here

# Authentication Secret
JWT_SECRET=hackathon-secret-jwt-key-2026
```

---

## 🗄️ Database Setup (Supabase / PostgreSQL)

The platform works **out of the box** without any external database using local persistent JSON. To connect to **Supabase**:

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in your Supabase dashboard.
3. Copy the contents of [`schema.sql`](file:///d:/programming/anti/schema.sql) and paste them into the SQL Editor, then click **Run**.
4. In Supabase, go to **Project Settings** -> **Database** -> **Connection string** (URI).
5. Copy the connection string into `.env`:
   ```ini
   DATABASE_URL=postgresql://postgres.xxxx:your_password@aws-0-xx.pooler.supabase.com:6543/postgres
   DATABASE_SSL=true
   ```

---

## 🤖 AI Setup (Google Gemini API)

1. Get a free API key at [Google AI Studio](https://aistudio.google.com).
2. Set it in `.env`:
   ```ini
   GEMINI_API_KEY=AIzaSy...
   AI_PROVIDER=gemini
   ```
*(Note: If you run without a key or offline during a pitch, the built-in heuristic matching engine seamlessly takes over!)*

---

## 🚀 Running the Application

### Start the Server:
```powershell
npm.cmd start
```

### Development Mode (Auto-reloads on file change):
```powershell
npm.cmd run dev
```

### Accessing the Platform:
- **Web App (Frontend + Backend)**: [http://localhost:5000](http://localhost:5000)
- **API Overview**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📡 API Reference

### 1. Authentication
| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register student | `{"name","email","password"}` |
| `POST` | `/api/auth/login` | Authenticate | `{"email","password"}` |
| `GET` | `/api/auth/me` | Current user info | *(Requires Bearer Token)* |

### 2. Student Profile
| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/profile` | Get student profile | *(Optional Bearer Token)* |
| `POST` | `/api/profile` | Update profile | `{"name","education","skills":[],"interests":[],"careerGoals":""}` |
| `PUT` | `/api/profile` | Update profile | *(Same as POST)* |

### 3. Opportunities
| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/opportunities` | List opportunities | *(Optional Bearer Token)* |
| `GET` | `/api/opportunities/:id` | Get single opportunity | *(None)* |
| `POST` | `/api/opportunities` | Scrape & save URL | `{"url":"https://...","title":"","organization":""}` |

### 4. AI Recommendations
| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/recommendations` | List recommendations | *(Optional Bearer Token)* |
| `GET` | `/api/recommendations/:id` | Get single recommendation | *(None)* |
| `POST` | `/api/recommendations/analyze` | Run AI match analysis | `{"opportunityId": 1}` |

### 5. Feedback
| Method | Endpoint | Description | Payload |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/feedback` | List feedback | *(Optional Bearer Token)* |
| `POST` | `/api/feedback` | Submit rating & review | `{"opportunityId":1,"rating":5,"comment":""}` |

---

## 🧪 Automated Testing & Verification

Run the end-to-end integration test suite:

```powershell
npm.cmd test
```

This verifies:
- Server health (`GET /api/health`)
- Student signup & JWT generation
- Student login & authentication
- Profile creation & skill persistence
- Opportunity URL submission & web scraping
- AI matching algorithm & match score generation
- Recommendation retrieval
- Feedback submission & rating verification
- Error handling (invalid URLs, missing opportunities, 404 routes)

---

## 🎬 End-to-End Hackathon Demo Script

Follow these steps for a live presentation to judges:

1. **Open the App**:
   Navigate to [http://localhost:5000](http://localhost:5000) in your browser.
2. **Sign In**:
   Click **Sign In** and use the **"Demo Login (Alex Rivera)"** button for instant access, or click **Sign Up** to create an account for `Sam Chen`.
3. **Inspect Profile**:
   Go to the **Profile** tab. Add skills like `Python`, `JavaScript`, `Git`, and `Robotics`. Set career goal to `AI Engineer`. Click **Save Profile**.
4. **Submit an Opportunity URL**:
   Go to **Add URL**. Paste `https://summerofcode.withgoogle.com` or your hackathon link. Click **Process & Save Opportunity**. Watch the scraper extract the title, organization, and criteria.
5. **Generate AI Recommendation**:
   Go to **Opportunities** and click **⚡ Generate AI Match**.
6. **Showcase the Result**:
   Highlight the **Match Score** (e.g. 95%), the green **Matching Skills** chips, the amber **Missing Skills** chips, the **Career Alignment** explanation, and the **AI Actionable Advice**.
7. **Submit Student Feedback**:
   Click 5 stars, type a comment like *"Super relevant recommendation!"*, and click **Submit Feedback**.
8. **Demonstrate Persistence**:
   Refresh the page or restart the server — all recommendations and profiles remain intact!

---

## ❓ Troubleshooting & FAQ

- **Port 5000 already in use?**
  Change `PORT=5001` in `.env` and restart.
- **PowerShell blocks npm?**
  Run `npm.cmd` instead of `npm`.
- **Target site blocks scraping?**
  The scraper automatically provides graceful fallbacks using domain metadata so the server never crashes. You can also provide optional manual titles and descriptions.
- **No Gemini API Key?**
  Leave `GEMINI_API_KEY=` blank. The system automatically switches to the built-in deterministic matching engine for offline presentations.
