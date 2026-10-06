const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-20b';

const MIN_LENGTH = 10;

const VALIDATION_SYSTEM_PROMPT = `You check whether a citizen's submission to a civic issue reporting app
(for potholes, garbage, drainage, water, electricity problems) is a genuine complaint.

Reply with ONLY "YES" if it plausibly describes a real civic infrastructure issue.
Reply with ONLY "NO" if it is spam, a joke, gibberish, offensive, or unrelated to civic infrastructure.
No punctuation, no explanation — just YES or NO.`;

function ruleBasedCheck(description) {
  const trimmed = description.trim();

  if (trimmed.length < MIN_LENGTH) {
    return { isValid: false, reason: 'Description is too short to assess the issue.' };
  }

  // Flag strings that are mostly non-alphabetic (keyboard mashing, repeated symbols)
  const letters = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (letters / trimmed.length < 0.4) {
    return { isValid: false, reason: 'Description does not appear to contain readable text.' };
  }

  // Flag a single character repeated excessively (e.g. "aaaaaaaaaa")
  if (/(.)\1{6,}/.test(trimmed)) {
    return { isValid: false, reason: 'Description appears to be repeated characters, not a real report.' };
  }

  return { isValid: true, reason: null };
}

async function llmCheck(description) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    // No key available - skip the LLM layer, rely on rules only
    return null;
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
        { role: 'system', content: VALIDATION_SYSTEM_PROMPT },
        { role: 'user', content: description.slice(0, 1000) },
      ],
      temperature: 0,
      // gpt-oss models reason internally before answering, so a tiny token cap
      // cuts them off mid-thought before they ever emit YES/NO. Give it room.
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq validation error (${response.status})`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content?.trim().toUpperCase() || '';

  // Look for a clear YES/NO anywhere in the output rather than requiring an
  // exact short answer, since reasoning models often wrap the verdict in text.
  const hasNo = /\bNO\b/.test(raw);
  const hasYes = /\bYES\b/.test(raw);

  if (hasYes && !hasNo) return true;
  if (hasNo && !hasYes) return false;

  // Ambiguous or empty response: fail open rather than wrongly blocking a real report
  return true;
}

/**
 * Validates a complaint description. Rule-based checks run first and are
 * authoritative for obvious junk (too short, gibberish, spam patterns).
 * If rules pass, an LLM sanity check runs as a second layer; if the LLM
 * call fails (no key, network issue), validation falls back to rules-only
 * rather than blocking a legitimate report.
 */
export async function validateComplaint(description) {
  const ruleResult = ruleBasedCheck(description);
  if (!ruleResult.isValid) {
    return ruleResult;
  }

  try {
    const llmSaysValid = await llmCheck(description);
    if (llmSaysValid === false) {
      return { isValid: false, reason: 'This does not appear to be a genuine civic infrastructure complaint.' };
    }
    return { isValid: true, reason: null };
  } catch (err) {
    console.error('LLM validation check failed, falling back to rule-based result:', err.message);
    return { isValid: true, reason: null }; // fail open: don't block a real report over an LLM outage
  }
}