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

/** Resolve a section's text from the LLM payload, tolerating key drift. */
function findSectionContent(sow, sectionName) {
  if (sow[sectionName] !== undefined) return sow[sectionName];

  const lowerTarget = sectionName.toLowerCase();
  for (const key of Object.keys(sow)) {
    if (key.toLowerCase() === lowerTarget) return sow[key];
  }
  for (const key of Object.keys(sow)) {
    const k = key.toLowerCase();
    if (k.includes(lowerTarget) || lowerTarget.includes(k)) return sow[key];
  }
  return null;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(date) {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

module.exports = { SECTION_ORDER, findSectionContent, formatDate };
