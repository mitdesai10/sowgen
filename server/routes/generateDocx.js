const express = require('express');
const router = express.Router();
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageNumber,
  Footer,
  Header,
  BorderStyle,
  ShadingType,
} = require('docx');

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

// Navy color in hex (without #)
const NAVY_COLOR = '1e2a4a';
const BODY_FONT = 'Calibri';
const HEADING_SIZE = 28; // 14pt in half-points
const BODY_SIZE = 22; // 11pt in half-points
const TITLE_SIZE = 48; // 24pt

function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return months[month];
}

function formatDate(date) {
  const day = date.getDate();
  const month = getMonthName(date.getMonth());
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function findSectionContent(sow, sectionName) {
  // Try exact match first
  if (sow[sectionName] !== undefined) return sow[sectionName];

  // Case-insensitive match
  const lowerTarget = sectionName.toLowerCase();
  for (const key of Object.keys(sow)) {
    if (key.toLowerCase() === lowerTarget) return sow[key];
  }

  // Partial match (section name contains key or vice versa)
  for (const key of Object.keys(sow)) {
    if (
      key.toLowerCase().includes(lowerTarget) ||
      lowerTarget.includes(key.toLowerCase())
    ) {
      return sow[key];
    }
  }

  return null;
}

function buildSectionParagraphs(sectionName, content) {
  const paragraphs = [];

  // Section heading
  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: sectionName,
          bold: true,
          size: HEADING_SIZE,
          color: NAVY_COLOR,
          font: BODY_FONT,
        }),
      ],
      spacing: { before: 300, after: 120 },
    })
  );

  if (!content) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'TBD',
            size: BODY_SIZE,
            font: BODY_FONT,
            italics: true,
          }),
        ],
        spacing: { after: 200 },
      })
    );
    return paragraphs;
  }

  // Split content on newlines and create a paragraph per non-empty line
  const lines = String(content).split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      // Add a small spacer paragraph
      paragraphs.push(new Paragraph({ children: [], spacing: { after: 80 } }));
    } else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: BODY_SIZE,
              font: BODY_FONT,
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }
  }

  return paragraphs;
}

router.post('/', async (req, res) => {
  try {
    const { sow, clientName, companyName } = req.body;

    if (!sow || typeof sow !== 'object') {
      return res.status(400).json({ error: 'sow object is required' });
    }

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD for filename
    const formattedDate = formatDate(today);

    // ── Cover page paragraphs ──────────────────────────────────────────────────
    const coverParagraphs = [
      // Spacer
      new Paragraph({ children: [], spacing: { before: 1200, after: 200 } }),

      // "STATEMENT OF WORK" title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'STATEMENT OF WORK',
            bold: true,
            size: TITLE_SIZE,
            color: NAVY_COLOR,
            font: BODY_FONT,
          }),
        ],
        spacing: { after: 400 },
      }),

      // Horizontal rule via border
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          bottom: { color: NAVY_COLOR, space: 1, value: BorderStyle.SINGLE, size: 6 },
        },
        children: [],
        spacing: { after: 400 },
      }),

      // Prepared for
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Prepared for', size: 24, font: BODY_FONT, color: '555555' }),
        ],
        spacing: { after: 80 },
      }),

      // Client name
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: clientName || 'Client',
            bold: true,
            size: 36,
            color: NAVY_COLOR,
            font: BODY_FONT,
          }),
        ],
        spacing: { after: 300 },
      }),

      // Prepared by
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Prepared by', size: 24, font: BODY_FONT, color: '555555' }),
        ],
        spacing: { after: 80 },
      }),

      // Company name
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: companyName || 'Company',
            bold: true,
            size: 32,
            color: NAVY_COLOR,
            font: BODY_FONT,
          }),
        ],
        spacing: { after: 300 },
      }),

      // Date
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: formattedDate, size: BODY_SIZE, font: BODY_FONT, color: '555555' }),
        ],
        spacing: { after: 120 },
      }),

      // Version
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Version 1.0', size: BODY_SIZE, font: BODY_FONT, color: '555555' }),
        ],
        spacing: { after: 2000 },
      }),

      // Page break after cover
      new Paragraph({ pageBreakBefore: true, children: [] }),
    ];

    // ── SOW section paragraphs ──────────────────────────────────────────────────
    const sectionParagraphs = [];
    for (const sectionName of SECTION_ORDER) {
      const content = findSectionContent(sow, sectionName);
      const paras = buildSectionParagraphs(sectionName, content);
      sectionParagraphs.push(...paras);
    }

    // ── Build document ─────────────────────────────────────────────────────────
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: BODY_FONT,
              size: BODY_SIZE,
            },
          },
        },
      },
      sections: [
        {
          properties: {},
          headers: {
            default: new Header({ children: [] }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `Confidential \u2014 ${companyName || 'Company'}    `,
                      size: 18,
                      font: BODY_FONT,
                      color: '777777',
                    }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      size: 18,
                      font: BODY_FONT,
                      color: '777777',
                    }),
                  ],
                }),
              ],
            }),
          },
          children: [...coverParagraphs, ...sectionParagraphs],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="SOW_${(clientName || 'Client').replace(/\s+/g, '_')}_${dateStr}.docx"`
    );
    res.send(buffer);
  } catch (error) {
    console.error('DOCX generation error:', error);
    res.status(500).json({ error: 'Failed to generate document', details: error.message });
  }
});

module.exports = router;
