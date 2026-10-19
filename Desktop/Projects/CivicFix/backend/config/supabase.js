import { createClient } from '@supabase/supabase-js';

const supabaseUrl         = process.env.SUPABASE_URL;
const supabaseServiceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Startup validation — log missing variable NAMES only, never values
const missing = [];
if (!supabaseUrl)        missing.push('SUPABASE_URL');
if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

if (missing.length > 0) {
  console.warn(
    `[CivicFix backend] Missing environment variable(s): ${missing.join(', ')}\n` +
    'Copy backend/.env.example → backend/.env and fill in your Supabase credentials.\n' +
    'Database-dependent routes will fail until these are set.'
  );
}

/**
 * Server-side Supabase admin client.
 *
 * Uses the service_role key which BYPASSES Row Level Security.
 * This client must NEVER be sent to the browser or exposed in API responses.
 * Explicitly enforce authorization checks in every route that uses this client.
 */
export const supabaseAdmin = createClient(
  supabaseUrl        || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession:   false,
    },
  }
);
