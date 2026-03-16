const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT =
  'You are an expert project manager and technical writer. Your job is to read raw meeting transcripts and produce a professional Statement of Work (SOW) document. Extract all relevant details from the transcripts. If something is unclear or not mentioned, write TBD. Keep each section focused and concise — 2 to 4 short paragraphs or a clear bullet list. Do not pad with filler text.';

const SECTION_NAMES = [
  'Executive Summary',
  'Project Objectives',
  'Scope of Work',
  'Out of Scope',
  'Deliverables',
  'Project Timeline & Milestones',
  'Roles & Responsibilities',
  'Assumptions',
  'Risks & Mitigation',
  'Payment Terms & Schedule',
  'Acceptance Criteria',
  'Change Management Process',
  'Terms & Conditions',
];

function buildUserPrompt(transcripts, clientName, projectName, companyName, budget, timeline) {
  const combinedTranscripts = transcripts
    .map((t) => `--- ${t.label} ---\n${t.text}`)
    .join('\n\n');

  return `Here are the meeting transcripts between ${companyName} and ${clientName}:

${combinedTranscripts}

Additional context:
- Project Name: ${projectName || 'Not specified'}
- Estimated Budget: ${budget || 'Not specified'}
- Estimated Timeline: ${timeline || 'Not specified'}

Generate a Statement of Work document. Keep each section concise (2-4 paragraphs or a short bullet list). Do NOT write lengthy essays — be professional and direct.

Return ONLY a single valid JSON object with these exact keys:
{
  "Executive Summary": "...",
  "Project Objectives": "...",
  "Scope of Work": "...",
  "Out of Scope": "...",
  "Deliverables": "...",
  "Project Timeline & Milestones": "...",
  "Roles & Responsibilities": "...",
  "Assumptions": "...",
  "Risks & Mitigation": "...",
  "Payment Terms & Schedule": "...",
  "Acceptance Criteria": "...",
  "Change Management Process": "...",
  "Terms & Conditions": "...",
  "verification": {
    "detectedClientName": "...",
    "detectedProjectType": "...",
    "keyDeliverables": ["...", "..."],
    "estimatedTimeline": "...",
    "estimatedBudget": "...",
    "transcriptCount": ${transcripts.length}
  }
}

Rules:
- Return ONLY the JSON object. No markdown. No code fences. No explanation before or after.
- Every string value must be properly escaped (no unescaped quotes, no raw newlines inside strings — use \\n for line breaks).
- The JSON must be complete and valid. Do not truncate.`;
}

function cleanAndParseJSON(raw) {
  let text = raw.trim();

  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');

  // Find the first { and last } to extract just the JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No valid JSON object found in response');
  }
  text = text.slice(start, end + 1);

  return JSON.parse(text);
}

router.post('/', async (req, res) => {
  try {
    const { transcripts, clientName, projectName, companyName, budget, timeline } = req.body;

    if (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0) {
      return res.status(400).json({ error: 'No transcripts provided' });
    }
    if (!clientName || !projectName || !companyName) {
      return res.status(400).json({ error: 'clientName, projectName, and companyName are required' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Anthropic API key not configured.' });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const userPrompt = buildUserPrompt(transcripts, clientName, projectName, companyName, budget, timeline);

    console.log(`Generating SOW for "${clientName}" / "${projectName}" — ${transcripts.length} transcript(s)`);

    // First attempt — 16k tokens is plenty for a concise SOW
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawContent = message.content[0].text;
    console.log(`Response length: ${rawContent.length} chars, stop_reason: ${message.stop_reason}`);

    // Warn if Claude hit the token limit (response was cut off)
    if (message.stop_reason === 'max_tokens') {
      console.warn('WARNING: Response hit max_tokens limit — JSON may be truncated');
    }

    let parsedJSON;
    try {
      parsedJSON = cleanAndParseJSON(rawContent);
    } catch (parseErr) {
      console.warn('First parse failed:', parseErr.message);
      console.warn('Raw preview:', rawContent.substring(0, 300));

      // Retry with a fresh, tighter prompt — do NOT pass the truncated response as context
      const retryPrompt = `${userPrompt}

CRITICAL: Your previous response was not valid JSON. This time:
1. Keep every section to 1-2 short paragraphs only.
2. Return ONLY the raw JSON object — no markdown, no code fences, nothing else.
3. Escape all special characters properly inside strings.`;

      const retryMessage = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 16000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: retryPrompt }],
      });

      const retryRaw = retryMessage.content[0].text;
      console.log(`Retry response length: ${retryRaw.length} chars, stop_reason: ${retryMessage.stop_reason}`);

      try {
        parsedJSON = cleanAndParseJSON(retryRaw);
      } catch (retryErr) {
        console.error('Retry parse failed:', retryErr.message);
        return res.status(500).json({
          error: 'Failed to generate a valid SOW. Please try again.',
          details: retryErr.message,
        });
      }
    }

    // Ensure all 13 sections exist
    for (const section of SECTION_NAMES) {
      if (!parsedJSON[section]) {
        parsedJSON[section] = 'TBD';
      }
    }

    // Ensure verification object exists
    if (!parsedJSON.verification || typeof parsedJSON.verification !== 'object') {
      parsedJSON.verification = {
        detectedClientName: clientName,
        detectedProjectType: 'Software / Services Project',
        keyDeliverables: [],
        estimatedTimeline: timeline || 'TBD',
        estimatedBudget: budget || 'TBD',
        transcriptCount: transcripts.length,
      };
    }
    parsedJSON.verification.transcriptCount = transcripts.length;

    console.log('SOW generation successful');
    res.json({ sow: parsedJSON });

  } catch (error) {
    console.error('SOW generation error:', error.message);
    res.status(500).json({
      error: 'SOW generation failed. Please try again.',
      details: error.message,
    });
  }
});

module.exports = router;
