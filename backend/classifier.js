const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'openai/gpt-oss-20b'; // fast + cheap, plenty for single-label classification

// Must match the categories used across the frontend (ReportIssue.jsx, mockData.js)
const VALID_CATEGORIES = ['Road', 'Sanitation', 'Drainage', 'Water', 'Electricity', 'Other'];

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

export async function classifyComplaint(description) {
  const apiKey = process.env.GROQ_API_KEY;
  console.log("GROQ KEY LOADED:", !!apiKey);
  console.log("GROQ MODEL:", GROQ_MODEL);
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
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  console.log("GROQ RESPONSE:", JSON.stringify(data, null, 2));

  const raw = data?.choices?.[0]?.message?.content?.trim() || '';

  console.log("GROQ RAW:", JSON.stringify(raw));

  const cleaned = raw.replace(/[^a-zA-Z]/g, '');

  console.log("CLEANED:", JSON.stringify(cleaned));

  const match = VALID_CATEGORIES.find(
    (cat) => cat.toLowerCase() === cleaned.toLowerCase()
  );

  console.log("FINAL CATEGORY:", match || "Other");

  return match || 'Other';
}
