/**
 * analysisService.js
 *
 * Calls the backend's /api/analyze-complaint endpoint to run:
 *  - Complaint validation (rule-based + optional Groq LLM)
 *  - Duplicate detection (Haversine + Jaccard, using DB-sourced nearby reports)
 *  - Priority scoring (keyword + category + duplicate boost)
 *
 * Always resolves to a usable fallback result — backend unavailability
 * must never block a citizen from filing a genuine report.
 */
import { apiFetch } from './apiClient';

const FALLBACK = {
  validation: { isValid: true,   reason: null },
  duplicates: [],
  priority:   { priority: 'Medium', score: 0, reasons: ['AI analysis unavailable — defaulting to Medium'] },
};

export const analysisService = {
  async analyzeComplaint({ description, category, latitude, longitude, existingComplaints }) {
    try {
      const data = await apiFetch('/api/analyze-complaint', {
        method: 'POST',
        body: JSON.stringify({ description, category, latitude, longitude, existingComplaints }),
      });
      return {
        validation: data.validation || FALLBACK.validation,
        duplicates: data.duplicates || [],
        priority:   data.priority   || FALLBACK.priority,
      };
    } catch (err) {
      console.error('[analysisService] analyzeComplaint failed, using defaults:', err.message);
      return FALLBACK;
    }
  },
};
