import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { classifyComplaint }          from './classifier.js';
import { validateComplaint }          from './validation.js';
import { findDuplicates }             from './duplicateDetection.js';
import { computePriority }            from './prioritization.js';
import { classifyComplaintWithImage, fetchImageAsBase64 } from './imageClassifier.js';
import {
  supabaseAdmin,
  isSupabaseConfigured,
  requireDatabase,
  checkDatabase,
} from './config/supabase.js';

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
    const corsError = new Error(`CORS: origin ${origin} not allowed`);
    corsError.status = 403;
    callback(corsError);
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

  // A token cannot be verified without credentials — answer with an
  // actionable error instead of failing against a placeholder host.
  if (!isSupabaseConfigured) {
    return res.status(503).json({
      code: 'DB_NOT_CONFIGURED',
      error: 'Authentication is unavailable: the backend has no Supabase credentials configured.',
    });
  }

  try {
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
    return next();
  } catch (err) {
    console.error('[CivicFix] Token verification failed:', err.message);
    return res.status(401).json({
      error: 'Could not verify the session token. Please sign in again.',
    });
  }
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

const UNIQUE_VIOLATION = '23505';

/**
 * Inserts a report, retrying when the randomly generated tracking_id
 * collides with an existing row (unique violation on that column).
 */
async function insertReport(insertData, maxAttempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('reports')
      .insert(insertData)
      .select()
      .single();

    if (!error) return { data, error: null };

    lastError = error;
    if (error.code !== UNIQUE_VIOLATION) break;
    console.warn(`[CivicFix] tracking_id collision (attempt ${attempt}/${maxAttempts}), retrying.`);
  }

  return { data: null, error: lastError };
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
 * Text classification: Groq LLM first, offline keyword classifier as fallback.
 * Returns { category, source } where source is 'groq' or 'keyword'.
 */
app.post('/api/classify', async (req, res) => {
  const { description } = req.body;
  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: 'A non-empty "description" string is required.' });
  }
  try {
    const { category, source } = await classifyComplaint(description);
    return res.json({ category, source });
  } catch (err) {
    console.error('Classification failed:', err.message);
    return res.status(500).json({ error: 'Classification failed.' });
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
    if (isSupabaseConfigured && latitude && longitude) {
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
app.post('/api/reports', requireAuth, requireDatabase, async (req, res) => {
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

  const { data, error } = await insertReport(insertData);

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
app.get('/api/reports', requireDatabase, async (req, res) => {
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
app.get('/api/reports/mine', requireAuth, requireDatabase, async (req, res) => {
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
app.get('/api/reports/track/:trackingId', requireDatabase, async (req, res) => {
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
app.get('/api/reports/:id', requireDatabase, async (req, res) => {
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
app.get('/api/reports/:id/history', requireDatabase, async (req, res) => {
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
app.patch('/api/reports/:id/status', requireOfficer, requireDatabase, async (req, res) => {
  const { id }              = req.params;
  const { status, comment } = req.body;

  if (!status || !VALID_STATUSES.includes(String(status).toLowerCase())) {
    return res.status(400).json({
      error: `status must be one of: ${VALID_STATUSES.join(', ')}.`,
    });
  }

  // Single atomic call: the RPC updates the row and the
  // on_report_status_change trigger writes the audit entry
  // (old/new status, actor, comment) — no duplicate rows.
  const { data: updated, error } = await supabaseAdmin.rpc('transition_report_status', {
    p_report_id:  id,
    p_new_status: String(status).toLowerCase(),
    p_comment:    comment?.trim() || null,
    p_changed_by: req.user.id,
  });

  if (error) {
    if (error.code === 'P0002') {
      return res.status(404).json({ error: 'Report not found.' });
    }
    console.error('Status update failed:', error.message);
    return res.status(500).json({ error: 'Failed to update report status.' });
  }

  return res.json({ report: updated });
});

/**
 * PATCH /api/reports/:id/assign
 * Assign a report to an officer or admin. Officers and admins only.
 * Body: { officer_id, comment? }
 */
app.patch('/api/reports/:id/assign', requireOfficer, requireDatabase, async (req, res) => {
  const { id }         = req.params;
  const { officer_id } = req.body;

  if (!officer_id) {
    return res.status(400).json({ error: 'officer_id is required.' });
  }

  // The RPC validates the target role, moves the report to under_review and
  // writes the audit entry in one transaction.
  const { data: updated, error } = await supabaseAdmin.rpc('assign_report', {
    p_report_id:  id,
    p_officer_id: officer_id,
    p_changed_by: req.user.id,
    p_comment:    req.body.comment?.trim() || null,
  });

  if (error) {
    if (error.code === 'P0002') {
      return res.status(404).json({ error: 'Report not found.' });
    }
    if (error.code === '22023') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Assignment failed:', error.message);
    return res.status(500).json({ error: 'Failed to assign report.' });
  }

  return res.json({ report: updated });
});

// ---------------------------------------------------------------
// Health check
// ---------------------------------------------------------------
app.get('/health', async (_req, res) => {
  const db = await checkDatabase();

  return res.json({
    status:    db.state === 'unreachable' ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    database:  db.state,
    ...(db.message ? { databaseError: db.message } : {}),
  });
});

// ---------------------------------------------------------------
// Unknown API route
// ---------------------------------------------------------------
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

// ---------------------------------------------------------------
// Global error handler
// ---------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('[CivicFix] Unhandled error:', err.message);
  if (res.headersSent) return;
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'An unexpected error occurred.' : err.message,
  });
});

app.listen(PORT, async () => {
  console.log(`CivicFix backend listening on http://localhost:${PORT}`);

  const db = await checkDatabase();
  if (db.state === 'connected') {
    console.log('[CivicFix] Supabase connection OK.');
  } else if (db.state === 'not_configured') {
    console.warn('[CivicFix] Supabase is NOT configured — database routes will answer 503.');
  } else {
    console.error(`[CivicFix] Supabase is unreachable: ${db.message}`);
  }
});
