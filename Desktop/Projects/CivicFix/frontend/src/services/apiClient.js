/**
 * apiClient.js
 * Thin wrapper around fetch() that:
 *  - Prefixes all requests with the backend base URL
 *  - Attaches the Supabase session JWT automatically
 *  - Provides consistent error handling
 *  - Returns parsed JSON or throws a structured error
 */
import { supabase } from '../lib/supabaseClient';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Returns the current session's access token, or null if not logged in.
 */
async function getAccessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Core fetch wrapper.
 * @param {string} path   - e.g. '/api/reports'
 * @param {object} options - fetch options (method, body, headers, …)
 * @returns {Promise<any>} parsed JSON body
 * @throws  {Error}        with a human-readable .message from the server
 */
export async function apiFetch(path, options = {}) {
  const token = await getAccessToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  let body;
  try {
    body = await response.json();
  } catch {
    body = { error: `Server returned ${response.status} with no JSON body.` };
  }

  if (!response.ok) {
    const msg = body?.error || `Request failed with status ${response.status}`;
    const err = new Error(msg);
    err.status = response.status;
    err.body   = body;
    throw err;
  }

  return body;
}
