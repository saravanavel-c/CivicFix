# CivicFix — AI-Assisted Civic Sense Reporting System

**CivicFix** connects citizens with municipal authorities to report, track, and resolve civic infrastructure issues — potholes, garbage, broken streetlights, water leaks, drainage blockages, and more.

Citizens submit reports with photos, GPS location, and descriptions. AI validates submissions, classifies categories, detects duplicates, and scores priority. Authorities manage, assign, and resolve reports through dedicated dashboards. All data persists in **Supabase PostgreSQL**.

---

## Features

| Feature | Status |
|---|---|
| Multi-step complaint submission with photo upload | ✅ Done |
| GPS location + draggable Leaflet map | ✅ Done |
| AI text classification (keyword heuristic + Groq LLM) | ✅ Done |
| AI image classification (Gemini Vision) | ✅ Done |
| Complaint validation (rule-based + LLM) | ✅ Done |
| Duplicate detection (Haversine + Jaccard similarity) | ✅ Done |
| Priority scoring (keyword + category + duplicate boost) | ✅ Done |
| Supabase PostgreSQL persistence | ✅ Done |
| Supabase Storage image uploads | ✅ Done |
| Row Level Security (citizen/officer/admin policies) | ✅ Done |
| Supabase Auth (email/password sign-in + sign-up) | ✅ Done |
| Complaint tracking by public tracking ID | ✅ Done |
| Status history audit trail | ✅ Done |
| Citizen dashboard | ✅ Done |
| Department/Officer dashboard | ✅ Done |
| Admin user management dashboard | ✅ Done |
| Worker field dashboard | ✅ Done |
| Nearby issues map view | ✅ Done |
| Demo/offline mode (localStorage fallback) | ✅ Done |
| Automated test suite | ⏳ Pending (P1) |
| Real-time notifications (Supabase Realtime) | ⏳ Pending (P2) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Routing | React Router v7 |
| Maps | Leaflet + react-leaflet |
| Icons | Lucide React |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Backend | Node.js + Express 4 (ESM) |
| AI Text | Groq LLM (optional) + keyword heuristic |
| AI Image | Google Gemini 2.5 Flash Vision |
| Dev tooling | concurrently (runs frontend + backend together) |

---

## Project Structure

```
CivicFix/
├── frontend/              # React/Vite application
│   ├── src/
│   │   ├── pages/         # All page components (Dashboard, ReportIssue, etc.)
│   │   ├── components/    # Layout, Header, Sidebar + common UI components
│   │   ├── services/      # Data layer (complaintService, userService, etc.)
│   │   ├── hooks/         # useGeolocation
│   │   ├── lib/           # supabaseClient.js
│   │   └── data/          # mockData.js, mockUsers.js (demo seed)
│   └── .env.example
├── backend/               # Express API server
│   ├── server.js          # All routes + auth middleware
│   ├── classifier.js      # Text classification
│   ├── validation.js      # Complaint validation (+ Groq)
│   ├── duplicateDetection.js
│   ├── prioritization.js
│   ├── imageClassifier.js # Gemini Vision
│   ├── config/supabase.js # Admin client
│   └── .env.example
├── supabase/
│   └── migrations/        # SQL migration files
└── docs/
    ├── PROJECT_AUDIT.md
    ├── SUPABASE_IMPLEMENTATION_PLAN.md
    ├── DATABASE_SCHEMA.md
    ├── API_DOCUMENTATION.md
    └── LOCAL_SETUP.md
```

---

## Quick Start

Full instructions in [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md).

```bash
# 1. Clone
git clone https://github.com/saravanavel-c/CivicFix.git
cd CivicFix

# 2. Configure environment (see docs/LOCAL_SETUP.md for details)
cp frontend/.env.example frontend/.env   # fill in Supabase URL + anon key
cp backend/.env.example  backend/.env    # fill in service_role key + AI keys

# 3. Apply database migration
# Open Supabase SQL Editor → paste supabase/migrations/20261018000000_initial_schema.sql → Run

# 4. Install and start
npm install           # installs concurrently at root
npm run dev           # starts backend (:5000) + frontend (:5173)
```

Open **http://localhost:5173**

---

## Demo Mode

No Supabase credentials needed to explore the UI:

- Click any role card on the Login page (Citizen / Department / Worker / Admin)
- All features work using mock data seeded from `localStorage`
- Data resets on browser clear

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/classify` | None | AI text classification |
| `POST` | `/api/classify-image` | None | AI image classification (Gemini) |
| `POST` | `/api/analyze-complaint` | None | Validation + duplicates + priority |
| `POST` | `/api/reports` | Required | Create report |
| `GET` | `/api/reports` | None | List reports (paginated) |
| `GET` | `/api/reports/mine` | Required | Current user's reports |
| `GET` | `/api/reports/track/:id` | None | Public tracking by ID |
| `GET` | `/api/reports/:id` | None | Single report + history |
| `PATCH` | `/api/reports/:id/status` | Officer+ | Update status |
| `PATCH` | `/api/reports/:id/assign` | Officer+ | Assign to officer |
| `GET` | `/health` | None | Health check |

Full documentation: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)

---

## Documentation

| Document | Description |
|---|---|
| [`docs/PROJECT_AUDIT.md`](docs/PROJECT_AUDIT.md) | Full architecture audit, feature matrix, defect report |
| [`docs/SUPABASE_IMPLEMENTATION_PLAN.md`](docs/SUPABASE_IMPLEMENTATION_PLAN.md) | Integration plan, steps, acceptance criteria |
| [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Tables, triggers, RLS policies, ER diagram |
| [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) | All backend API routes with request/response examples |
| [`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md) | Step-by-step development setup guide |

---

## Security Notes

- The `SUPABASE_SERVICE_ROLE_KEY` is server-side only and bypasses RLS — never expose it to the browser.
- `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) is safe to expose; RLS policies enforce authorization.
- Neither `.env` file is committed to git (see `.gitignore`).
- Citizens cannot self-escalate their role — the new-user trigger always inserts `role = 'citizen'`.
- Status history is immutable — no UPDATE or DELETE RLS policies exist on that table.

---

## License

ISC © 2026 CivicFix
