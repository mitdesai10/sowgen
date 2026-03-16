import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import API_BASE from '../apiBase';

const SECTION_ORDER = [
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

// Section icons
const SECTION_ICONS = {
  'Executive Summary': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  'Project Objectives': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  'Scope of Work': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
};

function getIcon(sectionName) {
  return SECTION_ICONS[sectionName] || (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}

// Find a section value by name with fallbacks
function getSectionValue(sow, name) {
  if (sow[name] !== undefined) return sow[name] || '';
  const lower = name.toLowerCase();
  for (const key of Object.keys(sow)) {
    if (key.toLowerCase() === lower) return sow[key] || '';
  }
  for (const key of Object.keys(sow)) {
    if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
      return sow[key] || '';
    }
  }
  return '';
}

// Editable section card
function SowSection({ name, content, onChange }) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef(null);

  function handleEditClick() {
    setEditing(true);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          textareaRef.current.value.length,
          textareaRef.current.value.length
        );
      }
    }, 50);
  }

  function handleBlur() {
    setEditing(false);
  }

  const lines = content ? content.split('\n') : [];

  return (
    <div className="card mb-4 group relative">
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-100">
        <span className="text-navy-700">{getIcon(name)}</span>
        <h3 className="font-bold text-navy-800 text-sm uppercase tracking-wide">{name}</h3>
        <div className="flex-1" />
        {!editing && (
          <button
            onClick={handleEditClick}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-400 hover:text-navy-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-navy-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
            Edit
          </button>
        )}
        {editing && (
          <button
            onClick={handleBlur}
            className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-green-50 font-medium"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Done
          </button>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onBlur={handleBlur}
          className="w-full text-sm text-gray-700 leading-relaxed resize-none font-sans border border-navy-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-navy-300 bg-navy-50/30"
          style={{ minHeight: `${Math.max(120, lines.length * 22)}px` }}
        />
      ) : (
        <div
          className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap cursor-text hover:bg-gray-50/50 rounded-lg p-1 -m-1 transition-colors"
          onClick={handleEditClick}
          title="Click to edit"
        >
          {content || <span className="text-gray-400 italic">No content generated for this section.</span>}
        </div>
      )}
    </div>
  );
}

// Spinner component
function Spinner({ size = 4 }) {
  return (
    <svg className={`animate-spin w-${size} h-${size}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function Step3Preview({ sow, clientName, companyName, onRegenerate }) {
  // Build editable state from sow prop
  const [sections, setSections] = useState(() => {
    const result = {};
    for (const name of SECTION_ORDER) {
      result[name] = getSectionValue(sow, name);
    }
    return result;
  });

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  function handleSectionChange(name, value) {
    setSections((prev) => ({ ...prev, [name]: value }));
  }

  async function handleDownload() {
    setDownloading(true);
    setDownloadError('');
    try {
      const sowPayload = { ...sections, verification: sow.verification };
      const response = await axios.post(
        `${API_BASE}/api/generate-docx`,
        {
          sow: sowPayload,
          clientName,
          companyName,
        },
        { responseType: 'blob' }
      );

      // Trigger file download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Try to get filename from Content-Disposition header
      const disposition = response.headers['content-disposition'];
      let filename = `SOW_${(clientName || 'Client').replace(/\s+/g, '_')}.docx`;
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError('Failed to generate Word document. Please try again.');
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  }

  const completedSections = SECTION_ORDER.filter((n) => sections[n]?.trim()).length;

  return (
    <div className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* ── Main SOW content ───────────────────────────────────────────── */}
      <div className="lg:col-span-3">
        {/* Header */}
        <div className="card mb-4 bg-gradient-to-r from-navy-800 to-navy-700 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Statement of Work</h2>
              <p className="text-navy-200 text-sm">
                {clientName && <span className="font-medium text-white">{clientName}</span>}
                {clientName && companyName && <span className="text-navy-300"> · </span>}
                {companyName && <span>{companyName}</span>}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-navy-300 mb-1">Sections complete</div>
              <div className="text-2xl font-bold">
                {completedSections}
                <span className="text-navy-300 text-base font-normal">/{SECTION_ORDER.length}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 bg-navy-900/30 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-500"
              style={{ width: `${(completedSections / SECTION_ORDER.length) * 100}%` }}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
          </svg>
          Click or hover over any section to edit it inline
        </p>

        {/* All SOW sections */}
        {SECTION_ORDER.map((name) => (
          <SowSection
            key={name}
            name={name}
            content={sections[name]}
            onChange={(val) => handleSectionChange(name, val)}
          />
        ))}
      </div>

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <div className="lg:col-span-1">
        <div className="sticky top-6 space-y-4">
          {/* Download button */}
          <div className="card">
            <h3 className="text-sm font-bold text-navy-800 mb-3">Export</h3>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              {downloading ? (
                <>
                  <Spinner size={4} />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download .docx
                </>
              )}
            </button>

            {downloadError && (
              <p className="mt-2 text-xs text-red-600">{downloadError}</p>
            )}

            <p className="text-xs text-gray-400 mt-2 text-center">
              Professionally formatted Word document with cover page
            </p>
          </div>

          {/* Regenerate */}
          <div className="card">
            <h3 className="text-sm font-bold text-navy-800 mb-2">Need changes?</h3>
            <p className="text-xs text-gray-500 mb-3">
              Edit sections inline above, or start over with updated transcripts.
            </p>
            <button
              onClick={onRegenerate}
              className="w-full btn-secondary flex items-center justify-center gap-2 py-2.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Regenerate SOW
            </button>
          </div>

          {/* Section navigator */}
          <div className="card">
            <h3 className="text-sm font-bold text-navy-800 mb-3">Sections</h3>
            <nav className="space-y-0.5">
              {SECTION_ORDER.map((name, idx) => {
                const hasContent = !!sections[name]?.trim();
                return (
                  <a
                    key={name}
                    href={`#section-${idx}`}
                    onClick={(e) => {
                      e.preventDefault();
                      // Find the element with this section
                      const els = document.querySelectorAll('.card h3');
                      for (const el of els) {
                        if (el.textContent?.trim().toLowerCase() === name.toLowerCase()) {
                          el.closest('.card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          break;
                        }
                      }
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors hover:bg-gray-50 ${
                      hasContent ? 'text-gray-700' : 'text-gray-400'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        hasContent ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                    {name}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
