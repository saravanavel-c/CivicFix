const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Must match the categories used across the frontend (ReportIssue.jsx, mockData.js)
const VALID_CATEGORIES = ['Road', 'Sanitation', 'Drainage', 'Water', 'Electricity', 'Other'];

const buildPrompt = (description) => `You are a strict classifier for a civic issue reporting app.
Look at the attached photo${description ? ' and the citizen\'s description below' : ''}, and classify the issue into exactly ONE of these categories:
Road, Sanitation, Drainage, Water, Electricity, Other

Guidelines:
- Road: potholes, broken pavement, damaged signage, traffic issues
- Sanitation: garbage, waste collection, littering, dead animals
- Drainage: sewage overflow, blocked drains, flooding
- Water: water leakage, no water supply, contaminated water, broken pipes
- Electricity: streetlights, power outages, exposed/damaged wiring
- Other: anything that doesn't clearly fit the above

${description ? `Citizen's description: "${description}"` : ''}

Respond with ONLY the single category word from the list above. No punctuation, no explanation.`;

/**
 * Classifies a civic complaint using an image (and optionally text) via Gemini's
 * vision-capable model. imageBase64 should be raw base64 (no data: prefix).
 */
export async function classifyComplaintWithImage(description, imageBase64, mimeType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in the environment.');
  }
  if (!imageBase64) {
    throw new Error('imageBase64 is required for image classification.');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: buildPrompt(description) },
            {
              inline_data: {
                mime_type: mimeType || 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 10,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  // Normalize and validate against the known category set; never trust the model blindly
  const cleaned = raw.replace(/[^a-zA-Z]/g, '');
  const match = VALID_CATEGORIES.find(
    (cat) => cat.toLowerCase() === cleaned.toLowerCase()
  );

  return match || 'Other';
}

/**
 * Fetches a remote image (e.g. a preset/mock photo URL) and returns it as base64
 * plus its content type, so it can be passed into classifyComplaintWithImage.
 */
export async function fetchImageAsBase64(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image URL (${response.status}): ${imageUrl}`);
  }
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { base64, mimeType };
}