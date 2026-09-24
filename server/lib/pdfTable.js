/**
 * Table rendering for PDFKit.
 *
 * PDFKit has no table primitive. This measures wrapped cell text to size rows,
 * breaks across pages, and repeats the header row on each new page.
 */

const DEFAULTS = {
  padding: 6,
  headerFill: null, // hex string; null = no fill
  headerColor: '#ffffff',
  borderColor: '#d8dde2',
  borderWidth: 0.5,
  fontSize: 9.5,
  headerFontSize: 9.5,
  rowFill: null,
  align: 'left',
  minRowHeight: 0,
};

/**
 * @param doc      PDFKit document
 * @param opts.x / opts.width   table box
 * @param opts.columns          [{ width: <fraction of table width>, align }]
 * @param opts.head             [string] header cells (optional)
 * @param opts.rows             [[string]] body cells
 * @param opts.fonts            { heading, body }
 * @param opts.style            overrides of DEFAULTS
 * @param opts.bottomMargin     y beyond which we page-break
 */
function drawTable(doc, opts) {
  const s = { ...DEFAULTS, ...(opts.style || {}) };
  const { x, width, columns, head, rows, fonts } = opts;
  const bottomLimit = opts.bottomMargin ?? doc.page.height - doc.page.margins.bottom;

  const totalFr = columns.reduce((a, c) => a + (c.width || 1), 0);
  const colWidths = columns.map((c) => ((c.width || 1) / totalFr) * width);

  const cellInner = (i) => colWidths[i] - s.padding * 2;

  function measureRow(cells, isHeader) {
    doc.font(isHeader ? fonts.heading : fonts.body)
      .fontSize(isHeader ? s.headerFontSize : s.fontSize);
    let h = 0;
    cells.forEach((text, i) => {
      const t = text == null ? '' : String(text);
      const hh = doc.heightOfString(t || ' ', { width: cellInner(i) });
      if (hh > h) h = hh;
    });
    return Math.max(h + s.padding * 2, s.minRowHeight);
  }

  function drawRow(cells, y, isHeader) {
    const h = measureRow(cells, isHeader);
    const fill = isHeader ? s.headerFill : s.rowFill;

    if (fill) {
      doc.save().rect(x, y, width, h).fill(fill).restore();
    }

    // Cell borders
    if (s.borderColor && s.borderWidth) {
      doc.save().lineWidth(s.borderWidth).strokeColor(s.borderColor);
      let cx = x;
      doc.rect(x, y, width, h).stroke();
      for (let i = 0; i < colWidths.length - 1; i++) {
        cx += colWidths[i];
        doc.moveTo(cx, y).lineTo(cx, y + h).stroke();
      }
      doc.restore();
    }

    doc.font(isHeader ? fonts.heading : fonts.body)
      .fontSize(isHeader ? s.headerFontSize : s.fontSize)
      .fillColor(isHeader ? s.headerColor : s.bodyColor || '#101921');

    let cx = x;
    cells.forEach((text, i) => {
      const t = text == null ? '' : String(text);
      doc.text(t, cx + s.padding, y + s.padding, {
        width: cellInner(i),
        align: columns[i].align || s.align,
      });
      cx += colWidths[i];
    });

    return h;
  }

  let y = opts.y ?? doc.y;

  if (head && head.length) {
    const hh = measureRow(head, true);
    if (y + hh > bottomLimit) { doc.addPage(); y = doc.page.margins.top; }
    y += drawRow(head, y, true);
  }

  for (const row of rows) {
    const rh = measureRow(row, false);
    if (y + rh > bottomLimit) {
      doc.addPage();
      y = doc.page.margins.top;
      if (head && head.length) y += drawRow(head, y, true);
    }
    y += drawRow(row, y, false);
  }

  doc.y = y;
  doc.x = doc.page.margins.left;
  return y;
}

/**
 * The full-width cyan bar the Ciberspring template uses to open a scope
 * block. It is a one-cell table in the source document.
 */
function drawSectionBar(doc, { x, width, text, fill, color, font, fontSize = 10.5, padding = 6, keepWith = 48 }) {
  doc.font(font).fontSize(fontSize);
  const h = doc.heightOfString(text, { width: width - padding * 2 }) + padding * 2;

  // Never strand the bar at the foot of a page: it must fit along with
  // `keepWith` points of whatever follows it.
  if (doc.y + h + keepWith > doc.page.height - doc.page.margins.bottom) doc.addPage();

  const y = doc.y;
  doc.save().rect(x, y, width, h).fill(fill).restore();
  doc.fillColor(color).font(font).fontSize(fontSize)
    .text(text, x + padding, y + padding, { width: width - padding * 2 });
  doc.y = y + h;
  doc.x = x;
  return doc.y;
}

module.exports = { drawTable, drawSectionBar };
