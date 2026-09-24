const express = require('express');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const router = express.Router();

const { getTemplate, DEFAULT_TEMPLATE_ID } = require('../templates');
const { SECTION_ORDER, findSectionContent, formatDate } = require('../lib/sowSections');

const LOGO_DIR = path.join(__dirname, '..', 'assets', 'logos');

/** Register brand faces when a template ships .ttf files; otherwise builtins. */
function resolveFonts(doc, tpl) {
  const fonts = { heading: tpl.fonts.heading, body: tpl.fonts.body, italic: tpl.fonts.italic };

  if (tpl.fonts.headingFile && fs.existsSync(tpl.fonts.headingFile)) {
    doc.registerFont('brand-heading', tpl.fonts.headingFile);
    fonts.heading = 'brand-heading';
  }
  if (tpl.fonts.bodyFile && fs.existsSync(tpl.fonts.bodyFile)) {
    doc.registerFont('brand-body', tpl.fonts.bodyFile);
    fonts.body = 'brand-body';
  }
  return fonts;
}

function logoPath(tpl) {
  if (!tpl.logo || !tpl.logo.file) return null;
  const p = path.join(LOGO_DIR, tpl.logo.file);
  return fs.existsSync(p) ? p : null;
}

function contentWidth(doc, tpl) {
  return doc.page.width - tpl.page.margins.left - tpl.page.margins.right;
}

// ── Cover page ───────────────────────────────────────────────────────────────

function drawCover(doc, tpl, fonts, meta) {
  const { left, right, top } = tpl.page.margins;
  const width = contentWidth(doc, tpl);
  const logo = logoPath(tpl);

  if (tpl.cover.variant === 'banded') {
    // Full-bleed color band across the top of the cover.
    const bandHeight = 200;
    doc.save().rect(0, 0, doc.page.width, bandHeight).fill(tpl.colors.primary).restore();

    let y = 70;
    if (logo) {
      try {
        doc.image(logo, left, y, { width: tpl.logo.width || 140 });
        y += 60;
      } catch (_) { /* unreadable logo must not kill the export */ }
    }
    doc.font(fonts.heading).fontSize(tpl.sizes.coverTitle).fillColor('#ffffff')
      .text(tpl.cover.title, left, y, { width });

    doc.y = bandHeight + 70;
  } else if (tpl.cover.variant === 'leftRule') {
    // Vertical accent rule down the left edge, text ragged-left beside it.
    const ruleX = left;
    const ruleHeight = logo ? 150 : 84;
    doc.save().rect(ruleX, top, 4, ruleHeight).fill(tpl.colors.accent).restore();

    let y = top;
    if (logo) {
      try {
        doc.image(logo, ruleX + 22, y, { width: tpl.logo.width || 130 });
        y += 58;
      } catch (_) { /* ignore */ }
    }
    doc.font(fonts.heading).fontSize(tpl.sizes.coverTitle).fillColor(tpl.colors.primary)
      .text(tpl.cover.title, ruleX + 22, y, { width: width - 22 });

    doc.y = top + ruleHeight + 50;
  } else {
    // centered
    let y = top + 90;
    if (logo) {
      try {
        const w = tpl.logo.width || 150;
        doc.image(logo, (doc.page.width - w) / 2, y, { width: w });
        y += 70;
      } catch (_) { /* ignore */ }
    }
    doc.font(fonts.heading).fontSize(tpl.sizes.coverTitle).fillColor(tpl.colors.primary)
      .text(tpl.cover.title, left, y, { width, align: 'center' });

    if (tpl.cover.showRule) {
      const ruleY = doc.y + 18;
      doc.save().moveTo(left + width * 0.3, ruleY).lineTo(left + width * 0.7, ruleY)
        .lineWidth(1).stroke(tpl.colors.accent).restore();
      doc.y = ruleY + 40;
    } else {
      doc.y += 30;
    }
  }

  const align = tpl.cover.variant === 'centered' ? 'center' : 'left';
  const x = left;

  const block = (label, value, valueSize) => {
    doc.font(fonts.body).fontSize(tpl.sizes.coverMeta).fillColor(tpl.colors.muted)
      .text(label, x, doc.y, { width, align });
    doc.moveDown(0.25);
    doc.font(fonts.heading).fontSize(valueSize).fillColor(tpl.colors.primary)
      .text(value, x, doc.y, { width, align });
    doc.moveDown(1.1);
  };

  block('Prepared for', meta.clientName || 'Client', tpl.sizes.coverClient);
  block('Prepared by', meta.companyName || 'Ciberspring', tpl.sizes.coverClient - 3);

  if (meta.projectName) block('Project', meta.projectName, tpl.sizes.coverClient - 5);

  doc.font(fonts.body).fontSize(tpl.sizes.coverMeta).fillColor(tpl.colors.muted)
    .text(meta.formattedDate, x, doc.y, { width, align });
  if (tpl.cover.showVersion) {
    doc.moveDown(0.3);
    doc.text(`Version ${meta.version || '1.0'}`, x, doc.y, { width, align });
  }
}

// ── Body sections ────────────────────────────────────────────────────────────

function drawHeading(doc, tpl, fonts, text, index) {
  const { left } = tpl.page.margins;
  const width = contentWidth(doc, tpl);

  // Keep a heading with at least a few lines of its body.
  if (doc.y > doc.page.height - tpl.page.margins.bottom - 90) doc.addPage();

  let label = text;
  if (tpl.headings.numbered) label = `${index + 1}.  ${label}`;
  if (tpl.headings.uppercase) label = label.toUpperCase();

  doc.moveDown(0.8);
  doc.font(fonts.heading).fontSize(tpl.sizes.heading).fillColor(tpl.colors.primary)
    .text(label, left, doc.y, { width, characterSpacing: tpl.headings.uppercase ? 0.5 : 0 });

  if (tpl.headings.rule) {
    const y = doc.y + 5;
    doc.save().moveTo(left, y).lineTo(left + width, y).lineWidth(0.75)
      .stroke(tpl.colors.rule).restore();
    doc.y = y + 10;
  } else {
    doc.moveDown(0.4);
  }
}

const BULLET_RE = /^([-*•]|\d+[.)])\s+/;

function drawBody(doc, tpl, fonts, content) {
  const { left } = tpl.page.margins;
  const width = contentWidth(doc, tpl);

  if (!content) {
    doc.font(fonts.italic).fontSize(tpl.sizes.body).fillColor(tpl.colors.muted)
      .text('TBD', left, doc.y, { width });
    return;
  }

  doc.fillColor(tpl.colors.text).font(fonts.body).fontSize(tpl.sizes.body);

  for (const raw of String(content).split('\n')) {
    const line = raw.trim();
    if (!line) { doc.moveDown(0.4); continue; }

    const bullet = line.match(BULLET_RE);
    if (bullet) {
      const body = line.replace(BULLET_RE, '');
      const indent = 16;
      const startY = doc.y;
      doc.font(fonts.body).fillColor(tpl.colors.accent).text('•', left + 2, startY, { width: 10 });
      doc.fillColor(tpl.colors.text)
        .text(body, left + indent, startY, { width: width - indent, align: 'left' });
      doc.moveDown(0.35);
    } else {
      doc.font(fonts.body).fillColor(tpl.colors.text)
        .text(line, left, doc.y, { width, align: 'left', lineGap: 1.5 });
      doc.moveDown(0.45);
    }
  }
}

// ── Footer, stamped across buffered pages ────────────────────────────────────

function drawFooters(doc, tpl, fonts, meta) {
  const range = doc.bufferedPageRange();
  const { left, right, bottom } = tpl.page.margins;

  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    if (i === range.start) continue; // cover carries no footer

    // PDFKit refuses to lay out text below the bottom margin, so drop it for
    // the duration of the footer write.
    doc.page.margins.bottom = 0;

    const width = doc.page.width - left - right;
    const y = doc.page.height - bottom + 24;

    doc.save().moveTo(left, y - 10).lineTo(left + width, y - 10)
      .lineWidth(0.5).stroke(tpl.colors.rule).restore();

    doc.font(fonts.body).fontSize(tpl.sizes.footer).fillColor(tpl.colors.muted);

    const leftLabel = tpl.footer.confidential
      ? `Confidential — ${meta.companyName || 'Ciberspring'}`
      : `${meta.companyName || 'Ciberspring'} — Statement of Work${meta.clientName ? ` for ${meta.clientName}` : ''}`;

    doc.text(leftLabel, left, y, { width: width * 0.8, align: 'left', lineBreak: false });

    if (tpl.footer.pageNumbers) {
      doc.text(`${i - range.start + 1}`, left + width * 0.8, y, {
        width: width * 0.2, align: 'right', lineBreak: false,
      });
    }

    if (tpl.footer.notice) {
      const notice = tpl.footer.notice.replace('{year}', String(new Date().getFullYear()));
      doc.fontSize(tpl.sizes.footer - 1).fillColor(tpl.colors.muted)
        .text(notice, left, y + 11, { width, align: 'left', lineBreak: false });
    }
  }
}

// ── Route ────────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { sow, clientName, companyName, projectName, version, templateId } = req.body;

    if (!sow || typeof sow !== 'object') {
      return res.status(400).json({ error: 'sow object is required' });
    }

    const tpl = getTemplate(templateId || DEFAULT_TEMPLATE_ID);
    const today = new Date();
    const meta = {
      clientName,
      companyName,
      projectName,
      version,
      formattedDate: formatDate(today),
    };

    const doc = new PDFDocument({
      size: tpl.page.size,
      margins: tpl.page.margins,
      bufferPages: true,
      info: {
        Title: `Statement of Work — ${clientName || 'Client'}`,
        Author: companyName || 'Ciberspring',
        Subject: projectName || 'Statement of Work',
      },
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));

    const done = new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    const fonts = resolveFonts(doc, tpl);

    drawCover(doc, tpl, fonts, meta);
    doc.addPage();

    SECTION_ORDER.forEach((name, i) => {
      drawHeading(doc, tpl, fonts, name, i);
      drawBody(doc, tpl, fonts, findSectionContent(sow, name));
    });

    drawFooters(doc, tpl, fonts, meta);
    doc.end();

    const buffer = await done;
    const dateStr = today.toISOString().split('T')[0];
    const safeClient = (clientName || 'Client').replace(/[^\w-]+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="SOW_${safeClient}_${tpl.id}_${dateStr}.pdf"`
    );
    res.send(buffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
});

module.exports = router;
