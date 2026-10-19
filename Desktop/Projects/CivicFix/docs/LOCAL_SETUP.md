# Local Development Setup — CivicFix

## Prerequisites

| Tool | Minimum Version | Notes |
|---|---|---|
| Node.js | v18 | v20+ recommended |
| npm | v9 | Included with Node.js |
| Git | Any recent | For cloning |
| Supabase account | — | Free tier at [supabase.com](https://supabase.com) |
| Groq API key | — | Optional — for LLM complaint validation |
| Google Gemini API key | — | Optional — for image AI classification |

---

## 1. Clone the Repository

```bash
git clone https://github.com/saravanavel-c/CivicFix.git
cd CivicFix
```

---

## 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Note your **Project URL** and **anon/public key** from Project Settings → API.
3. Also note the **service_role key** (keep this secret — backend only).

---

## 3. Apply the Database Migration

1. Open your Supabase project → **SQL Editor**.
2. Paste the full contents of `supabase/migrations/20261018000000_initial_schema.sql`.
3. Click **Run**.
4. Verify: Tables `profiles`, `reports`, `report_status_history` should appear under Table Editor.

---

## 4. Create the Storage Bucket

1. In Supabase → **Storage** → **New Bucket**.
2. Name: `report-images`.
3. Set as **Private** (not public).
4. Set max file size: `5242880` (5 MB).
5. After creating, go to **Policies** and add the three storage RLS policies from `docs/DATABASE_SCHEMA.md` section 6.

---

## 5. Configure Environment Variables

### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
VITE_API_BASE_URL=
```

- Leave `VITE_API_BASE_URL` empty in development — Vite proxies `/api` to the backend automatically.
- In production, set it to your deployed backend URL: `https://civicfix-api.yourdomain.com`

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
FRONTEND_ORIGIN=http://localhost:5173
```

**Security rules:**
- `SUPABASE_SERVICE_ROLE_KEY` — NEVER put this in the frontend or commit it to git.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — safe to expose (anon key); security enforced by RLS.
- Both `.env` files are excluded from git by `.gitignore`.

---

## 6. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

---

## 7. Start the Development Servers

### Option A — Start both together from project root

```bash
# From the CivicFix/ root
npm install          # installs concurrently
npm run dev          # starts backend (:5000) + frontend (:5173) simultaneously
```

### Option B — Start separately

```bash
# Terminal 1 — Backend
cd backend
node server.js

# Terminal 2 — Frontend
cd frontend
npm run dev
```

The app will be available at: **http://localhost:5173**

---

## 8. Demo Mode (No Supabase Required)

The app works in demo/offline mode without Supabase credentials:
- All data is seeded from `frontend/src/data/mockData.js` into browser `localStorage`.
- Click any role card on the Login page to explore the full UI.
- Report submissions fall back to `localStorage` if the backend/DB is unavailable.

To disable demo mode and use real data, apply the migration and set the env vars above.

---

## 9. Production Build

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

Serve `frontend/dist/` with any static host (Vercel, Netlify, nginx, etc.).

---

## 10. Running Lint

```bash
cd frontend
npm run lint
```

Pre-existing lint warnings from the original codebase exist in some page components. New service and utility files introduced in this integration pass lint cleanly.

---

## 11. Applying Migrations (CLI method)

If you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed:

```bash
supabase login
supabase link --project-ref your-project-id
supabase db push
```

This applies all SQL files in `supabase/migrations/` in order.

---

## 12. Testing RLS Policies

To verify Row Level Security manually in the Supabase SQL Editor:

```sql
-- Test as an anonymous user (should return reports but not allow inserts)
set role anon;
select count(*) from reports;         -- should succeed
insert into reports (title, description, category, latitude, longitude)
  values ('test', 'test description', 'other', 0, 0);  -- should FAIL

-- Reset
reset role;
```

For full role testing, create test accounts with `citizen` and `officer` roles in the Supabase Auth dashboard.

---

## 13. Environment Variables Reference

| Variable | Location | Required | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_URL` | `frontend/.env` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `frontend/.env` | Yes | Supabase anon key |
| `VITE_API_BASE_URL` | `frontend/.env` | No (dev only) | Backend origin for production |
| `PORT` | `backend/.env` | No | Express port (default 5000) |
| `SUPABASE_URL` | `backend/.env` | Yes | Supabase project URL (same as above) |
| `SUPABASE_SERVICE_ROLE_KEY` | `backend/.env` | Yes | Service role key — server-side only |
| `GROQ_API_KEY` | `backend/.env` | No | Groq LLM for complaint validation |
| `GEMINI_API_KEY` | `backend/.env` | No | Gemini Vision for image classification |
| `FRONTEND_ORIGIN` | `backend/.env` | No | CORS allowed origin (default: localhost:5173) |
