const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

router.post('/', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'No URL provided' });
  }

  // Basic URL validation
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SOWGen/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      timeout: 10000,
    });

    if (response.status === 401 || response.status === 403) {
      return res.status(200).json({
        error: true,
        message:
          'This recording requires login. Please export your transcript manually and paste it in the text tab.',
      });
    }

    if (!response.ok) {
      return res.status(200).json({
        error: true,
        message: `Could not access this URL (status ${response.status}). Please export your transcript manually and paste it in the text tab.`,
      });
    }

    const html = await response.text();

    // Try to extract transcript text from common patterns
    // Zoom transcripts often appear in specific div structures
    const transcriptMatch = html.match(/transcript[^>]*>([\s\S]*?)<\/[^>]+transcript/i);
    if (transcriptMatch) {
      // Strip HTML tags
      const text = transcriptMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length > 50) {
        return res.json({ transcript: text });
      }
    }

    // Try to find any substantial paragraph text (Google Docs transcripts, etc.)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      // Remove script and style blocks
      const cleanBody = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanBody.length > 200) {
        return res.json({ transcript: cleanBody.substring(0, 50000) }); // Cap at 50k chars
      }
    }

    return res.json({
      error: true,
      message:
        'Could not automatically extract transcript from this URL. Please export your transcript manually and paste it in the text tab.',
    });
  } catch (error) {
    console.error('Zoom fetch error:', error);
    res.json({
      error: true,
      message:
        'This recording requires login or is inaccessible. Please export your transcript manually and paste it in the text tab.',
    });
  }
});

module.exports = router;
