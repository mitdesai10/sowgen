const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const OpenAI = require('openai');

const upload = multer({ dest: '/tmp/sowgen-uploads/' });

router.post('/', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!process.env.OPENAI_API_KEY) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your .env file to use audio transcription.',
      });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
    });

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.json({ transcript: transcription.text });
  } catch (error) {
    console.error('Transcription error:', error);
    // Clean up temp file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      error: 'Transcription failed. Please try pasting the transcript manually.',
      details: error.message,
    });
  }
});

module.exports = router;
