const EARTH_RADIUS_METERS = 6371000;
const DEFAULT_MAX_DISTANCE_METERS = 150;
const DEFAULT_MIN_SIMILARITY = 0.3;
const MAX_RESULTS = 3;

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'and', 'or', 'but', 'in', 'on', 'at',
  'to', 'of', 'for', 'with', 'this', 'that', 'it', 'near', 'my', 'our', 'has', 'have',
  'been', 'there', 'here', 'we', 'i', 'please',
]);

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance between two lat/lng points, in meters.
 */
export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

function tokenize(text) {
  return new Set(
    (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word))
  );
}

/**
 * Jaccard similarity between two pieces of text, based on their word sets.
 * Returns a value between 0 (no overlap) and 1 (identical word sets).
 */
export function textSimilarity(textA, textB) {
  const setA = tokenize(textA);
  const setB = tokenize(textB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const word of setA) {
    if (setB.has(word)) intersectionSize++;
  }
  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/**
 * Finds likely duplicate complaints among a list of existing complaints, based on
 * same category + nearby location + similar description wording. Returns the
 * top matches sorted by similarity, each with its distance and similarity score.
 *
 * existingComplaints: array of { id, category, description, latitude, longitude }
 */
export function findDuplicates(
  newComplaint,
  existingComplaints,
  { maxDistanceMeters = DEFAULT_MAX_DISTANCE_METERS, minSimilarity = DEFAULT_MIN_SIMILARITY } = {}
) {
  const { category, description, latitude, longitude } = newComplaint;
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  if (!Array.isArray(existingComplaints) || existingComplaints.length === 0) {
    return [];
  }

  const candidates = [];

  for (const existing of existingComplaints) {
    if (!existing || existing.category !== category) continue;

    const existingLat = parseFloat(existing.latitude);
    const existingLng = parseFloat(existing.longitude);
    const existingHasCoords = Number.isFinite(existingLat) && Number.isFinite(existingLng);

    let distanceMeters = null;
    if (hasCoords && existingHasCoords) {
      distanceMeters = haversineDistanceMeters(lat, lng, existingLat, existingLng);
      if (distanceMeters > maxDistanceMeters) continue; // too far away, not a duplicate
    }

    const similarity = textSimilarity(description, existing.description);
    if (similarity < minSimilarity) continue;

    candidates.push({
      id: existing.id,
      similarity: Math.round(similarity * 100) / 100,
      distanceMeters: distanceMeters === null ? null : Math.round(distanceMeters),
    });
  }

  candidates.sort((a, b) => b.similarity - a.similarity);
  return candidates.slice(0, MAX_RESULTS);
}