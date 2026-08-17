import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { classifyComplaint } from './classifier.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`CivicFix backend listening on http://localhost:${PORT}`);
});