/**
 * classificationService.js
 *
 * Classifies a complaint description into one of the app's categories
 * using the backend's keyword-based (+ optional Groq) classifier.
 * Falls back to 'Other' if the backend is unreachable.
 */
import { apiFetch } from './apiClient';

export const classificationService = {
  async classifyCategory(description) {
    try {
      const data = await apiFetch('/api/classify', {
        method: 'POST',
        body: JSON.stringify({ description }),
      });
      return data.category || 'Other';
    } catch (err) {
      console.error('[classificationService] classifyCategory failed, defaulting to Other:', err.message);
      return 'Other';
    }
  },

  /**
   * Classifies an image via Gemini Vision.
   * imageBase64 should be raw base64 without the data: prefix.
   */
  async classifyImage(imageBase64, mimeType = 'image/jpeg', description = '') {
    try {
      const data = await apiFetch('/api/classify-image', {
        method: 'POST',
        body: JSON.stringify({ imageBase64, mimeType, description }),
      });
      return data.category || 'Other';
    } catch (err) {
      console.error('[classificationService] classifyImage failed, defaulting to Other:', err.message);
      return 'Other';
    }
  },
};
