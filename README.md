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
- **Automatic Location Fetching:** The app automatically requests the user's location as soon as they enter Step 2 (Set Location) of the report flow.
- **Robust Fallback Mechanism:** If high-accuracy GPS fails or times out (common on desktop browsers/devices without GPS hardware), the app automatically falls back to low-accuracy (Wi-Fi/IP-based) location.
- **Toast Notifications:** Displays clear error messages to the user if geolocation is blocked or fails entirely.
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

