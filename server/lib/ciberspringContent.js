/**
 * Maps SOWGen's generated SOW object onto the fields the Ciberspring
 * Managed Services layout expects.
 *
 * The layout supplies the template's own boilerplate wherever the SOW has no
 * equivalent, so a partially-filled SOW still produces a complete document.
 */

const { findSectionContent } = require('./sowSections');

const BULLET_RE = /^\s*([-*•‣]|\d+[.)])\s+/;

/** Split a section body into bullet items, dropping empty lines. */
function toBullets(text) {
  if (!text) return [];
  return String(text)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(BULLET_RE, '').trim())
    .filter(Boolean);
}

/** First paragraph of a section, for prose fields. */
function firstPara(text) {
  if (!text) return '';
  const parts = String(text).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  return parts[0] || '';
}

/** Pull the first currency figure out of free text, e.g. "around $180,000". */
function findMoney(text) {
  if (!text) return null;
  const m = String(text).match(/\$\s?[\d,]+(?:\.\d{2})?/);
  return m ? m[0].replace(/\s/g, '') : null;
}

/** Pull a month count, e.g. "16 weeks" -> 4 months, "4 months" -> 4. */
function findMonths(text) {
  if (!text) return null;
  const mo = String(text).match(/(\d+)\s*month/i);
  if (mo) return parseInt(mo[1], 10);
  const wk = String(text).match(/(\d+)\s*week/i);
  if (wk) return Math.max(1, Math.round(parseInt(wk[1], 10) / 4));
  return null;
}

function parseMoney(s) {
  if (!s) return null;
  const n = Number(String(s).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function money(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

/**
 * The source template hardcodes "a minimum of 40 hours and a maximum of 50".
 * Those are its own example figures, so state the real monthly allocation
 * instead of contradicting the rate card.
 */
function buildBillingBasis(contracted, monthCount, fromSow) {
  if (contracted && monthCount) {
    const perMonth = Math.round(contracted / monthCount);
    const carry = Math.max(1, Math.round(perMonth * 0.125));
    return `This engagement is billed on a time-and-materials basis at approximately ${perMonth} hours per month. Up to ${carry} unused hours can be applied to the following month.`;
  }
  return fromSow || null;
}

function buildCiberspringContent(sow, meta, opts = {}) {
  const get = (name) => findSectionContent(sow, name);

  const timelineText = get('Project Timeline & Milestones') || '';
  const paymentText = get('Payment Terms & Schedule') || '';
  const budgetText = meta.budget || '';

  const monthCount = findMonths(meta.timeline) || findMonths(timelineText) || 4;
  const total = parseMoney(meta.budget) || parseMoney(findMoney(paymentText)) ||
                parseMoney(findMoney(get('Executive Summary')));

  // Rate card. Ciberspring's template shows contracted hours at a list and a
  // discounted rate; without explicit figures we derive hours from the total.
  const rate = 225;
  const discounted = 195;
  const contracted = total ? Math.round(total / discounted) : null;

  const scheduleMonths = Array.from({ length: Math.min(monthCount, 8) }, (_, i) => ({
    label: String(i + 1),
    hours: contracted ? Math.round(contracted / monthCount) : '—',
  }));

  const perMonth = total ? total / monthCount : null;
  const paymentRows = perMonth
    ? Array.from({ length: Math.min(monthCount, 8) }, (_, i) => [`Month ${i + 1}`, money(perMonth)])
    : [];

  // Scope blocks mirror the template's cyan-barred sections.
  const scopeBlocks = [];

  const background = get('Executive Summary');
  if (background) {
    scopeBlocks.push({
      title: 'Background',
      intro: firstPara(background),
      bullets: toBullets(get('Project Objectives')),
    });
  }

  const scope = get('Scope of Work');
  if (scope) {
    scopeBlocks.push({
      title: 'Discovery & Scope',
      intro: firstPara(scope),
      bullets: toBullets(get('Deliverables')),
    });
  }

  const outOfScope = get('Out of Scope');
  if (outOfScope) {
    scopeBlocks.push({ title: 'Out of Scope', bullets: toBullets(outOfScope) });
  }

  const roles = get('Roles & Responsibilities');
  if (roles) {
    scopeBlocks.push({ title: 'Roles & Responsibilities', bullets: toBullets(roles) });
  }

  const risks = get('Risks & Mitigation');
  if (risks) {
    scopeBlocks.push({ title: 'Risks & Mitigation', bullets: toBullets(risks) });
  }

  return {
    contactName: meta.contactName || '—',
    timeline: meta.timeline || (monthCount ? `${monthCount} Months` : 'TBD'),
    timeframe: monthCount ? `${monthCount} Months` : null,
    objective: firstPara(get('Executive Summary')),
    scopeBlocks,
    rateCard: {
      time: `${monthCount} Months*`,
      contracted: contracted ? String(contracted) : '—',
      rate: money(rate),
      discountedRate: money(discounted),
      total: total ? money(total) : '—',
    },
    billingBasis: buildBillingBasis(contracted, monthCount, firstPara(paymentText)),
    scheduleMonths,
    paymentRows,
    initialPayment: total ? money(total * 0.3) : null,
    exclusions: toBullets(get('Out of Scope')).slice(0, 4),
    assumptions: toBullets(get('Assumptions')),
    logoPath: opts.logoPath || null,
  };
}

module.exports = { buildCiberspringContent, toBullets, firstPara, findMoney, findMonths };
