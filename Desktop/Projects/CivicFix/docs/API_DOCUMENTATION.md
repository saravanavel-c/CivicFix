# API Documentation — CivicFix Backend

**Base URL (dev):** `http://localhost:5000`  
**Base URL (prod):** Set `VITE_API_BASE_URL` in `frontend/.env`

All request and response bodies are JSON. Authenticated routes require an `Authorization: Bearer <supabase_access_token>` header.

---

## Authentication

Tokens are obtained via Supabase Auth (handled by the frontend `userService.js`):

```js
// Sign in
const { data } = await supabase.auth.signInWithPassword({ email, password });
const token = data.session.access_token;

// Attach to requests
fetch('/api/reports', { headers: { 'Authorization': `Bearer ${token}` } });
```

---

## AI Routes

### `POST /api/classify`
Keyword-based text classification. No auth required.

**Request body:**
```json
{ "description": "Large pothole blocking the left lane near the bus stop" }
```

**Response:**
```json
{ "category": "road" }
```

**Error (400):** `{ "error": "A non-empty \"description\" string is required." }`  
**Error (502):** `{ "error": "Classification service unavailable." }` — falls back to "Other" on frontend.

---

### `POST /api/analyze-complaint`
Runs validation + duplicate detection + priority scoring. No auth required.

**Request body:**
```json
{
  "description": "Sewage overflowing on Main Street causing flooding",
  "category":    "drainage",
  "latitude":    11.0168,
  "longitude":   76.9558,
  "existingComplaints": []
}
```

**Response:**
```json
{
  "validation": { "isValid": true, "reason": null },
  "duplicates": [
    { "id": "CIV-ABCD1234", "similarity": 0.72, "distanceMeters": 85 }
  ],
  "priority": {
    "priority": "High",
    "score": 7,
    "reasons": ["Base risk for drainage: 3", "High-severity terms found: flooding"]
  }
}
```

**Notes:**
- If `GROQ_API_KEY` is set, validation uses LLM; otherwise falls back to rule-based check.
- If Supabase is configured, the backend fetches nearby DB reports for better duplicate detection instead of using the caller-supplied `existingComplaints` list.

---

### `POST /api/classify-image`
AI image classification via Gemini Vision. No auth required. Requires `GEMINI_API_KEY`.

**Request body (option A — raw base64):**
```json
{
  "imageBase64": "<raw base64 string, no data: prefix>",
  "mimeType":    "image/jpeg",
  "description": "Optional citizen description to help the model"
}
```

**Request body (option B — remote URL):**
```json
{ "imageUrl": "https://example.com/pothole.jpg" }
```

**Response:**
```json
{ "category": "road" }
```

**Error (503):** `{ "error": "Image classification is unavailable: GEMINI_API_KEY is not configured.", "fallbackCategory": "other" }`

---

## Report Routes

### `POST /api/reports`
Create a new civic report. **Requires auth.**

**Request body:**
```json
{
  "title":          "Large pothole on Main Street",
  "description":    "About 30cm deep, causing vehicles to swerve. Near bus stop 14.",
  "category":       "road",
  "latitude":       11.0168,
  "longitude":      76.9558,
  "address":        "Main Street, Gandhipuram, Coimbatore",
  "image_path":     "a1b2c3d4-uuid/1698765432100-f3a2b1c0.jpg",
  "ai_category":    "road",
  "ai_confidence":  91.5,
  "priority":       "high"
}
```

**Response (201):**
```json
{
  "report": {
    "id":          "uuid-here",
    "tracking_id": "CIV-A3F2B1C0",
    "status":      "submitted",
    "created_at":  "2026-10-19T10:30:00Z",
    ...
  }
}
```

**Validation errors (400):** Missing/invalid fields return `{ "error": "..." }`.

---

### `GET /api/reports`
List all reports (paginated). Public.

**Query params:**
| Param | Type | Example | Notes |
|---|---|---|---|
| `category` | string | `road` | Filter by category enum value |
| `status` | string | `submitted` | Filter by status enum value |
| `priority` | string | `high` | Filter by priority enum value |
| `page` | number | `1` | Default: 1 |
| `pageSize` | number | `20` | Default: 20, max: 100 |

**Response:**
```json
{ "reports": [...], "total": 142 }
```

---

### `GET /api/reports/mine`
Current user's reports. **Requires auth.**

**Query params:** `page`, `pageSize`

**Response:** `{ "reports": [...], "total": 7 }`

---

### `GET /api/reports/track/:trackingId`
Public tracking by tracking ID. No auth required.

**URL param:** `trackingId` — format `CIV-XXXXXXXX` (case-insensitive)

**Response:**
```json
{
  "report": {
    "id": "...", "tracking_id": "CIV-A3F2B1C0",
    "title": "...", "status": "in_progress",
    "category": "road", "priority": "high",
    "address": "Main Street", "created_at": "..."
  },
  "history": [
    { "old_status": null, "new_status": "submitted", "comment": "Report submitted by citizen", "created_at": "..." },
    { "old_status": "submitted", "new_status": "in_progress", "comment": "Crew dispatched", "created_at": "..." }
  ]
}
```

**Note:** Private fields (user_id, image_path, assigned_to) are excluded from this endpoint.

---

### `GET /api/reports/:id`
Single report by database UUID. Public (limited fields) / Officers get full record.

**Response:** `{ "report": {...}, "history": [...] }`

---

### `GET /api/reports/:id/history`
Status history for a report. Public.

**Response:** `{ "history": [{ "old_status", "new_status", "comment", "created_at", "changed_by" }] }`

---

### `PATCH /api/reports/:id/status`
Update report status. **Requires officer or admin role.**

**Request body:**
```json
{ "status": "in_progress", "comment": "Crew dispatched to site." }
```

**Valid status values:** `submitted`, `under_review`, `in_progress`, `resolved`, `rejected`

**Response:** `{ "report": { ...updatedReport } }`

---

### `PATCH /api/reports/:id/assign`
Assign report to an officer. **Requires officer or admin role.**

**Request body:**
```json
{ "officer_id": "uuid-of-officer" }
```

**Response:** `{ "report": { ...updatedReport } }`

---

## Health Check

### `GET /health`
No auth required.

**Response:** `{ "status": "ok", "timestamp": "2026-10-19T10:30:00.000Z" }`

---

## Frontend Service Layer

The frontend communicates with the backend via `frontend/src/services/apiClient.js` which:
- Automatically attaches the Supabase JWT from the active session
- Parses JSON responses
- Throws structured errors with `err.status` and `err.message`

```js
import { apiFetch } from './services/apiClient';

// Example: create a report
const { report } = await apiFetch('/api/reports', {
  method: 'POST',
  body: JSON.stringify({ title, description, category, latitude, longitude }),
});
```

For Supabase direct queries (nearby issues, profile lookups), the frontend uses `frontend/src/lib/supabaseClient.js`.

---

## Error Response Format

All error responses follow:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|---|---|
| 400 | Validation error — bad input |
| 401 | Authentication required |
| 403 | Insufficient role/permissions |
| 404 | Resource not found |
| 500 | Server error |
| 502 | External AI service unavailable |
| 503 | Feature unavailable (missing API key) |
