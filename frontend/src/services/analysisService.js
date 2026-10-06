const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const analysisService = {
  /**
   * Runs validation, duplicate detection, and priority scoring for a complaint
   * before submission. Always resolves to a usable result, even on failure —
   * fails open (treats the complaint as valid, no duplicates, Medium priority)
   * so a backend hiccup never blocks a citizen from filing a real report.
   */
  async analyzeComplaint({ description, category, latitude, longitude, existingComplaints }) {
    const fallback = {
      validation: { isValid: true, reason: null },
      duplicates: [],
      priority: { priority: 'Medium', score: 0, reasons: [] },
    };

    try {
      const response = await fetch(`${API_BASE}/api/analyze-complaint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, category, latitude, longitude, existingComplaints }),
      });

      if (!response.ok) {
        throw new Error(`Analysis request failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        validation: data.validation || fallback.validation,
        duplicates: data.duplicates || [],
        priority: data.priority || fallback.priority,
      };
    } catch (err) {
      console.error('Complaint analysis failed, proceeding with defaults:', err);
      return fallback;
    }
  },
};