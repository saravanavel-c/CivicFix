import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { classifyComplaint }          from './classifier.js';
import { validateComplaint }          from './validation.js';
import { findDuplicates }             from './duplicateDetection.js';
import { computePriority }            from './prioritization.js';
import { classifyComplaintWithImage, fetchImageAsBase64 } from './imageClassifier.js';
import { supabaseAdmin }              from './config/supabase.js';

const app  = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------
// CORS — restrict to known frontend origin(s)
// ---------------------------------------------------------------
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile, same-origin)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

// ---------------------------------------------------------------
// Auth middleware
// Validates the Supabase JWT from the Authorization header and
// attaches req.user (the auth.users row) + req.profile (profiles row).
// Sets req.user = null when no token is provided (unauthenticated OK
// for public GET routes).
// ---------------------------------------------------------------
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    req.user    = null;
    req.profile = null;
    return next();
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  // Fetch the profile to get the role
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  req.user    = user;
  req.profile = profile || { id: user.id, role: 'citizen' };
  next();
}

// Require a valid authenticated session
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  next();
}

// Require officer or admin role
function requireOfficer(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (!['officer', 'admin'].includes(req.profile?.role)) {
    return res.status(403).json({ error: 'Officer or admin access required.' });
  }
  next();
}

// Apply auth middleware globally (non-blocking — sets req.user = null if no token)
app.use(authenticate);

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function paginate(query, page = 1, pageSize = 20) {
  const p    = Math.max(1, parseInt(page, 10)  || 1);
  const size = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 20));
  const from = (p - 1) * size;
  const to   = from + size - 1;
  return query.range(from, to);
}

const VALID_STATUSES   = ['submitted','under_review','in_progress','resolved','rejected'];
const VALID_CATEGORIES = ['road','sanitation','drainage','water','electricity','other',
                          'pothole','garbage','streetlight'];
const VALID_PRIORITIES = ['low','medium','high','urgent'];

// ---------------------------------------------------------------
// EXISTING AI ROUTES (preserved)
// ---------------------------------------------------------------

/**
 * POST /api/classify
 * Keyword-based text classification. Returns { category }.
 */
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
    return res.status(502).json({ error: 'Classification service unavailable.' });
  }
});

/**
 * POST /api/analyze-complaint
 * Runs validation + duplicate detection + priority scoring.
 * Body: { description, category, latitude?, longitude?, existingComplaints? }
 */
app.post('/api/analyze-complaint', async (req, res) => {
  const { description, category, latitude, longitude, existingComplaints } = req.body;
  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'A non-empty "description" string is required.' });
  }
  try {
    const validation = await validateComplaint(description);
    if (!validation.isValid) {
      return res.json({ validation, duplicates: [], priority: null });
    }

    // Prefer DB-sourced existing complaints; fall back to caller-supplied list
    let complaintsForDupCheck = Array.isArray(existingComplaints) ? existingComplaints : [];

    // If connected to Supabase, fetch nearby reports from DB for more accurate dedup
    if (supabaseAdmin && latitude && longitude) {
      try {
        const lat  = parseFloat(latitude);
        const lng  = parseFloat(longitude);
        const DELTA = 0.02; // ~2 km bounding box
        const { data: nearby } = await supabaseAdmin
          .from('reports')
          .select('id, category, description, latitude, longitude')
          .gte('latitude',  lat - DELTA)
          .lte('latitude',  lat + DELTA)
          .gte('longitude', lng - DELTA)
          .lte('longitude', lng + DELTA)
          .eq('category', category || 'other')
          .limit(50);
        if (nearby && nearby.length > 0) complaintsForDupCheck = nearby;
      } catch (_err) { /* non-critical — fall through to caller-supplied list */ }
    }

    const duplicates = findDuplicates(
      { category, description, latitude, longitude },
      complaintsForDupCheck
    );
    const priority = computePriority({
      description,
      category,
      duplicateCount: duplicates.length,
    });
    return res.json({ validation, duplicates, priority });
  } catch (err) {
    console.error('Complaint analysis failed:', err.message);
    return res.status(502).json({ error: 'Analysis service unavailable.' });
  }
});

/**
 * POST /api/classify-image
 * AI image classification via Gemini Vision.
 * Body: { imageBase64, mimeType?, description?, imageUrl? }
 * Returns { category }.
 */
app.post('/api/classify-image', async (req, res) => {
  const { imageBase64, mimeType, description, imageUrl } = req.body;

  if (!imageBase64 && !imageUrl) {
    return res.status(400).json({
      error: 'Provide either "imageBase64" (raw base64 string) or "imageUrl" to classify.',
    });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'Image classification is unavailable: GEMINI_API_KEY is not configured.',
      fallbackCategory: 'other',
    });
  }

  try {
    let b64   = imageBase64;
    let mime  = mimeType || 'image/jpeg';

    if (!b64 && imageUrl) {
      const fetched = await fetchImageAsBase64(imageUrl);
      b64  = fetched.base64;
      mime = fetched.mimeType;
    }

    const category = await classifyComplaintWithImage(description || '', b64, mime);
    return res.json({ category });
  } catch (err) {
    console.error('Image classification failed:', err.message);
    return res.status(502).json({
      error: 'Image classification service unavailable.',
      fallbackCategory: 'other',
    });
  }
});

// ---------------------------------------------------------------
// REPORT CRUD ROUTES
// ---------------------------------------------------------------

/**
 * POST /api/reports
 * Create a new civic report. Requires authentication.
 * Body: { title, description, category, latitude, longitude, address?,
 *         image_path?, ai_category?, ai_confidence?, priority? }
 */
app.post('/api/reports', requireAuth, async (req, res) => {
  const {
    title, description, category, latitude, longitude,
    address, image_path, ai_category, ai_confidence, priority,
  } = req.body;

  // Input validation
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ error: 'title must be at least 3 characters.' });
  }
  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    return res.status(400).json({ error: 'description must be at least 10 characters.' });
  }
  if (latitude  == null || isNaN(parseFloat(latitude))) {
    return res.status(400).json({ error: 'latitude is required and must be a number.' });
  }
  if (longitude == null || isNaN(parseFloat(longitude))) {
    return res.status(400).json({ error: 'longitude is required and must be a number.' });
  }
  if (category && !VALID_CATEGORIES.includes(category.toLowerCase())) {
    return res.status(400).json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}.` });
  }
  if (priority && !VALID_PRIORITIES.includes(priority.toLowerCase())) {
    return res.status(400).json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}.` });
  }
  // Prevent image data URLs from being stored in the database
  if (image_path && image_path.startsWith('data:')) {
    return res.status(400).json({
      error: 'image_path must be a Supabase Storage path, not a data URL. Upload the image first.',
    });
  }

  const insertData = {
    user_id:       req.user.id,
    title:         title.trim(),
    description:   description.trim(),
    category:      (category || 'other').toLowerCase(),
    latitude:      parseFloat(latitude),
    longitude:     parseFloat(longitude),
    address:       address  || null,
    image_path:    image_path || null,
    ai_category:   ai_category   || null,
    ai_confidence: ai_confidence != null ? parseFloat(ai_confidence) : null,
    priority:      (priority || 'medium').toLowerCase(),
    status:        'submitted',
  };

  const { data, error } = await supabaseAdmin
    .from('reports')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Report insert failed:', error.message);
    return res.status(500).json({ error: 'Failed to save report. Please try again.' });
  }

  return res.status(201).json({ report: data });
});

/**
 * GET /api/reports
 * List reports with optional filters. Public.
 * Query params: category, status, priority, page, pageSize
 */
app.get('/api/reports', async (req, res) => {
  const { category, status, priority, page, pageSize } = req.query;

  let query = supabaseAdmin
    .from('reports')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (category && VALID_CATEGORIES.includes(category.toLowerCase())) {
    query = query.eq('category', category.toLowerCase());
  }
  if (status && VALID_STATUSES.includes(status.toLowerCase())) {
    query = query.eq('status', status.toLowerCase());
  }
  if (priority && VALID_PRIORITIES.includes(priority.toLowerCase())) {
    query = query.eq('priority', priority.toLowerCase());
  }

  query = paginate(query, page, pageSize);

  const { data, error, count } = await query;
  if (error) {
    console.error('Reports fetch failed:', error.message);
    return res.status(500).json({ error: 'Failed to fetch reports.' });
  }

  return res.json({ reports: data, total: count });
});

/**
 * GET /api/reports/mine
 * Returns all reports belonging to the authenticated user.
 */
app.get('/api/reports/mine', requireAuth, async (req, res) => {
  const { page, pageSize } = req.query;

  let query = supabaseAdmin
    .from('reports')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });

  query = paginate(query, page, pageSize);

  const { data, error, count } = await query;
  if (error) {
    console.error('Mine fetch failed:', error.message);
    return res.status(500).json({ error: 'Failed to fetch your reports.' });
  }

  return res.json({ reports: data, total: count });
});

/**
 * GET /api/reports/track/:trackingId
 * Public tracking endpoint. Returns limited public fields only —
 * no private user data.
 */
app.get('/api/reports/track/:trackingId', async (req, res) => {
  const { trackingId } = req.params;

  if (!trackingId || !/^CIV-[A-Z0-9]{8}$/i.test(trackingId)) {
    return res.status(400).json({ error: 'Invalid tracking ID format. Expected CIV-XXXXXXXX.' });
  }

  const { data, error } = await supabaseAdmin
    .from('reports')
    .select(`
      id, tracking_id, title, description, category, status,
      priority, address, latitude, longitude, image_path,
      ai_category, created_at, updated_at, resolved_at
    `)
    .eq('tracking_id', trackingId.toUpperCase())
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'No report found with that tracking ID.' });
  }

  // Fetch status history (public — no private fields)
  const { data: history } = await supabaseAdmin
    .from('report_status_history')
    .select('old_status, new_status, comment, created_at')
    .eq('report_id', data.id)
    .order('created_at', { ascending: true });

  return res.json({ report: data, history: history || [] });
});

/**
 * GET /api/reports/:id
 * Single report with full details. Public for basic fields;
 * assigned_to only exposed to officers/admins.
 */
app.get('/api/reports/:id', async (req, res) => {
  const { id } = req.params;

  const isOfficer = req.profile && ['officer','admin'].includes(req.profile.role);
  const selectFields = isOfficer
    ? '*'
    : 'id, tracking_id, title, description, category, status, priority, address, latitude, longitude, image_path, ai_category, created_at, updated_at, resolved_at';

  const { data, error } = await supabaseAdmin
    .from('reports')
    .select(selectFields)
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const { data: history } = await supabaseAdmin
    .from('report_status_history')
    .select('old_status, new_status, comment, created_at')
    .eq('report_id', id)
    .order('created_at', { ascending: true });

  return res.json({ report: data, history: history || [] });
});

/**
 * GET /api/reports/:id/history
 * Status history for a report. Public.
 */
app.get('/api/reports/:id/history', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('report_status_history')
    .select('old_status, new_status, comment, created_at, changed_by')
    .eq('report_id', id)
    .order('created_at', { ascending: true });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch status history.' });
  }

  return res.json({ history: data || [] });
});

/**
 * PATCH /api/reports/:id/status
 * Change report status. Officers and admins only.
 * Body: { status, comment? }
 */
app.patch('/api/reports/:id/status', requireOfficer, async (req, res) => {
  const { id }               = req.params;
  const { status, comment }  = req.body;

  if (!status || !VALID_STATUSES.includes(status.toLowerCase())) {
    return res.status(400).json({
      error: `status must be one of: ${VALID_STATUSES.join(', ')}.`,
    });
  }

  // Fetch current status to record old value in history
  const { data: current, error: fetchErr } = await supabaseAdmin
    .from('reports')
    .select('id, status')
    .eq('id', id)
    .single();

  if (fetchErr || !current) {
    return res.status(404).json({ error: 'Report not found.' });
  }

  const newStatus = status.toLowerCase();

  // Update report status
  const updatePayload = { status: newStatus };
  if (newStatus === 'resolved') updatePayload.resolved_at = new Date().toISOString();

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from('reports')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    console.error('Status update failed:', updateErr.message);
    return res.status(500).json({ error: 'Failed to update report status.' });
  }

  // Record in status history (trigger also does this, but explicit insert
  // lets us attach the comment and changed_by correctly)
  await supabaseAdmin.from('report_status_history').insert({
    report_id:  id,
    old_status: current.status,
    new_status: newStatus,
    changed_by: req.user.id,
    comment:    comment?.trim() || null,
  });

  return res.json({ report: updated });
});

/**
 * PATCH /api/reports/:id/assign
 * Assign a report to an officer. Admins only.
 * Body: { officer_id }
 */
app.patch('/api/reports/:id/assign', requireOfficer, async (req, res) => {
  const { id }          = req.params;
  const { officer_id }  = req.body;

  if (!officer_id) {
    return res.status(400).json({ error: 'officer_id is required.' });
  }

  // Verify the target profile exists and is an officer/admin
  const { data: target } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', officer_id)
    .single();

  if (!target || !['officer','admin'].includes(target.role)) {
    return res.status(400).json({ error: 'Target user is not a valid officer or admin.' });
  }

  const { data: updated, error } = await supabaseAdmin
    .from('reports')
    .update({ assigned_to: officer_id, status: 'under_review' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to assign report.' });
  }

  // Log the assignment in history
  await supabaseAdmin.from('report_status_history').insert({
    report_id:  id,
    old_status: 'submitted',
    new_status: 'under_review',
    changed_by: req.user.id,
    comment:    `Assigned to officer ${officer_id}`,
  });

  return res.json({ report: updated });
});

// ---------------------------------------------------------------
// Health check
// ---------------------------------------------------------------
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ---------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('[CivicFix] Unhandled error:', err.message);
  res.status(500).json({ error: 'An unexpected error occurred.' });
});

app.listen(PORT, () => {
  console.log(`CivicFix backend listening on http://localhost:${PORT}`);
});
