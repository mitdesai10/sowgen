const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

const upload = multer({ dest: '/tmp/sowgen-uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    let text = '';

    if (ext === 'txt') {
      text = fs.readFileSync(req.file.path, 'utf-8');
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ path: req.file.path });
      text = result.value;
    } else if (ext === 'pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Unsupported file type. Use .txt, .docx, or .pdf' });
    }

    // Clean up
    fs.unlinkSync(req.file.path);

    res.json({ text });
  } catch (error) {
    console.error('Parse error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to parse file', details: error.message });
  }
});

module.exports = router;
