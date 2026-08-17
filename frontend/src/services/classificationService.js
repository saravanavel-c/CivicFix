// In dev, Vite proxies "/api" to the backend (see vite.config.js), so no base URL is needed.
// In production, set VITE_API_BASE_URL to your deployed backend's origin.
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const classificationService = {
  /**
   * Classifies a complaint description into one of the app's known categories
   * (Road, Sanitation, Drainage, Water, Electricity, Other) using the backend's
   * Groq-powered classifier. Falls back to 'Other' if the service is unreachable
   * or errors out, so a report can never be blocked by AI downtime.
   */
  async classifyCategory(description) {
    try {
      const response = await fetch(`${API_BASE}/api/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error(`Classification request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.category || 'Other';
    } catch (err) {
      console.error('AI category classification failed, defaulting to Other:', err);
      return 'Other';
    }
  },
};