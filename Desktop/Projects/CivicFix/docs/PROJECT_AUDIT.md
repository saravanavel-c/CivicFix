# CivicFix — Full Repository Audit & Architecture Report

**Audit Date:** October 2026  
**Audited Commit:** `db64fec` (HEAD → main, upstream/main)  
**Repository:** https://github.com/saravanavel-c/CivicFix  
**Auditor:** Kiro (AI Senior Full-Stack Engineer)

---

## 1. Executive Summary

CivicFix is an AI-assisted civic issue reporting system that lets citizens report infrastructure problems (potholes, garbage, drainage, streetlights, water leaks) via a multi-step React form with GPS location, photo upload, AI category classification, AI complaint validation, duplicate detection, and priority scoring. Municipal authorities (departments, workers, admins) can view, assign, and update complaints through dedicated dashboards.

The current codebase is feature-rich on the frontend but **all data persistence is in browser `localStorage`** using mock seed data. There is no real database. The Supabase client exists but the current `supabaseClient.js` uses a test project URL and the main `App.jsx` has already been partially replaced with a Supabase integration demo. The full application source (pages, components, services) was missing from the working tree and has been restored from the git HEAD commit as part of this audit.

**Critical gap:** The database (Supabase) is configured but the full app's service layer (`complaintService.js`, `userService.js`, etc.) still reads and writes to `localStorage`. Bridging this is the primary objective of the integration phases.

---

## 2. Architecture Audit

### A. Frontend
| Attribute | Value |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Routing | React Router v7 |
| Icons | Lucide React |
| Map | React-Leaflet / Leaflet |
| State | React local `useState`/`useEffect` + browser `localStorage` |
| AI integration | Fetch calls to Express backend at `http://localhost:5000` |
| DB client | `@supabase/supabase-js` v2 (initialized, not yet wired into service layer) |

### B. Backend
| Attribute | Value |
|---|---|
| Framework | Express 4 on Node.js (ESM) |
| Port | 5000 (dev) |
| AI text classification | Keyword-based heuristic (`classifier.js`), optional Groq LLM (`validation.js`) |
| AI image classification | Gemini 2.5 Flash vision API (`imageClassifier.js`) |
| Validation | Rule-based + optional LLM via Groq (`validation.js`) |
| Duplicate detection | Haversine distance + Jaccard text similarity (`duplicateDetection.js`) |
| Priority scoring | Keyword scoring + category baseline + duplicate boost (`prioritization.js`) |
| Database | None — no Supabase server-side integration yet |

### C. Entry Points
- **Frontend:** `frontend/src/main.jsx` → `App.jsx` → React Router
- **Backend:** `backend/server.js` — Express app on port 5000
- **Root dev script:** `npm run dev` uses `concurrently` to start both

### D. Routing Architecture
| Path | Component | Role |
|---|---|---|
| `/login` | `Login.jsx` | All roles |
| `/dashboard` | `Dashboard.jsx` | Citizen |
| `/report` | `ReportIssue.jsx` | Citizen |
| `/complaints` | `ComplaintsList.jsx` | Citizen |
| `/complaints/:id` | `ComplaintDetail.jsx` | Citizen |
| `/nearby` | `NearbyIssues.jsx` | Citizen |
| `/notifications` | `Notifications.jsx` | Citizen |
| `/profile` | `Profile.jsx` | All roles |
| `/admin/dashboard` | `AdminDashboard.jsx` | Admin |
| `/department/dashboard` | `DepartmentDashboard.jsx` | Officer |
| `/department/complaints/:id` | `DepartmentComplaintDetails.jsx` | Officer |
| `/department/heatmap` | `DepartmentHeatmap.jsx` | Officer |
| `/department/prediction` | `DepartmentPrediction.jsx` | Officer |
| `/worker/dashboard` | `WorkerDashboard.jsx` | Worker |

### E. Existing API Endpoints (Backend)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/classify` | Keyword-based text classification |
| `POST` | `/api/analyze-complaint` | Validation + duplicate detection + priority scoring |
| `GET` | `/health` | Health check |

### F. Environment Variables
| Variable | Location | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `frontend/.env` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `frontend/.env` | Supabase anon/publishable key |
| `VITE_API_BASE_URL` | `frontend/.env` (optional) | Backend URL for production |
| `PORT` | Backend `.env` (not present) | Express server port (default 5000) |
| `GROQ_API_KEY` | Backend `.env` (not present) | Groq LLM API key (optional, validation falls back without it) |
| `GEMINI_API_KEY` | Backend `.env` (not present) | Gemini vision API key (required for image AI classification) |

### G. Database / Storage
- **Current:** Browser `localStorage` seeded from `mockData.js` and `mockUsers.js`
- **Planned:** Supabase PostgreSQL + Supabase Storage
- **Supabase migration:** `supabase/migrations/20261018000000_initial_schema.sql` exists with tables `profiles`, `reports`, `report_status_history` — **contains a SQL syntax bug** (`create or function` instead of `create or replace function`)

### H. Authentication
- **Current:** Simulated role-switcher via `localStorage` `ROLE` key — no real auth
- **Planned:** Supabase Auth (referenced in docs but not yet integrated)

### I. Testing
- No automated test suite. No Jest, Vitest, or Cypress configuration found.

### J. Deployment Configuration
- No CI/CD, Dockerfile, or cloud platform config found
- `node_modules` were accidentally committed to git at root level (not excluded by `.gitignore` at root)

---

## 3. Architecture Diagram

```mermaid
graph TD
    subgraph Browser["Browser (React 19 + Vite)"]
        Login[Login.jsx\nRole Switcher]
        Pages["Pages\n(Dashboard, ReportIssue,\nComplaintsList, NearbyIssues,\nAdminDashboard, DepartmentDashboard,\nWorkerDashboard, etc.)"]
        Services["Service Layer\ncomplaintService.js\nuserService.js\nnearbyService.js\nnotificationService.js\nanalysisService.js\nclassificationService.js"]
        Storage[(localStorage\nMock seed data)]
        SupabaseClient[supabaseClient.js\n@supabase/supabase-js]
    end

    subgraph Backend["Backend (Express / Node.js :5000)"]
        ClassifyAPI[POST /api/classify\nKeyword heuristic]
        AnalyzeAPI[POST /api/analyze-complaint\nValidation + Duplicates + Priority]
        Validator[validation.js\nRule-based + Groq LLM]
        DupDetect[duplicateDetection.js\nHaversine + Jaccard]
        PrioEngine[prioritization.js\nKeyword scoring]
        ImgClassifier[imageClassifier.js\nGemini Vision]
    end

    subgraph External["External Services"]
        GroqLLM[Groq LLM API\nComplaint validation]
        GeminiVision[Gemini 2.5 Flash\nImage classification]
        Nominatim[Nominatim OSM\nReverse geocoding]
        Supabase[(Supabase\nPostgreSQL + Storage)]
    end

    Pages --> Services
    Services --> Storage
    Services --> SupabaseClient
    SupabaseClient --> Supabase
    Services -- fetch /api/classify --> ClassifyAPI
    Services -- fetch /api/analyze-complaint --> AnalyzeAPI
    ClassifyAPI --> Validator
    AnalyzeAPI --> Validator
    AnalyzeAPI --> DupDetect
    AnalyzeAPI --> PrioEngine
    Validator --> GroqLLM
    ImgClassifier --> GeminiVision
    Pages -- Nominatim reverse geocode --> Nominatim

    style Storage fill:#fde68a,stroke:#f59e0b
    style Supabase fill:#a7f3d0,stroke:#10b981
    style GroqLLM fill:#ddd6fe,stroke:#7c3aed
    style GeminiVision fill:#ddd6fe,stroke:#7c3aed
```

*Note: The dashed arrow from Services → SupabaseClient exists in code but the main service layer (complaintService.js etc.) still targets localStorage, not Supabase.*

---

## 4. Feature Completion Matrix

| # | Feature | Relevant Files | Status | Evidence | Required Action |
|---|---|---|---|---|---|
| 1 | Citizen Registration & Auth | `Login.jsx`, `userService.js`, `storage.js` | NOT DONE | Login page exists but only writes `ROLE` to localStorage. No Supabase Auth calls. | Integrate `supabase.auth.signUp` / `signIn` / `signOut`. |
| 2 | Civic Complaint Submission | `ReportIssue.jsx`, `complaintService.js` | PARTIALLY DONE | Full 5-step UI form exists. `createComplaint()` saves to localStorage, not Supabase. | Connect `createComplaint` to Supabase `reports` table insert. |
| 3 | Issue Category Selection | `ReportIssue.jsx` (step 4) | DONE | 6 categories rendered with AI auto-detect fallback. | Keep aligned with DB enum. |
| 4 | Image Upload & Preview | `ReportIssue.jsx` (step 1) | PARTIALLY DONE | File input + `URL.createObjectURL` preview works. Image stored as blob URL, not uploaded to Supabase Storage. | Upload file to `report-images` bucket; store signed URL in `reports.image_path`. |
| 5 | AI Text Classification | `classificationService.js`, `backend/classifier.js` | DONE | Frontend calls `POST /api/classify`; backend uses keyword heuristic. Falls back to "Other" on failure. | Consider upgrading to Groq LLM classification. Already fail-safe. |
| 6 | AI Image Classification | `backend/imageClassifier.js` | PARTIALLY DONE | `imageClassifier.js` fully implemented with Gemini vision. **No frontend endpoint or route exposes it** — it is not called anywhere. | Add `POST /api/classify-image` backend route and call it from `ReportIssue.jsx`. |
| 7 | Complaint Validation | `backend/validation.js`, `analysisService.js` | DONE | Rule-based + optional Groq LLM validation. Frontend reads `analysis.validation.isValid` and blocks submission. Fails open. | Wire backend's `.env` with `GROQ_API_KEY` for full LLM layer. |
| 8 | Duplicate Detection | `backend/duplicateDetection.js`, `analysisService.js` | PARTIALLY DONE | Haversine + Jaccard algorithm fully implemented. But `existingComplaints` passed to backend comes from `complaintService.getMyComplaints()` = localStorage only. | Pass reports from Supabase to duplicate detection. |
| 9 | Priority Calculation | `backend/prioritization.js`, `analysisService.js` | DONE | Keyword scoring + category baseline + duplicate boost. Returns `{priority, score, reasons}`. Used in submit flow. | Persist `priority` field in Supabase report. |
| 10 | GPS & Location Selection | `ReportIssue.jsx`, `useGeolocation.js`, Nominatim | DONE | Live GPS watch, draggable Leaflet map, Nominatim reverse geocode. Low-accuracy fallback documented. | Store `latitude`, `longitude`, `address` in Supabase. |
| 11 | Map Integration | `MapPicker.jsx`, `NearbyIssues.jsx` | DONE | Leaflet + react-leaflet MapPicker with draggable marker. NearbyIssues renders mock markers. | Load Supabase report coordinates as map markers in NearbyIssues. |
| 12 | Nearby Complaint Discovery | `NearbyIssues.jsx`, `nearbyService.js` | PARTIALLY DONE | `nearbyService.getNearbyIssues()` returns localStorage mock data. UI filtering works. | Query Supabase with lat/lng bounding box or haversine proximity. |
| 13 | Complaint List & Detail Views | `ComplaintsList.jsx`, `ComplaintDetail.jsx`, `complaintService.js` | PARTIALLY DONE | Lists and detail views render mock localStorage data. | Fetch paginated reports from Supabase `reports` table. |
| 14 | Complaint Tracking | `ComplaintDetail.jsx`, `complaintService.js` | PARTIALLY DONE | IDs formatted as `CIV-XXXX`, generated sequentially from localStorage. Tracking UI exists. | Use Supabase `tracking_id` (`CIV-` + random 8 chars). Query by `tracking_id`. |
| 15 | Authority / Admin Dashboard | `AdminDashboard.jsx` | PARTIALLY DONE | Full admin UI with user management tabs (citizens, department, workers). All data from localStorage. | Connect user management to Supabase `profiles` table. |
| 16 | Complaint Assignment & Status Updates | `DepartmentDashboard.jsx`, `DepartmentComplaintDetails.jsx`, `WorkerDashboard.jsx`, `complaintService.js` | PARTIALLY DONE | Assignment and status-update flows exist with UI. All writes go to localStorage. | Write status transitions to Supabase `reports` + `report_status_history`. |
| 17 | Database Persistence | `storage.js` | NOT DONE | Entire persistence layer is `localStorage` + mock seed data. Data lost on browser clear. | Replace with Supabase queries throughout all service files. |
| 18 | Image / Object Storage | `complaintService.js` (stores blob URL) | NOT DONE | Images are object URLs local to the browser tab. Not persisted. | Use Supabase Storage `report-images` bucket. |
| 19 | Notifications | `Notifications.jsx`, `notificationService.js` | PARTIALLY DONE | In-app notifications stored in localStorage. Read/unread state works. | Persist to Supabase or trigger from DB events. |
| 20 | API Error Handling | All service files | PARTIALLY DONE | `analysisService.js` has robust fallback. `complaintService.js` uses bare try/catch. No user-visible toast for most errors. | Add toast error propagation. Supabase calls need error handling. |
| 21 | Security & Authorization | None | NOT DONE | No authentication, no authorization, no RLS. Any user can change role via localStorage. | Implement Supabase Auth + RLS policies. |
| 22 | Automated Testing | — | NOT DONE | No test framework, no test files found. | Add Vitest for unit tests; test service layer and API routes. |
| 23 | Build & Deployment | `frontend/package.json`, `vite.config.js` | DONE | `vite build` works. `npm run dev` starts both servers via `concurrently`. | Ensure `.env` vars injected at build time for production. |

---

## 5. Defect and Risk Report

### CRITICAL (P0 — Security / Data Loss)

| # | Defect | File | Risk |
|---|---|---|---|
| D1 | **All data in localStorage** | `storage.js`, all services | Complete data loss on browser clear. No sharing between devices or users. |
| D2 | **No authentication** | `Login.jsx`, `userService.js` | Any user can select any role (admin, officer) by clicking a button. No credentials verified. |
| D3 | **`.env` committed to git** | `frontend/.env` | Supabase URL + publishable key in version control. Publishable key is safe to expose but URL should be in `.env.example` only. |
| D4 | **`node_modules` committed at repo root** | `node_modules/` in git tree | Repository bloated; `concurrently` deps tracked in git. Needs root-level `.gitignore`. |
| D5 | **SQL syntax bug in migration** | `supabase/migrations/...sql` | `create or function` (line ~68) is invalid SQL. Migration will fail on apply. Must be `create or replace function`. |

### HIGH (P1 — Core Functionality Broken)

| # | Defect | File | Risk |
|---|---|---|---|
| D6 | **Image classification never called** | `backend/imageClassifier.js` | `classifyComplaintWithImage()` implemented but no HTTP route exposes it. Image AI is dead code. |
| D7 | **Duplicate detection uses stale data** | `analysisService.js`, `complaintService.js` | `getMyComplaints()` returns only the current user's localStorage complaints — not the full database. Duplicates from other users invisible. |
| D8 | **Tracking IDs sequential and predictable** | `complaintService.js` | IDs like `CIV-1026` are guessable. Anyone can enumerate all complaint IDs. |
| D9 | **No backend `.env`** | `backend/` | `GROQ_API_KEY` and `GEMINI_API_KEY` unavailable. LLM validation and image AI silently skip. No `.env.example` for backend. |
| D10 | **Supabase client version mismatch** | `frontend/package.json` | The current repo's `package.json` (from HEAD) does NOT include `@supabase/supabase-js`. The earlier demo version did. Must be added back. |

### MEDIUM (P2 — Enhancement / Robustness)

| # | Defect | File | Risk |
|---|---|---|---|
| D11 | **No CORS restriction** | `backend/server.js` | `cors()` with no options allows all origins. Should restrict to known frontend origins. |
| D12 | **No file upload size limit** | `backend/server.js` | `express.json({ limit: '2mb' })` exists but image uploads would go directly to Supabase Storage — need Storage policy limits. |
| D13 | **Voice dictation is a simulation** | `ReportIssue.jsx` | `handleVoiceInput` inserts hardcoded text after 2.5s. Not real speech recognition. |
| D14 | **`vite.config.js` proxy missing for prod** | `vite.config.js` | Proxy only works in dev. Production needs `VITE_API_BASE_URL` set correctly. |
| D15 | **Heatmap and Prediction pages** | `DepartmentHeatmap.jsx`, `DepartmentPrediction.jsx` | UI exists but data is mock. No real statistical backend. |
| D16 | **No root `.gitignore`** | Repo root | Root-level `node_modules` are tracked in git. A root `.gitignore` is missing. |
| D17 | **`frontend/src/lib/supabaseClient.js` outdated** | `supabaseClient.js` | File exists with correct env var names but the restored `App.jsx` no longer imports it. Need to keep it for the integration phase. |
