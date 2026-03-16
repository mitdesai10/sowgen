# SOWGen — Statement of Work Generator

SOWGen is a full-stack web application that transforms meeting transcripts, audio recordings, and notes into professional, client-ready Statements of Work (SOW) using Claude AI.

## Features

- **Multiple Input Modes**: Paste text, upload files (.txt, .docx, .pdf), upload audio/video for transcription (.mp3, .mp4, .m4a, .wav), fetch Zoom/Meet transcript URLs, or combine multiple transcripts
- **AI-Powered**: Uses Claude claude-sonnet-4-20250514 to extract structured SOW sections from unstructured meeting notes
- **Verification Step**: Before generating the final document, review what Claude detected (client name, project type, deliverables, etc.)
- **Inline Editing**: Edit any section of the generated SOW directly in the browser
- **Word Export**: Download a professionally formatted .docx file

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- An Anthropic API key (for Claude)
- An OpenAI API key (for Whisper audio transcription, optional)

## Environment Variables

Copy `.env` and fill in your keys:

| Variable | Description | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from console.anthropic.com | Yes |
| `OPENAI_API_KEY` | Your OpenAI API key (only needed for audio transcription) | Optional |
| `PORT` | Port the Express server listens on (default: 3001) | No |

## Setup & Installation

### 1. Clone or download the project

```bash
cd /Users/mitdesai/sowgen
```

### 2. Configure environment variables

```bash
# Edit .env and add your API keys
nano .env
```

Set the values:
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
PORT=3001
```

### 3. Install all dependencies

```bash
npm run install:all
```

This installs root dependencies, then client dependencies, then server dependencies.

### 4. Run in development mode

```bash
npm run dev
```

This starts both the Express backend (port 3001) and the Vite dev server (port 5173) concurrently.

Open your browser to: **http://localhost:5173**

## Running Separately

```bash
# Server only
npm run dev:server

# Client only
npm run dev:client
```

## How to Use

1. **Step 1 — Input**: Choose how to provide your meeting content:
   - **Paste Text**: Copy/paste your transcript or notes directly
   - **Upload File**: Upload a .txt, .docx, .pdf, .mp3, .mp4, .m4a, or .wav file
   - **Zoom/Meet URL**: Paste a public Zoom or Google Meet recording URL
   - **Multiple Transcripts**: Add several transcript sources and label each one

2. **Fill in Context**: Enter the client name, project name, your company name, and optionally budget and timeline estimates.

3. **Generate**: Click "Generate SOW" to send your transcripts to Claude.

4. **Verify**: Review what Claude extracted before proceeding. Go back to edit if needed.

5. **Preview & Edit**: All 13 SOW sections are displayed. Click any section body to edit it inline.

6. **Download**: Click "Download as Word (.docx)" to get a professionally formatted document.

## Project Structure

```
sowgen/
├── package.json           # Root — runs both client and server via concurrently
├── .env                   # API keys and config
├── client/                # React + Vite + Tailwind frontend
│   ├── src/
│   │   ├── App.jsx        # Wizard state management
│   │   ├── components/
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── Step1Input.jsx     # Multi-mode input
│   │   │   ├── Step2Loading.jsx   # Animated loading screen
│   │   │   ├── VerificationCard.jsx
│   │   │   └── Step3Preview.jsx   # SOW viewer + download
└── server/                # Express backend
    ├── index.js
    └── routes/
        ├── transcribe.js   # Whisper audio transcription
        ├── parseFile.js    # .txt/.docx/.pdf extraction
        ├── fetchZoom.js    # URL transcript fetching
        ├── generateSow.js  # Claude SOW generation
        └── generateDocx.js # .docx document creation
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/transcribe` | Transcribe audio/video file via Whisper |
| POST | `/api/parse-file` | Extract text from .txt, .docx, or .pdf |
| POST | `/api/fetch-zoom` | Fetch transcript from a public URL |
| POST | `/api/generate-sow` | Generate SOW JSON via Claude |
| POST | `/api/generate-docx` | Generate and download .docx file |

## Troubleshooting

**"Transcription failed"**: Make sure `OPENAI_API_KEY` is set correctly in `.env`.

**"SOW generation failed"**: Make sure `ANTHROPIC_API_KEY` is set correctly in `.env`.

**Port already in use**: Change `PORT` in `.env` and update the Vite proxy target in `client/vite.config.js`.

**Audio transcription for large files**: Whisper has a 25MB file size limit. For larger recordings, export just the transcript text and paste or upload it.
