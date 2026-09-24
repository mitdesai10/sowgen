/**
 * SOW template registry.
 *
 * Each entry is pure configuration consumed by routes/generatePdf.js.
 * Adding a brand means adding an object here, not touching the renderer.
 *
 * `verified` means the palette/type/layout were matched against a real sample
 * document from that client. Anything with verified:false is a structural
 * placeholder so the template is selectable end-to-end; the colors are NOT
 * that company's real brand values and must be replaced once a sample lands.
 */

// Shared defaults. A template overrides only what differs.
const BASE = {
  page: {
    size: 'LETTER',
    margins: { top: 72, bottom: 72, left: 72, right: 72 },
  },
  fonts: {
    heading: 'Helvetica-Bold',
    body: 'Helvetica',
    italic: 'Helvetica-Oblique',
    // Absolute path to a .ttf to embed a real brand face; null = PDFKit builtin.
    headingFile: null,
    bodyFile: null,
  },
  sizes: {
    coverTitle: 26,
    coverClient: 20,
    coverMeta: 11,
    heading: 13,
    body: 10.5,
    footer: 8,
  },
  cover: {
    variant: 'centered', // centered | banded | leftRule
    title: 'STATEMENT OF WORK',
    showRule: true,
    showVersion: true,
  },
  headings: {
    uppercase: false,
    numbered: false,
    rule: true, // hairline under each section heading
  },
  footer: {
    confidential: true,
    pageNumbers: true,
    // Optional legal line under the footer rule. {year} is substituted.
    notice: null,
  },
  logo: null, // { file: 'ciberspring.png', width: 140 } relative to assets/logos
};

function define(config) {
  return {
    ...BASE,
    ...config,
    page: { ...BASE.page, ...(config.page || {}) },
    fonts: { ...BASE.fonts, ...(config.fonts || {}) },
    sizes: { ...BASE.sizes, ...(config.sizes || {}) },
    cover: { ...BASE.cover, ...(config.cover || {}) },
    headings: { ...BASE.headings, ...(config.headings || {}) },
    footer: { ...BASE.footer, ...(config.footer || {}) },
  };
}

const TEMPLATES = {
  // Values below were read directly out of "Managed Services SoW Template.docx":
  // logo pixels for the brand colors, styles.xml/document.xml for type and
  // margins, footer1.xml for the notice line.
  ciberspring: define({
    id: 'ciberspring',
    label: 'Ciberspring',
    description: 'Ciberspring house style',
    verified: true,
    colors: {
      primary: '#101921', // H1 ink, matches the wordmark's #101822
      accent: '#00BFFE', // H2 headings, table fills, footer rule
      text: '#101921',
      muted: '#666666', // footer secondary text
      rule: '#d8dde2',
    },
    // The source doc is set in Aptos, which is a Microsoft-bundled face we
    // cannot redistribute. Its own styles.xml falls back to Helvetica, so we
    // do the same. Drop Aptos .ttf files in assets/fonts and point
    // headingFile/bodyFile at them to match exactly.
    fonts: { heading: 'Helvetica-Bold', body: 'Helvetica', italic: 'Helvetica-Oblique' },
    page: { margins: { top: 72, bottom: 72, left: 54, right: 54 } },
    sizes: { coverTitle: 24, heading: 14, body: 10, footer: 8 },
    cover: { variant: 'centered', title: 'STATEMENT OF WORK' },
    headings: { uppercase: true, rule: true },
    footer: {
      confidential: false,
      pageNumbers: true,
      notice:
        '© Copyright {year}, Ciberspring. All rights reserved. Confidential. Do not distribute or disseminate.',
    },
    logo: { file: 'ciberspring.png', width: 170 },
  }),

  evident: define({
    id: 'evident',
    label: 'Evident',
    description: 'Evident client format',
    verified: false,
    colors: {
      primary: '#123b4a',
      accent: '#2e8a8a',
      text: '#1a1a1a',
      muted: '#5a6b6b',
      rule: '#cfdcdc',
    },
    cover: { variant: 'leftRule' },
  }),

  wk: define({
    id: 'wk',
    label: 'Wolters Kluwer',
    description: 'WK client format',
    verified: false,
    colors: {
      primary: '#00558c',
      accent: '#e5792a',
      text: '#1a1a1a',
      muted: '#586269',
      rule: '#cfd9e0',
    },
    cover: { variant: 'banded' },
    headings: { uppercase: true },
  }),

  amneal: define({
    id: 'amneal',
    label: 'Amneal',
    description: 'Amneal client format',
    verified: false,
    colors: {
      primary: '#0b3d69',
      accent: '#5b9b45',
      text: '#1a1a1a',
      muted: '#5a6570',
      rule: '#d2dae2',
    },
    cover: { variant: 'banded' },
  }),

  gilead: define({
    id: 'gilead',
    label: 'Gilead',
    description: 'Gilead client format',
    verified: false,
    colors: {
      primary: '#9b1b30',
      accent: '#c8452f',
      text: '#1a1a1a',
      muted: '#5f5a5a',
      rule: '#e2d2d4',
    },
    cover: { variant: 'leftRule' },
    headings: { uppercase: true, numbered: true },
  }),
};

const DEFAULT_TEMPLATE_ID = 'ciberspring';

function getTemplate(id) {
  return TEMPLATES[id] || TEMPLATES[DEFAULT_TEMPLATE_ID];
}

function listTemplates() {
  return Object.values(TEMPLATES).map((t) => ({
    id: t.id,
    label: t.label,
    description: t.description,
    verified: t.verified,
    swatch: t.colors.primary,
    accent: t.colors.accent,
  }));
}

module.exports = { TEMPLATES, DEFAULT_TEMPLATE_ID, getTemplate, listTemplates };
