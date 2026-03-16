import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';

// ── Small helpers ──────────────────────────────────────────────────────────────

function wordCount(text) {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function Spinner({ size = 4 }) {
  return (
    <svg
      className={`animate-spin w-${size} h-${size} text-navy-600`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
      <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="shrink-0 text-red-400 hover:text-red-600">✕</button>
      )}
    </div>
  );
}

// ── Drag-and-drop upload zone ──────────────────────────────────────────────────

function UploadZone({ onFileProcessed, onError, onLoadingChange }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const inputRef = useRef(null);

  const AUDIO_EXTS = ['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg'];
  const DOC_EXTS = ['txt', 'docx', 'pdf'];

  async function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    const isAudio = AUDIO_EXTS.includes(ext);
    const isDoc = DOC_EXTS.includes(ext);

    if (!isAudio && !isDoc) {
      onError(`Unsupported file type ".${ext}". Please upload .txt, .docx, .pdf, .mp3, .mp4, .m4a, or .wav`);
      return;
    }

    setLoading(true);
    onLoadingChange(true);

    try {
      const formData = new FormData();
      if (isAudio) {
        setLoadingMsg('Transcribing audio with Whisper AI...');
        formData.append('audio', file);
        const { data } = await axios.post('/api/transcribe', formData);
        onFileProcessed(data.transcript, file.name);
      } else {
        setLoadingMsg('Extracting text from file...');
        formData.append('file', file);
        const { data } = await axios.post('/api/parse-file', formData);
        onFileProcessed(data.text, file.name);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'Failed to process file. Please check the file and try again.';
      onError(msg);
    } finally {
      setLoading(false);
      onLoadingChange(false);
      setLoadingMsg('');
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleChange(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  return (
    <div>
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none
          ${dragging ? 'border-navy-500 bg-navy-50' : 'border-gray-300 hover:border-navy-400 hover:bg-gray-50'}
          ${loading ? 'cursor-wait opacity-75' : ''}
        `}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <Spinner size={8} />
            <p className="text-sm text-gray-600">{loadingMsg || 'Processing...'}</p>
          </div>
        ) : (
          <>
            <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {dragging ? 'Drop it here!' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-400 text-center">
              Documents: .txt, .docx, .pdf
              <br />
              Audio/Video: .mp3, .mp4, .m4a, .wav
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".txt,.docx,.pdf,.mp3,.mp4,.m4a,.wav,.webm,.ogg"
        onChange={handleChange}
      />
    </div>
  );
}

// ── Multiple transcripts tab ───────────────────────────────────────────────────

function MultipleTranscriptsTab({ blocks, onChange }) {
  function addBlock() {
    onChange([...blocks, { id: Date.now(), label: `Transcript ${blocks.length + 1}`, text: '' }]);
  }

  function updateBlock(id, field, value) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  }

  function removeBlock(id) {
    if (blocks.length <= 1) return;
    onChange(blocks.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, idx) => (
        <div key={block.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              value={block.label}
              onChange={(e) => updateBlock(block.id, 'label', e.target.value)}
              placeholder={`Label (e.g. "Discovery Call", "Follow-up Meeting")`}
              className="input-field flex-1 text-sm font-medium"
            />
            {blocks.length > 1 && (
              <button
                onClick={() => removeBlock(block.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                title="Remove this transcript"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <textarea
            value={block.text}
            onChange={(e) => updateBlock(block.id, 'text', e.target.value)}
            placeholder="Paste transcript content here..."
            rows={6}
            className="input-field text-sm resize-y font-mono leading-relaxed"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {wordCount(block.text).toLocaleString()} words
          </p>
        </div>
      ))}

      <button
        onClick={addBlock}
        className="flex items-center gap-2 text-sm text-navy-700 font-medium hover:text-navy-900 transition-colors px-3 py-2 rounded-lg hover:bg-navy-50 border border-dashed border-navy-300 w-full justify-center"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add another transcript
      </button>
    </div>
  );
}

// ── Main Step1Input component ──────────────────────────────────────────────────

const TABS = [
  { id: 'paste', label: 'Paste Text' },
  { id: 'upload', label: 'Upload File' },
  { id: 'url', label: 'Zoom / Meet URL' },
  { id: 'multiple', label: 'Multiple Transcripts' },
];

export default function Step1Input({ onGenerating, onSowGenerated, onGenerationFailed }) {
  const [activeTab, setActiveTab] = useState('paste');

  // Paste tab state
  const [pasteText, setPasteText] = useState('');

  // Upload tab state
  const [uploadError, setUploadError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // URL tab state
  const [zoomUrl, setZoomUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlResult, setUrlResult] = useState('');
  const [urlError, setUrlError] = useState('');

  // Multiple transcripts tab state
  const [multiBlocks, setMultiBlocks] = useState([
    { id: 1, label: 'Transcript 1', text: '' },
  ]);

  // Context form
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');

  // Submit state
  const [generating, setGenerating] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // ── Upload file handler ─────────────────────────────────────────────────────
  function handleFileProcessed(text, filename) {
    setPasteText(text);
    setActiveTab('paste'); // Switch to paste tab to show the result
    setUploadError('');
  }

  // ── Zoom URL fetch ──────────────────────────────────────────────────────────
  async function handleFetchUrl() {
    if (!zoomUrl.trim()) {
      setUrlError('Please enter a URL');
      return;
    }
    setUrlLoading(true);
    setUrlError('');
    setUrlResult('');
    try {
      const { data } = await axios.post('/api/fetch-zoom', { url: zoomUrl.trim() });
      if (data.error) {
        setUrlError(data.message);
      } else {
        setUrlResult(data.transcript);
      }
    } catch (err) {
      setUrlError(err.response?.data?.error || 'Failed to fetch URL. Please paste the transcript manually.');
    } finally {
      setUrlLoading(false);
    }
  }

  // ── Collect all transcripts from active tab ─────────────────────────────────
  function collectTranscripts() {
    if (activeTab === 'paste') {
      return pasteText.trim()
        ? [{ label: 'Meeting Transcript', text: pasteText.trim() }]
        : [];
    }
    if (activeTab === 'upload') {
      // After upload, result is in pasteText
      return pasteText.trim()
        ? [{ label: 'Uploaded Transcript', text: pasteText.trim() }]
        : [];
    }
    if (activeTab === 'url') {
      return urlResult.trim()
        ? [{ label: 'Zoom / Meet Transcript', text: urlResult.trim() }]
        : [];
    }
    if (activeTab === 'multiple') {
      return multiBlocks
        .filter((b) => b.text.trim())
        .map((b) => ({ label: b.label || 'Transcript', text: b.text.trim() }));
    }
    return [];
  }

  // ── Generate SOW ────────────────────────────────────────────────────────────
  async function handleGenerate() {
    setSubmitError('');

    const transcripts = collectTranscripts();

    if (transcripts.length === 0) {
      setSubmitError('Please provide at least one transcript before generating.');
      return;
    }

    if (!clientName.trim()) {
      setSubmitError('Client Name is required.');
      return;
    }
    if (!projectName.trim()) {
      setSubmitError('Project Name is required.');
      return;
    }
    if (!companyName.trim()) {
      setSubmitError('Your Company Name is required.');
      return;
    }

    setGenerating(true);
    onGenerating(); // Tell App to show Step 2 loading screen

    try {
      const { data } = await axios.post('/api/generate-sow', {
        transcripts,
        clientName: clientName.trim(),
        projectName: projectName.trim(),
        companyName: companyName.trim(),
        budget: budget.trim(),
        timeline: timeline.trim(),
      });

      onSowGenerated(data.sow, {
        clientName: clientName.trim(),
        projectName: projectName.trim(),
        companyName: companyName.trim(),
        budget: budget.trim(),
        timeline: timeline.trim(),
      });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        'SOW generation failed. Please check your API key and try again.';
      setSubmitError(msg);
      setGenerating(false);
      onGenerationFailed(); // Tell App to go back to step 1
    }
  }

  // Total word count across all active content
  const totalText = (() => {
    const t = collectTranscripts();
    return t.map((x) => x.text).join(' ');
  })();
  const totalWords = wordCount(totalText);
  const totalChars = totalText.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      {/* ── Left: transcript input ─────────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card">
          <h2 className="text-base font-bold text-navy-800 mb-4">Meeting Transcript</h2>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-5 p-1 bg-gray-100 rounded-xl">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Paste Text tab */}
          {activeTab === 'paste' && (
            <div>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your meeting transcript, notes, or any conversation content here...&#10;&#10;Tip: Include speaker names if available (e.g., 'John: We need the login feature by Q2...')"
                className="input-field text-sm resize-none font-mono leading-relaxed"
                style={{ minHeight: '240px' }}
              />
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>Tip: Include as much detail as possible for a better SOW</span>
                <span>{pasteText.length.toLocaleString()} chars · {wordCount(pasteText).toLocaleString()} words</span>
              </div>
            </div>
          )}

          {/* Upload File tab */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <UploadZone
                onFileProcessed={handleFileProcessed}
                onError={setUploadError}
                onLoadingChange={setUploadLoading}
              />
              <ErrorBanner message={uploadError} onDismiss={() => setUploadError('')} />
              {pasteText && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  File processed successfully — switched to Paste Text tab to preview
                </div>
              )}
            </div>
          )}

          {/* Zoom/Meet URL tab */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={zoomUrl}
                  onChange={(e) => setZoomUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                  placeholder="https://zoom.us/rec/share/... or Google Meet recording URL"
                  className="input-field flex-1 text-sm"
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={urlLoading}
                  className="btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  {urlLoading ? <Spinner size={4} /> : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                  {urlLoading ? 'Fetching...' : 'Fetch'}
                </button>
              </div>

              <ErrorBanner message={urlError} onDismiss={() => setUrlError('')} />

              {urlResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium text-green-700">Transcript fetched successfully</span>
                    <span>{wordCount(urlResult).toLocaleString()} words</span>
                  </div>
                  <textarea
                    value={urlResult}
                    onChange={(e) => setUrlResult(e.target.value)}
                    className="input-field text-sm resize-none font-mono leading-relaxed"
                    style={{ minHeight: '200px' }}
                  />
                </div>
              )}

              {!urlResult && !urlError && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
                  <strong>Note:</strong> Most Zoom and Google Meet recordings require a login to access.
                  If fetching fails, export your transcript as a .vtt or .txt file and upload it instead.
                </div>
              )}
            </div>
          )}

          {/* Multiple Transcripts tab */}
          {activeTab === 'multiple' && (
            <MultipleTranscriptsTab blocks={multiBlocks} onChange={setMultiBlocks} />
          )}

          {/* Word count footer */}
          {activeTab !== 'upload' && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>
                {activeTab === 'multiple'
                  ? `${multiBlocks.filter((b) => b.text.trim()).length} of ${multiBlocks.length} transcripts have content`
                  : 'Transcript content'}
              </span>
              <span>{totalChars.toLocaleString()} chars · {totalWords.toLocaleString()} words</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: context form + generate button ──────────────────────────── */}
      <div className="space-y-4">
        <div className="card">
          <h2 className="text-base font-bold text-navy-800 mb-4">Project Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Client Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Customer Portal Redesign"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Your Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Digital Solutions Inc."
                className="input-field"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-3">Optional Context</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Estimated Budget
                  </label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. $50,000 – $80,000"
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Estimated Timeline
                  </label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. 3 months, Q3 2025"
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {submitError && (
          <ErrorBanner message={submitError} onDismiss={() => setSubmitError('')} />
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-base"
        >
          {generating ? (
            <>
              <Spinner size={5} />
              Generating SOW...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Generate SOW with AI
            </>
          )}
        </button>

        {/* Info card */}
        <div className="bg-navy-50 rounded-xl p-4 text-xs text-navy-700">
          <p className="font-semibold mb-1.5">What happens next?</p>
          <ol className="space-y-1 list-decimal list-inside text-navy-600">
            <li>Claude analyzes your transcripts</li>
            <li>You verify what was detected</li>
            <li>Review and edit the full SOW</li>
            <li>Download as a Word document</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
