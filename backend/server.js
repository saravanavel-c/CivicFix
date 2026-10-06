import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { classifyComplaint } from './classifier.js';
import { validateComplaint } from './validation.js';
import { findDuplicates } from './duplicateDetection.js';
import { computePriority } from './prioritization.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/api/classify', async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'A non-empty "description" string is required.' });
  }

  try {
    const category = await classifyComplaint(description);
    return res.json({ category });
  } catch (err) {
    console.error('Classification failed:', err.message);
    // Fail soft: the frontend can fall back to "Other" rather than blocking submission
    return res.status(502).json({ error: 'Classification service unavailable.' });
  }
});

/**
 * Runs validation, duplicate detection, and priority scoring for a complaint
 * before it's submitted. Expects the category to already be decided (i.e. call
 * /api/classify first if the citizen chose AI auto-detect).
 *
 * body: {
 *   description: string,
 *   category: string,
 *   latitude?: number|string,
 *   longitude?: number|string,
 *   existingComplaints?: [{ id, category, description, latitude, longitude }]
 * }
 */
app.post('/api/analyze-complaint', async (req, res) => {
  const { description, category, latitude, longitude, existingComplaints } = req.body;

  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'A non-empty "description" string is required.' });
  }

  try {
    const validation = await validateComplaint(description);

    // If the description is junk, don't bother computing duplicates/priority for it
    if (!validation.isValid) {
      return res.json({ validation, duplicates: [], priority: null });
    }

    const duplicates = findDuplicates(
      { category, description, latitude, longitude },
      existingComplaints || []
    );

    const priority = computePriority({ description, category, duplicateCount: duplicates.length });

    return res.json({ validation, duplicates, priority });
  } catch (err) {
    console.error('Complaint analysis failed:', err.message);
    return res.status(502).json({ error: 'Analysis service unavailable.' });
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`CivicFix backend listening on http://localhost:${PORT}`);
});