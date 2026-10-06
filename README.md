# CivicFix

**CivicFix** is an AI-assisted civic issue reporting and resolution platform that connects citizens with municipal authorities. Citizens can report issues such as potholes, overflowing garbage, broken streetlights, water leakage, and drainage problems using images, location, and descriptions.

The platform aims to simplify complaint reporting, enable efficient issue management, and provide transparent tracking of complaints from submission to resolution.

## Current Module

### Citizen Dashboard

* Report civic issues
* Upload issue images
* Capture issue location
* Track submitted complaints
* View complaint status and updates
* Explore nearby reported issues
* Manage notifications and profile

> **Note:** This project is currently under development. Backend, AI services, and real-time integrations will be added in later stages.

## Tech Stack

* React
* Vite
* Tailwind CSS
* React Router
* Lucide React

## Getting Started

Clone the repository and install the dependencies:

```bash
cd frontend
npm install
```

Run the development server:

```bash
npm run dev
```

The application will be available at the localhost:5173.

## Project Status

**In Development**

## Map & Geolocation (New)

- The app now uses a free, high-quality basemap (CartoDB Voyager via Leaflet) and a draggable map picker so users can precisely set the report location.
- Live GPS tracking is supported (watchPosition). Users can start/stop live tracking from the Report Issue flow and see a small "Live GPS" badge while tracking is active.
- The marker on the map is draggable for fine adjustments; a mini-map preview and custom zoom controls were added for a polished UI.
- The app persists the last-known location to localStorage so it can be reused across sessions.

Files changed (core):
- [frontend/src/hooks/useGeolocation.js](frontend/src/hooks/useGeolocation.js)
- [frontend/src/components/common/MapPicker.jsx](frontend/src/components/common/MapPicker.jsx)
- [frontend/src/pages/ReportIssue.jsx](frontend/src/pages/ReportIssue.jsx)
- [frontend/src/pages/NearbyIssues.jsx](frontend/src/pages/NearbyIssues.jsx)
- [frontend/src/index.css](frontend/src/index.css)

## Additional Dependencies

Install the Leaflet map libraries required by the new UI:

```bash
cd frontend
npm install leaflet react-leaflet
```

Note: `leaflet` includes image assets that are imported by the components; Vite and modern bundlers should handle these imports automatically.

## Reverse Geocoding

Reverse geocoding (lat/lng -> readable address) uses Nominatim (OpenStreetMap) by default. Nominatim is free but rate-limited. If you expect high-volume or need guaranteed SLA, consider switching to a paid provider (Mapbox, Here, Google Maps) and updating the reverse-geocode call in [frontend/src/pages/ReportIssue.jsx](frontend/src/pages/ReportIssue.jsx).

## How to Test

1. Install dependencies and start the dev server (see commands above).
2. Open the app in a browser and grant Geolocation permission when prompted.
3. Go to "Report an Issue" and click "Use My Current Location" to start live tracking.
4. Drag the map marker to fine-tune the position; confirm the address updates in the form.
5. Submit the report to ensure coordinates are included in the payload.

## Notes & Next Steps

- If you want a different basemap style, I can switch to Positron (Carto) or Stamen toner/toner-lite.
- I can also add an optional API-key-based reverse geocoding provider and an admin setting to configure which provider to use.

## AI Category Classification (New)

- When a citizen picks "AI Auto-Detect Category" in the Report Issue flow, the issue is classified into one of the app's categories (Road, Sanitation, Drainage, Water, Electricity, Other) automatically.
- **If a photo is attached** (uploaded file or one of the preset simulation images), classification uses **Gemini 2.5 Flash** (vision) — the photo plus the description (if any) are sent together for higher accuracy.
- **If no photo is available**, classification falls back to **text-only** classification via Groq (`llama-3.1-8b-instant`) using just the description.
- All classification happens server-side only — API keys are never exposed to the browser.
- If the classification service is unreachable or errors, the frontend falls back to `Other` rather than blocking submission.

Files added/changed:
- [backend/server.js](backend/server.js) — Express server, `/api/classify` endpoint (routes to image or text classification depending on what's provided)
- [backend/classifier.js](backend/classifier.js) — Groq text-only classification
- [backend/imageClassifier.js](backend/imageClassifier.js) — Gemini vision classification (image + optional text), plus a helper to fetch remote preset images server-side
- [frontend/src/services/classificationService.js](frontend/src/services/classificationService.js) — frontend client; converts an uploaded photo to base64 or passes a preset's URL, and sends it alongside the description
- [frontend/src/pages/ReportIssue.jsx](frontend/src/pages/ReportIssue.jsx) — tracks the raw uploaded file/preset URL and calls the classifier on submit when "AI Suggestion" is selected
- [frontend/vite.config.js](frontend/vite.config.js) — dev proxy from `/api` to the backend

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env and set:
#   GROQ_API_KEY   (free key from https://console.groq.com)   - used for text-only classification
#   GEMINI_API_KEY (free key from https://aistudio.google.com) - used for image classification
npm start
```

The backend runs on `http://localhost:5000` by default. With the frontend dev server running separately (`npm run dev` in `frontend/`), Vite proxies `/api` requests to the backend automatically — no extra config needed in dev.

For production, set `VITE_API_BASE_URL` in the frontend's environment to point at your deployed backend's URL.