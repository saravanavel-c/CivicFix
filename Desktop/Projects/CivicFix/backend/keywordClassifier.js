// Offline keyword classifier. Used as a fallback whenever the Groq LLM is
// unavailable (missing key, network error, rate limit, unusable response).
// Categories must match the frontend (ReportIssue.jsx, mockData.js).

export const VALID_CATEGORIES = ['Road', 'Sanitation', 'Drainage', 'Water', 'Electricity', 'Other'];

// Multi-word phrases are worth more than single words because they are less ambiguous
// (e.g. "water leak" is Water, while a lone "water" could also be Drainage).
const KEYWORDS = {
  Road: {
    phrases: ['road damage', 'broken road', 'damaged road', 'road crack', 'speed breaker', 'speed bump', 'traffic signal', 'zebra crossing', 'broken footpath', 'broken pavement'],
    words: ['pothole', 'potholes', 'road', 'roads', 'asphalt', 'tar', 'pavement', 'footpath', 'sidewalk', 'crater', 'highway', 'signboard', 'signage', 'divider', 'bridge', 'flyover', 'traffic', 'speedbreaker'],
  },
  Sanitation: {
    phrases: ['garbage dump', 'waste collection', 'dead animal', 'dead dog', 'dead cat', 'public toilet', 'open dumping', 'trash can', 'dustbin overflow'],
    words: ['garbage', 'trash', 'waste', 'litter', 'littering', 'dustbin', 'rubbish', 'dump', 'dumping', 'stink', 'stench', 'smell', 'odor', 'odour', 'sweeping', 'toilet', 'sanitation', 'hygiene', 'mosquito', 'mosquitoes'],
  },
  Drainage: {
    phrases: ['blocked drain', 'drain blockage', 'sewage overflow', 'overflowing drain', 'storm drain', 'water logging', 'water logged', 'open drain', 'open manhole'],
    words: ['drain', 'drains', 'drainage', 'sewage', 'sewer', 'sewerage', 'manhole', 'gutter', 'flood', 'flooded', 'flooding', 'waterlogging', 'waterlogged', 'clogged', 'choked', 'overflow', 'overflowing'],
  },
  Water: {
    phrases: ['water leak', 'water leakage', 'water supply', 'no water', 'water pipe', 'pipe burst', 'burst pipe', 'broken pipe', 'pipeline leak', 'dirty water', 'contaminated water', 'low water pressure', 'water tank', 'drinking water', 'tap water'],
    words: ['leak', 'leaking', 'leakage', 'pipe', 'pipeline', 'tap', 'taps', 'borewell', 'water', 'contaminated', 'muddy'],
  },
  Electricity: {
    phrases: ['street light', 'street lights', 'power cut', 'power outage', 'no electricity', 'no power', 'electric pole', 'electric wire', 'loose wire', 'exposed wire', 'hanging wire', 'short circuit', 'street lamp'],
    words: ['streetlight', 'streetlights', 'electricity', 'electric', 'electrical', 'power', 'outage', 'blackout', 'transformer', 'wire', 'wires', 'wiring', 'cable', 'cables', 'lamp', 'lamppost', 'voltage', 'sparking', 'spark', 'pole', 'bulb', 'dark'],
  },
};

const PHRASE_WEIGHT = 3;
const WORD_WEIGHT = 1;
// Tie-break order: more specific categories first, "Other" is never scored.
const TIE_ORDER = ['Drainage', 'Water', 'Electricity', 'Sanitation', 'Road'];

function normalize(text) {
  return ` ${String(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()} `;
}

export function scoreCategories(description) {
  const text = normalize(description);
  const tokens = new Set(text.trim().split(' '));
  const scores = {};
  for (const category of TIE_ORDER) {
    const { phrases, words } = KEYWORDS[category];
    let score = 0;
    for (const phrase of phrases) {
      if (text.includes(` ${phrase} `)) score += PHRASE_WEIGHT;
    }
    for (const word of words) {
      if (tokens.has(word)) score += WORD_WEIGHT;
    }
    scores[category] = score;
  }
  return scores;
}

/** Returns one of VALID_CATEGORIES. Falls back to 'Other' when nothing matches. */
export function classifyByKeywords(description) {
  if (!description || typeof description !== 'string') return 'Other';
  const scores = scoreCategories(description);
  let best = 'Other';
  let bestScore = 0;
  for (const category of TIE_ORDER) {
    if (scores[category] > bestScore) {
      best = category;
      bestScore = scores[category];
    }
  }
  return best;
}
