import { classifyByKeywords, VALID_CATEGORIES } from './keywordClassifier.js';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-20b'; // fast + cheap, plenty for single-label classification
const GROQ_TIMEOUT_MS = 8000; // fail fast so the keyword fallback can answer quickly

const SYSTEM_PROMPT = `You are a strict text classifier for a civic issue reporting app.
Classify the citizen's complaint into exactly ONE of these categories:
Road, Sanitation, Drainage, Water, Electricity, Other

Guidelines:
- Road: potholes, broken pavement, damaged signage, traffic issues
- Sanitation: garbage, waste collection, littering, dead animals
- Drainage: sewage overflow, blocked drains, flooding
- Water: water leakage, no water supply, contaminated water, broken pipes
- Electricity: streetlights, power outages, exposed/damaged wiring
- Other: anything that doesn't clearly fit the above

Respond with ONLY the single category word from the list above. No punctuation, no explanation.`;

async function classifyWithGroq(description) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in the environment.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: description.slice(0, 1000) }, // keep prompts small/cheap
      ],
      temperature: 0,
      max_tokens: 50,
      reasoning_effort: 'low',
    }),
    signal: AbortSignal.timeout(GROQ_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content?.trim() || '';
  const cleaned = raw.replace(/[^a-zA-Z]/g, '').toLowerCase();

  const match = VALID_CATEGORIES.find((cat) => cat.toLowerCase() === cleaned);
  if (!match) {
    throw new Error(`Groq returned an unrecognised category: ${JSON.stringify(raw)}`);
  }
  return match;
}

/**
 * Classifies a complaint description. Tries the Groq LLM first and falls back to
 * the offline keyword classifier if Groq is unavailable or returns something unusable.
 * Returns { category, source } where source is 'groq' or 'keyword'.
 */
export async function classifyComplaint(description) {
  try {
    const category = await classifyWithGroq(description);
    return { category, source: 'groq' };
  } catch (err) {
    console.warn(`Groq classification unavailable, using keyword fallback: ${err.message}`);
    return { category: classifyByKeywords(description), source: 'keyword' };
  }
}
