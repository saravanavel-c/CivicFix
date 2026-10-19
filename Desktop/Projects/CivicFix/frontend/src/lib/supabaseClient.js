import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Startup validation — log missing variable NAMES only, never values
if (!supabaseUrl) {
  console.error(
    '[CivicFix] Missing environment variable: VITE_SUPABASE_URL\n' +
    'Copy frontend/.env.example → frontend/.env and fill in your Supabase project URL.'
  );
}
if (!supabaseAnonKey) {
  console.error(
    '[CivicFix] Missing environment variable: VITE_SUPABASE_PUBLISHABLE_KEY\n' +
    'Copy frontend/.env.example → frontend/.env and fill in your Supabase anon key.'
  );
}

/**
 * Supabase browser client.
 * Uses the anon/publishable key — authorization is enforced by RLS policies.
 * Never use the service_role key in this file.
 */
export const supabase = createClient(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,          // store session in localStorage
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Returns the currently authenticated user, or null if not logged in.
 * Prefer this over supabase.auth.getUser() directly so components
 * have a single, consistent call site.
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Returns the profile row for the given user ID, including their role.
 * Falls back gracefully if the profiles table query fails.
 */
export async function getUserProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.warn('[CivicFix] Could not fetch user profile:', error.message);
    return null;
  }
  return data;
}
