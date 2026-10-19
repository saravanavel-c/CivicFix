# Supabase Implementation Plan — CivicFix

**Version:** 2.0 (post-audit)  
**Audit basis:** commit `db64fec`, October 2026

---

## 1. Overview

This plan documents the concrete steps to replace CivicFix's browser `localStorage` persistence with Supabase PostgreSQL and Supabase Storage, while preserving the existing multi-role React frontend, Express backend AI services, and all working features.

The approach is incremental: the existing UI components and page layouts are unchanged. Only the service layer (`complaintService.js`, `userService.js`, `nearbyService.js`, `notificationService.js`) and backend API routes are updated to read and write through Supabase instead of `localStorage`.

---

## 2. Pre-conditions and Dependencies

| Requirement | Status | Notes |
|---|---|---|
| Supabase project created | NEEDED | Create at supabase.com. Obtain URL + anon key + service_role key. |
| `@supabase/supabase-js` in frontend deps | NEEDED | Add to `frontend/package.json` — missing from HEAD commit. |
| `@supabase/supabase-js` in backend deps | NEEDED | Add to `backend/package.json` for server-side queries. |
| Backend `.env` file | NEEDED | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY` |
| Frontend `.env` | EXISTS | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| Supabase Storage bucket `report-images` | NEEDED | Create in Supabase dashboard. |
| SQL migration applied | NEEDED | Fix syntax bug then run in Supabase SQL Editor. |

---

## 3. Database Schema (Required Tables)

### 3.1 `profiles`
Extends `auth.users`. Auto-created on signup via trigger.

```
id           uuid PK → auth.users.id
full_name    text NOT NULL
role         user_role enum ('citizen','officer','admin') DEFAULT 'citizen'
avatar_url   text
created_at   timestamptz
updated_at   timestamptz
```

**Security note:** Citizens must NOT be able to self-assign `officer` or `admin` roles. The trigger inserts `citizen` by default and the RLS UPDATE policy excludes the `role` column from citizen writes.

### 3.2 `reports`
Core civic report record.

```
id             uuid PK DEFAULT uuid_generate_v4()
tracking_id    text UNIQUE NOT NULL DEFAULT 'CIV-' || upper(substr(md5(random()::text),1,8))
user_id        uuid → profiles.id ON DELETE SET NULL (nullable = anonymous permitted)
title          text NOT NULL
description    text NOT NULL
category       report_category enum NOT NULL DEFAULT 'other'
status         report_status enum NOT NULL DEFAULT 'submitted'
priority       report_priority enum NOT NULL DEFAULT 'medium'
latitude       double precision NOT NULL
longitude      double precision NOT NULL
address        text
image_path     text  (Supabase Storage object path — NOT a data URL)
ai_category    text
ai_confidence  numeric(5,2)
created_at     timestamptz
updated_at     timestamptz  (auto-maintained by trigger)
resolved_at    timestamptz
```

**Enums:** `report_category` = pothole|garbage|streetlight|water|drainage|road|sanitation|electricity|other; `report_status` = submitted|under_review|in_progress|resolved|rejected; `report_priority` = low|medium|high|urgent.

### 3.3 `report_status_history`
Immutable audit trail — no UPDATE or DELETE allowed for citizens or officers.

```
id          uuid PK
report_id   uuid → reports.id ON DELETE CASCADE
old_status  report_status
new_status  report_status NOT NULL
changed_by  uuid → profiles.id ON DELETE SET NULL
comment     text
created_at  timestamptz
```

### 3.4 Tables NOT created (rationale)
- `report_assignments` — worker assignment is stored as `assigned_officer_id` on the `reports` row plus a status_history entry. A separate table would be premature given current scope.
- `report_comments` — no comments UI exists in current codebase.
- `report_votes` — upvote feature in NearbyIssues uses mock data; adding a votes table is deferred until the feature is properly scoped.

---

## 4. Implementation Steps (Ordered)

### Step 1 — Fix and apply database migration
**File:** `supabase/migrations/20261018000000_initial_schema.sql`

- Fix: `create or function` → `create or replace function`
- Add `avatar_url` column to `profiles`
- Expand category enum to include `road`, `sanitation`, `electricity` (frontend uses these labels)
- Align status/priority enums with frontend values
- Apply via Supabase SQL Editor or CLI

**Acceptance:** All three tables exist; RLS enabled; trigger fires on `auth.users` insert.

### Step 2 — Add Supabase dependencies
**Files changed:**
- `frontend/package.json` — add `"@supabase/supabase-js": "^2.39.0"`
- `backend/package.json` — add `"@supabase/supabase-js": "^2.39.0"`, `"dotenv"` (already present)

**Acceptance:** `npm install` succeeds in both directories.

### Step 3 — Environment configuration
**Files created/updated:**
- `frontend/.env` — already has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- `frontend/.env.example` — update placeholder comments
- `backend/.env` — create with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, `PORT`
- `backend/.env.example` — create with placeholder names only
- Root `.gitignore` — add to exclude `node_modules/`, `.env`, `dist/`

**Security rules enforced:**
- `SUPABASE_SERVICE_ROLE_KEY` NEVER in frontend code or git
- `VITE_SUPABASE_PUBLISHABLE_KEY` acceptable in frontend (anon key, RLS-protected)
- Both `.env` files excluded from git

**Acceptance:** `git status` shows neither `.env` file as tracked.

### Step 4 — Supabase client modules
**Files created/updated:**
- `frontend/src/lib/supabaseClient.js` — keep existing, add startup warning for missing vars
- `backend/src/config/supabase.js` — new server-side client using service_role key

**Acceptance:** Client initializes without crash; missing-var warning logged on startup.

### Step 5 — Backend API routes for reports
**File changed:** `backend/server.js`

New routes added (existing `/api/classify` and `/api/analyze-complaint` preserved):

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/reports` | JWT Bearer | Create report + upload image path |
| `GET` | `/api/reports` | Optional | List reports (paginated, filtered) |
| `GET` | `/api/reports/mine` | JWT Bearer | Current user's reports |
| `GET` | `/api/reports/track/:trackingId` | None | Public tracking by ID |
| `GET` | `/api/reports/:id` | Optional | Single report + history |
| `PATCH` | `/api/reports/:id/status` | JWT Bearer (officer/admin) | Status transition |
| `GET` | `/api/reports/:id/history` | Optional | Status history |
| `POST` | `/api/classify-image` | None | Image AI classification (new) |

All routes: validate input, use Supabase SDK (parameterized), enforce authorization, return structured errors.

**Acceptance:** `POST /api/reports` creates a row in Supabase; `GET /api/reports/track/:id` returns that row.

### Step 6 — Frontend service layer migration
**Files changed:**

| File | Change |
|---|---|
| `frontend/src/services/complaintService.js` | Replace localStorage calls with `fetch()` to backend API routes |
| `frontend/src/services/userService.js` | Replace localStorage with Supabase Auth + profiles table queries |
| `frontend/src/services/nearbyService.js` | Replace localStorage with Supabase query filtered by lat/lng bounds |
| `frontend/src/services/notificationService.js` | Keep localStorage for now; add TODO for Supabase Realtime |
| `frontend/src/services/storage.js` | Keep mock seed init for dev/demo mode only |

**Migration strategy:** Each service method keeps the same function signature so page components need no changes. The implementation switches from `getFromStorage()` to `fetch()` or `supabase.from()` calls.

**Acceptance:** Submitting a report via UI creates a Supabase row; refreshing the page still shows the report.

### Step 7 — Image upload to Supabase Storage
**Files changed:** `complaintService.js` (createReport adds upload step), `ReportIssue.jsx` (passes File object not blob URL)

Flow:
1. User selects image → File object held in state
2. On submit: upload to `report-images/{user_id}/{uuid}.{ext}`
3. Get signed URL or public URL
4. Store path in `reports.image_path`
5. Display images using signed URL fetched via `supabase.storage.from().createSignedUrl()`

**Bucket policy:** Authenticated users can upload to `report-images/{auth.uid()}/`; read restricted to owner and officers/admins.

**Acceptance:** Uploaded image visible after page reload; storage object path stored in DB.

### Step 8 — Row Level Security policies
**File:** `supabase/migrations/20261018000000_initial_schema.sql` (policies already in migration, validated)

Policies to verify:
- Citizens: INSERT own reports, SELECT all (public transparency), UPDATE own non-privileged fields
- Officers/Admins: UPDATE any report status, INSERT status_history
- Profiles: INSERT own, SELECT all, UPDATE own (excluding `role` field)
- Storage: upload to own path, read own + officers/admins

**Acceptance:** Logged-in citizen cannot update another citizen's report; officer can change status.

### Step 9 — Frontend auth UI
**File changed:** `Login.jsx`

Replace mock role-switcher with:
- Email + password form
- `supabase.auth.signInWithPassword()` on submit
- `supabase.auth.signUp()` for registration
- Session stored by Supabase client automatically
- Role read from `profiles.role` after login
- Redirect based on role (`citizen` → `/dashboard`, `admin` → `/admin/dashboard`, etc.)

**Acceptance:** Login with real Supabase Auth credentials; role-based redirect works.

### Step 10 — Verification
See Phase 7 in main plan.

---

## 5. Defect Resolutions

| Defect | Resolution | File |
|---|---|---|
| D1 localStorage | Replace service layer with Supabase | Steps 6–7 above |
| D2 No auth | Supabase Auth in Login.jsx | Step 9 |
| D3 .env in git | Add root .gitignore | Step 3 |
| D4 node_modules committed | Root .gitignore + git rm --cached | Step 3 |
| D5 SQL syntax bug | Fix in migration file | Step 1 |
| D6 imageClassifier not routed | Add POST /api/classify-image | Step 5 |
| D7 Duplicate detection stale data | Pass DB reports to analyze-complaint | Step 6 |
| D8 Sequential IDs | Use DB-generated tracking_id | Step 1 |
| D9 No backend .env | Create backend/.env.example | Step 3 |
| D10 Missing @supabase/supabase-js | Add to package.json | Step 2 |
| D11 CORS open | Add origin whitelist to cors() | Step 5 |
| D16 No root .gitignore | Create root .gitignore | Step 3 |

---

## 6. Items Deferred (Out of Current Scope)

| Item | Reason | Priority |
|---|---|---|
| Real-time notifications via Supabase Realtime | Complex setup; in-app notifications sufficient for demo | P2 |
| Heatmap / prediction real data | Requires analytics backend; mock data acceptable for demo | P2 |
| Real voice recognition (Web Speech API) | Currently simulated; separate feature | P2 |
| PostGIS spatial queries for nearby issues | Bounding-box query sufficient; PostGIS needs extension | P2 |
| Full CI/CD pipeline | Out of scope for integration sprint | P2 |
| Automated test suite | No test runner configured; foundation needed first | P1 |

---

## 7. Acceptance Criteria Summary

The Supabase integration is considered complete when:

1. A citizen can register and log in via Supabase Auth.
2. A citizen can submit a report (with optional photo); the row appears in Supabase `reports`.
3. A submitted report survives a full browser refresh and is visible to another browser session.
4. The tracking ID (`CIV-XXXXXXXX`) returned to the citizen correctly retrieves the report.
5. An officer can change a report's status; the change is recorded in `report_status_history`.
6. A citizen cannot update another citizen's report (RLS verified).
7. Image uploads go to Supabase Storage and the path is stored in the report row.
8. The frontend production build (`npm run build`) succeeds with no errors.
9. No secrets appear in git history or console output.
