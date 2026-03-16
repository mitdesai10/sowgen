require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Ensure temp upload directory exists
const tmpDir = '/tmp/sowgen-uploads';
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/transcribe', require('./routes/transcribe'));
app.use('/api/parse-file', require('./routes/parseFile'));
app.use('/api/fetch-zoom', require('./routes/fetchZoom'));
app.use('/api/generate-sow', require('./routes/generateSow'));
app.use('/api/generate-docx', require('./routes/generateDocx'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`SOWGen server running on http://localhost:${PORT}`);
  console.log(`  Anthropic key: ${process.env.ANTHROPIC_API_KEY ? 'set' : 'MISSING'}`);
  console.log(`  OpenAI key:    ${process.env.OPENAI_API_KEY ? 'set' : 'not set (audio transcription disabled)'}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Run: lsof -ti :${PORT} | xargs kill -9`);
    process.exit(1);
  }
  throw err;
});

module.exports = app;
