/**
 * Ciberspring "Managed Service Agreement" layout.
 *
 * A block-for-block reproduction of Managed Services SoW Template.docx.
 * Boilerplate prose is verbatim from that file; @Account / @contact /
 * @Opportunity Name / @timeliene are substituted with real values.
 *
 * Block numbers in comments refer to positions in the source document body.
 */

const { drawTable, drawSectionBar } = require('../../lib/pdfTable');

const CYAN = '#00BFFE';
const INK = '#101921';
const MUTED = '#666666';
const RED = '#CC0000';

function sub(text, v) {
  return String(text)
    .replace(/@Account/g, v.clientName)
    .replace(/@contact/g, v.contactName)
    .replace(/@Opportunity Name/g, v.serviceName)
    .replace(/@timeliene/g, v.timeline);
}

module.exports = function renderCiberspring(doc, tpl, fonts, meta, content) {
  const { left, right, top } = tpl.page.margins;
  const width = doc.page.width - left - right;
  const bottomLimit = doc.page.height - tpl.page.margins.bottom;

  const v = {
    clientName: meta.clientName || 'Client',
    contactName: content.contactName || '—',
    serviceName: meta.projectName || 'Managed Services',
    timeline: content.timeline || 'TBD',
  };

  const P = (text, opts = {}) => {
    if (!text) return;
    doc.font(opts.font || fonts.body)
      .fontSize(opts.size || 10.5)
      .fillColor(opts.color || INK)
      .text(sub(text, v), left, doc.y, { width, align: 'left', lineGap: 1.5 });
    doc.moveDown(opts.after ?? 0.5);
  };

  const H1 = (text) => {
    if (doc.y > bottomLimit - 80) doc.addPage();
    doc.moveDown(0.7);
    doc.font(fonts.heading).fontSize(17).fillColor(INK)
      .text(sub(text, v).toUpperCase(), left, doc.y, { width });
    doc.moveDown(0.45);
  };

  const H2 = (text, color = CYAN) => {
    if (doc.y > bottomLimit - 60) doc.addPage();
    doc.moveDown(0.5);
    doc.font(fonts.heading).fontSize(12.5).fillColor(color)
      .text(sub(text, v), left, doc.y, { width });
    doc.moveDown(0.35);
  };

  const H3 = (text) => {
    if (doc.y > bottomLimit - 60) doc.addPage();
    doc.moveDown(0.5);
    doc.font(fonts.heading).fontSize(11.5).fillColor(CYAN)
      .text(sub(text, v), left, doc.y, { width });
    doc.moveDown(0.3);
  };

  const bullets = (items, indent = 0) => {
    doc.font(fonts.body).fontSize(10.5);
    for (const it of items || []) {
      if (!it) continue;
      if (doc.y > bottomLimit - 24) doc.addPage();
      const ix = left + 12 + indent;
      const y0 = doc.y;
      doc.fillColor(CYAN).text('•', left + 2 + indent, y0, { width: 10 });
      doc.fillColor(INK).text(sub(it, v), ix, y0, { width: width - 12 - indent, lineGap: 1 });
      doc.moveDown(0.25);
    }
    doc.moveDown(0.3);
  };

  const tableStyle = {
    headerFill: CYAN,
    headerColor: '#ffffff',
    borderColor: '#cfd6dc',
    bodyColor: INK,
    fontSize: 9.5,
    headerFontSize: 9.5,
    padding: 6,
  };

  // ── Cover (blocks 0-3) ────────────────────────────────────────────────────
  const logo = content.logoPath;
  let cy = top + 40;
  if (logo) {
    try {
      doc.image(logo, left, cy, { width: 190 });
      cy += 60;
    } catch (_) { /* a bad logo must not break the export */ }
  }
  doc.y = cy + 150;
  doc.font(fonts.heading).fontSize(24).fillColor(INK)
    .text('Managed Service Agreement', left, doc.y, { width });
  doc.moveDown(0.3);
  doc.font(fonts.heading).fontSize(24).fillColor(CYAN)
    .text(`${v.clientName} & ${v.serviceName}`, left, doc.y, { width });

  doc.addPage();

  // ── MANAGED SERVICE OVERVIEW (4-5) ────────────────────────────────────────
  H1('Managed Service Overview');
  drawTable(doc, {
    x: left, width, y: doc.y, fonts,
    columns: [{ width: 42 }, { width: 58 }],
    rows: [
      [`Client: ${v.clientName}`, `Contact: ${v.contactName}`],
      [`Service: ${v.serviceName}`, `Estimated Timeline: ${v.timeline}`],
    ],
    style: { ...tableStyle, rowFill: CYAN, bodyColor: '#ffffff', borderColor: CYAN },
    bottomMargin: bottomLimit,
  });
  doc.moveDown(0.8);

  // ── Service Overview / Managed Services Plan (6-11) ────────────────────────
  H2('Service Overview');
  H2('Managed Services Plan', INK);
  P(content.objective ||
    'The objective for this Agreement is to initiate a Managed Services Project that gives @Account a structure for services related to supporting their platform.');
  P('This Managed Services Agreement is designed to provide @Account with flexibility in the way services are consumed, allowing for maximum pliability when business challenges arise, giving @Account the capability to pivot on-demand. @Account will benefit from the expertise of our entire organization, which includes platform specialists, architects, developers, and sales and marketing professionals. This initiative will enable @Account to make data-driven decisions while achieving comprehensive visibility into critical activities and processes. By doing so, @Account will be equipped to drive sustainable business growth and optimize revenue generation from mission-critical operations.');
  P('Account Executive: @Account will continue to work with a dedicated Account Executive responsible for maintaining the long-term roadmap, ensuring that all projects align with @Account’s strategic objectives.', { color: CYAN });
  P('Consultant: @Account will also have a Consultant who is the hands-on leader. Consultant’s will collaborate closely with you to represent your organization’s interest and manage all aspects of your account. You will also receive status updates showing burn trends and available hours.', { color: CYAN });

  // ── Projected Timetables (12-18) ──────────────────────────────────────────
  H2('Projected Timetables', INK);
  P("The Managed Services Program's success relies on its collaborative knowledge sharing amongst team members, leveraging the best practices of our agile consulting methodology.");
  P('Getting Started: New Service Agreements will take at up to twenty-four (24) billable hours to initiate. During the definition stage, Ciberspring will conduct detailed deep dive discovery sessions with appropriate project team members and business stakeholders. The objective is to understand @Account current environment and complexity, relevant business processes, identify backlog stories, build a communication plan and allocate resources.', { color: CYAN });
  P('User Adoption: Enhancement adoption is important to a successful Managed Services plan. The Ciberspring team will work with @Account to develop a communication and training plan. This plan will give all end users transparency into upcoming technology shifts.', { color: CYAN });
  bullets([
    'Ciberspring can set up refresher training courses when projects are launched.',
    'Ciberspring can have technical resources available to quickly mitigate any unforeseen issues',
    'Ciberspring can work with @Account champions to allow quick access for Q&A.',
  ]);

  // ── PLAN FLEXIBILTY (19-21) — typo preserved from the source template ─────
  H1('Plan Flexibilty');
  P('Ciberspring assumes that @Account’s usage may fluctuate up or down by 25% from the estimated Program budget. @Account may change the level of Services provided throughout the contract according to the following guidelines.');
  drawTable(doc, {
    x: left, width, y: doc.y, fonts,
    columns: [{ width: 6, align: 'center' }, { width: 94 }],
    rows: [
      ['1', 'Decreasing Hours\nIf @Account does not utilize the full agreed-upon budget within a given month, Ciberspring will carry forward the remaining balance to the following month.'],
      ['2', 'Increasing Hours\nCiberspring offers three options to increase the estimated budget. Borrowing Hours: @Account may borrow budget from the following month.'],
    ].map((r) => r.map((c) => sub(c, v))),
    style: tableStyle,
    bottomMargin: bottomLimit,
  });
  doc.moveDown(0.8);

  // ── MANAGED SERVICES SCOPE (22-69) ────────────────────────────────────────
  H1('Managed Services Scope');
  if (content.timeframe) {
    doc.font(fonts.heading).fontSize(12).fillColor(CYAN)
      .text(`Timeframe: ${content.timeframe}`, left, doc.y, { width });
    doc.moveDown(0.5);
  }

  for (const block of content.scopeBlocks || []) {
    drawSectionBar(doc, {
      x: left, width, text: sub(block.title, v),
      fill: CYAN, color: '#ffffff', font: fonts.heading, fontSize: 10.5,
    });
    doc.moveDown(0.4);
    if (block.intro) P(block.intro);
    if (block.bullets && block.bullets.length) bullets(block.bullets);
    doc.moveDown(0.2);
  }

  // ── SERVICE ESTIMATE (70-83) ──────────────────────────────────────────────
  H1('Service Estimate');
  H3('Allocated Resources');
  P('The following table is a resource plan and associated estimated cost to deliver the program described in this Service Agreement. Cost estimates outlined are subject to terms described above.');

  const rc = content.rateCard || {};
  drawTable(doc, {
    x: left, width, y: doc.y, fonts,
    head: ['Time', 'Contracted', 'Rate/Hr', 'Discounted Rate', 'Total'],
    columns: [{ width: 22 }, { width: 18, align: 'center' }, { width: 18, align: 'center' },
              { width: 21, align: 'center' }, { width: 21, align: 'right' }],
    rows: [[rc.time || '—', rc.contracted || '—', rc.rate || '—',
            rc.discountedRate || '—', rc.total || '—']],
    style: tableStyle,
    bottomMargin: bottomLimit,
  });
  doc.moveDown(0.4);
  P('* Annual Program includes access to Business Analysts, Consultants, Developers, Data Specialists, Solution Architects, and Project Managers',
    { size: 8, color: MUTED });

  H3('Schedule');
  P(content.billingBasis ||
    'This engagement is billed on a time-and-materials basis, with a minimum of 40 hours and a maximum of 50 hours. Up to 10 unused hours can be applied to the following month.');

  const months = content.scheduleMonths || [];
  if (months.length) {
    drawTable(doc, {
      x: left, width, y: doc.y, fonts,
      head: ['Month', ...months.map((m) => String(m.label))],
      columns: [{ width: 20 }, ...months.map(() => ({ width: 80 / months.length, align: 'center' }))],
      rows: [['Hours', ...months.map((m) => String(m.hours))]],
      style: tableStyle,
      bottomMargin: bottomLimit,
    });
    doc.moveDown(0.8);
  }

  H3('Payment Schedule by Month');
  P('Ciberspring will invoice @Account according to the below schedule, each milestone being invoiced the outlined fee at the initiation of said milestone. The initial milestone fee will be equal to the first months project cost, after which, normal invoicing on a monthly basis will commence. The initial payment must be paid prior to the first milestone beginning, which will preclude any travel or meetings from being finalized until such time that the first payment is received.');

  const payRows = content.paymentRows || [];
  if (payRows.length) {
    drawTable(doc, {
      x: left, width, y: doc.y, fonts,
      head: ['Services and Deliverables', 'Fees'],
      columns: [{ width: 70 }, { width: 30, align: 'right' }],
      rows: payRows.map((r) => [sub(r[0], v), r[1]]),
      style: tableStyle,
      bottomMargin: bottomLimit,
    });
    doc.moveDown(0.5);
  }

  P('The previous/above phase pricing does not include the following:', { size: 10, color: RED });
  bullets(content.exclusions || ['Platform licenses', 'Third-party applications identified during the engagement']);

  // ── SCHEDULE OF DELIVERABLES (84-91) ──────────────────────────────────────
  H2('Schedule of Deliverables');
  P('Upon execution of this Statement of Work, Ciberspring will issue an invoice to @Account for an initial payment amounting to 30% of the total estimated project fees, which is due upon receipt. Regular invoicing will continue according to the terms outlined in the agreement. Once invoicing has covered 70% of the estimated project’s cost, Ciberspring will apply the initial payment towards the remaining balance.');
  P('Failure to pay undisputed amounts within the agreed-upon payment terms will result in your project being placed on hold. If the project is put on hold, Ciberspring will invoice the outstanding hours incurred and a pre-payment fee, which will be the lower of either three weeks’ worth of resource allocation or the remainder of the project Estimated cost. The pre-payment fee can only be used once the project resumes and is non-refundable.');
  P('If this Statement of Work is terminated without cause per the terms in the MSA, prior to completion of the project, 100% of the remaining Statement of Work balance will be due to the payment terms outlined in MSA.');

  if (content.initialPayment) {
    drawTable(doc, {
      x: left, width, y: doc.y, fonts,
      head: ['Services and Deliverables', 'Fees'],
      columns: [{ width: 70 }, { width: 30, align: 'right' }],
      rows: [['Initial Payment', content.initialPayment]],
      style: tableStyle,
      bottomMargin: bottomLimit,
    });
    doc.moveDown(0.8);
  }

  // ── Assumptions (92-102) ──────────────────────────────────────────────────
  H2('Assumptions', INK);
  bullets(content.assumptions && content.assumptions.length ? content.assumptions : [
    '@Account will maintain a single point of contact for project management issues.',
    '@Account’s business process information and documents will be available within a reasonable timeframe.',
    '@Account key content providers and other necessary personnel will be available as required.',
    '@Account responsible for the accuracy of the data provided to Ciberspring.',
    'Issues and escalations will be directed to the Ciberspring Project Manager first.',
  ]);

  // ── ACCOUNTS PAYABLE (103-107) ────────────────────────────────────────────
  if (doc.y > bottomLimit - 160) doc.addPage();
  doc.moveDown(0.6);
  doc.font(fonts.heading).fontSize(17).fillColor(CYAN)
    .text('ACCOUNTS PAYABLE', left, doc.y, { width });
  doc.moveDown(0.4);
  P('Please provide the following contact information for at least one (up to two) accounts payable contacts. All invoices relating to this project are sent via email to these accounts payable contacts.',
    { size: 10 });

  const blank = '                                        ';
  drawTable(doc, {
    x: left, width, y: doc.y, fonts,
    columns: [{ width: 46 }, { width: 8 }, { width: 46 }],
    rows: [
      [blank, '', blank],
      ['Primary Contact Name', '', 'Secondary Contact Name'],
      [blank, '', blank],
      ['Email', '', 'Email'],
    ],
    style: { ...tableStyle, headerFill: null, borderColor: '#cfd6dc' },
    bottomMargin: bottomLimit,
  });
  doc.moveDown(0.8);

  // ── AUTHORIZATION (108-115) ───────────────────────────────────────────────
  if (doc.y > bottomLimit - 220) doc.addPage();
  H1('Authorization');
  doc.font(fonts.heading).fontSize(13).fillColor(INK)
    .text('Proposal to Purchase, Start Work, or Create SOW', left, doc.y, { width });
  doc.moveDown(0.4);
  P('The terms and conditions of the Ciberspring Master Services Agreement (the ‘Agreement’) shall be fully applicable to the services and products provided under this Statement of Work. IN WITNESS WHEREOF, the undersigned, each acting with proper authority, have executed this Statement of Work under seal.',
    { size: 10 });

  drawTable(doc, {
    x: left, width, y: doc.y, fonts,
    columns: [{ width: 46 }, { width: 8 }, { width: 46 }],
    rows: [
      ['Ciberspring International, LLC', '', v.clientName],
      ['Company Name', '', 'Company Name'],
      [blank, '', blank],
      ['Title', '', 'Title'],
      [blank, '', blank],
      ['Full Name', '', 'Full Name'],
      [blank, '', blank],
      ['Signature', '', 'Signature'],
      [blank, '', blank],
      ['Date', '', 'Date'],
    ],
    style: { ...tableStyle, headerFill: null, borderColor: '#cfd6dc' },
    bottomMargin: bottomLimit,
  });
};
