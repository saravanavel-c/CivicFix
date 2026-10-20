import { createClient } from '@supabase/supabase-js';

const supabaseUrl        = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Placeholders are used so the process can still boot for AI-only routes.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder-service-key';

function looksLikeTemplate(value) {
  if (!value) return true;
  const v = value.toLowerCase();
  return v.includes('your-project-id')
      || v.includes('your-supabase-service-role-key')
      || v.includes('your-') && v.includes('-key');
}

/**
 * True only when both credentials are present AND were not left as the
 * template values from .env.example. Routes that need the database check
 * this and answer 503 instead of failing with an opaque network error.
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl
  && supabaseServiceKey
  && !looksLikeTemplate(supabaseUrl)
  && !looksLikeTemplate(supabaseServiceKey)
);

// Startup validation — log missing variable NAMES only, never values
const missing = [];
if (!supabaseUrl)        missing.push('SUPABASE_URL');
if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

if (missing.length > 0) {
  console.warn(
    `[CivicFix backend] Missing environment variable(s): ${missing.join(', ')}\n` +
    'Copy backend/.env.example → backend/.env and fill in your Supabase credentials.\n' +
    'Database-dependent routes will answer 503 until these are set.'
  );
} else if (!isSupabaseConfigured) {
  console.warn(
    '[CivicFix backend] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY still hold the\n' +
    '.env.example template values. Replace them with your real project credentials.\n' +
    'Database-dependent routes will answer 503 until then.'
  );
}

/**
 * Server-side Supabase admin client.
 *
 * Uses the service_role key which BYPASSES Row Level Security.
 * This client must NEVER be sent to the browser or exposed in API responses.
 * Authorization checks are enforced explicitly in every route that uses it.
 */
export const supabaseAdmin = createClient(
  isSupabaseConfigured ? supabaseUrl        : PLACEHOLDER_URL,
  isSupabaseConfigured ? supabaseServiceKey : PLACEHOLDER_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
);

/**
 * Express middleware — rejects database-backed routes with an actionable
 * message when credentials are missing, instead of letting the call fail
 * against the placeholder host.
 */
export function requireDatabase(_req, res, next) {
  if (!isSupabaseConfigured) {
    return res.status(503).json({
      code: 'DB_NOT_CONFIGURED',
      error:
        'Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY ' +
        'in backend/.env, then restart the server.',
    });
  }
  return next();
}

/**
 * Single round-trip connectivity probe used by /health and the startup log.
 * @returns {Promise<{state: 'connected'|'not_configured'|'unreachable', message?: string}>}
 */
export async function checkDatabase() {
  if (!isSupabaseConfigured) return { state: 'not_configured' };

  const { error } = await supabaseAdmin
    .from('profiles')
    .select('id', { count: 'exact', head: true });

  if (error) return { state: 'unreachable', message: error.message };
  return { state: 'connected' };
}
