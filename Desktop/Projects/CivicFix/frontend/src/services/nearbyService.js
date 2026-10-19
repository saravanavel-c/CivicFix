/**
 * nearbyService.js
 *
 * Fetches civic reports near the user's location.
 * Queries Supabase directly via the anon client using a lat/lng bounding box.
 * Falls back to localStorage mock data when Supabase is unreachable.
 */
import { supabase }                        from '../lib/supabaseClient';
import { getFromStorage, saveToStorage }   from './storage';

const DELTA = 0.05; // ~5 km bounding box

function normalizeNearby(r) {
  return {
    id:               r.tracking_id || r.id,
    dbId:             r.id,
    category:         r.category,
    title:            r.title,
    description:      r.description,
    location:         r.address || `${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)}`,
    latitude:         r.latitude,
    longitude:        r.longitude,
    citizensAffected: 1,
    upvotes:          0,
    userUpvoted:      false,
    coordinates:      { x: 50, y: 50 },  // map pin fallback
    status:           r.status ? r.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Submitted',
    image:            r.image_path,
  };
}

export const nearbyService = {

  /**
   * Returns reports within ~5 km of the given coordinates.
   * Falls back to full list if no coordinates provided.
   */
  async getNearbyIssues(lat = null, lng = null) {
    try {
      let query = supabase
        .from('reports')
        .select('id, tracking_id, title, description, category, status, latitude, longitude, address, image_path, created_at')
        .order('created_at', { ascending: false })
        .limit(50);

      if (lat != null && lng != null) {
        const lat_ = parseFloat(lat);
        const lng_ = parseFloat(lng);
        if (Number.isFinite(lat_) && Number.isFinite(lng_)) {
          query = query
            .gte('latitude',  lat_ - DELTA)
            .lte('latitude',  lat_ + DELTA)
            .gte('longitude', lng_ - DELTA)
            .lte('longitude', lng_ + DELTA);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(normalizeNearby);
    } catch (err) {
      console.warn('[nearbyService] Supabase query failed, using localStorage:', err.message);
      return getFromStorage('NEARBY') || [];
    }
  },

  /**
   * Toggle an upvote for a nearby issue.
   * Stored in localStorage only (vote persistence is out of scope for now).
   */
  async upvoteIssue(id) {
    const nearby = getFromStorage('NEARBY') || [];
    const idx    = nearby.findIndex(item => item.id === id);
    if (idx !== -1) {
      const issue = nearby[idx];
      issue.userUpvoted = !issue.userUpvoted;
      issue.upvotes    += issue.userUpvoted ? 1 : -1;
      saveToStorage('NEARBY', nearby);
      return issue;
    }
    // Issue from Supabase — just return a synthetic toggle (no DB write)
    return { id, userUpvoted: true, upvotes: 1 };
  },
};
