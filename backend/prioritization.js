// Keyword -> severity weight. Matched case-insensitively as whole words/phrases.
const HIGH_SEVERITY_KEYWORDS = [
  'accident', 'accidents', 'injury', 'injured', 'died', 'death', 'fire', 'collapse',
  'collapsed', 'exposed wire', 'live wire', 'electrocut', 'children', 'school',
  'hospital', 'flooding', 'flooded', 'sewage overflow', 'contaminated', 'gas leak',
];

const MEDIUM_SEVERITY_KEYWORDS = [
  'blocking', 'blocked', 'overflow', 'leak', 'leaking', 'no water', 'power cut',
  'outage', 'damaged', 'broken', 'deep', 'large', 'heavy',
];

// Baseline risk per category, independent of wording (Electricity/Drainage default higher)
const CATEGORY_BASE_SCORE = {
  Electricity: 3,
  Drainage: 3,
  Water: 2,
  Road: 2,
  Sanitation: 1,
  Other: 1,
};

const DUPLICATE_BOOST_PER_REPORT = 1; // each corroborating duplicate nudges the score up
const MAX_DUPLICATE_BOOST = 4;

const HIGH_THRESHOLD = 6;
const MEDIUM_THRESHOLD = 3;

function countKeywordMatches(description, keywords) {
  const lower = description.toLowerCase();
  const matched = [];
  for (const kw of keywords) {
    if (lower.includes(kw)) matched.push(kw);
  }
  return matched;
}

/**
 * Computes a suggested priority (Low/Medium/High) for a complaint based on:
 * - keywords in the description signaling real-world severity/danger
 * - the category's inherent baseline risk
 * - how many likely-duplicate reports exist (more reports = more urgent)
 *
 * Returns { priority, score, reasons } where reasons explains what drove the score,
 * so the UI can show *why* a priority was suggested rather than a black-box label.
 */
export function computePriority({ description, category, duplicateCount = 0 }) {
  const reasons = [];
  let score = CATEGORY_BASE_SCORE[category] ?? CATEGORY_BASE_SCORE.Other;
  reasons.push(`Base risk for ${category || 'Other'} category: ${score}`);

  const highMatches = countKeywordMatches(description || '', HIGH_SEVERITY_KEYWORDS);
  if (highMatches.length > 0) {
    score += highMatches.length * 2;
    reasons.push(`High-severity terms found: ${highMatches.join(', ')}`);
  }

  const mediumMatches = countKeywordMatches(description || '', MEDIUM_SEVERITY_KEYWORDS);
  if (mediumMatches.length > 0) {
    score += mediumMatches.length;
    reasons.push(`Medium-severity terms found: ${mediumMatches.join(', ')}`);
  }

  if (duplicateCount > 0) {
    const boost = Math.min(duplicateCount * DUPLICATE_BOOST_PER_REPORT, MAX_DUPLICATE_BOOST);
    score += boost;
    reasons.push(`${duplicateCount} similar nearby report(s) found (+${boost})`);
  }

  let priority;
  if (score >= HIGH_THRESHOLD) priority = 'High';
  else if (score >= MEDIUM_THRESHOLD) priority = 'Medium';
  else priority = 'Low';

  return { priority, score, reasons };
}