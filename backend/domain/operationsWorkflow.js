'use strict';

const STATES = Object.freeze({ draft: ['submitted'], submitted: ['approved', 'changes_requested'], changes_requested: ['submitted'], approved: ['scheduled'], scheduled: ['completed', 'cancelled'], completed: ['reconciled'], cancelled: [], reconciled: [] });
const APPROVERS = new Set(['safeguarding_lead', 'finance_manager', 'administrator']);
function text(v, f, max = 500) { if (typeof v !== 'string' || !v.trim() || v.trim().length > max) throw new Error(`${f} is required`); return v.trim(); }
function validateProgram(input) {
  if (!input || typeof input !== 'object') throw new Error('program must be an object');
  if (!Array.isArray(input.volunteers)) throw new Error('volunteers must be an array');
  if (input.includesMinors && input.volunteers.some(v => v.backgroundCheckStatus !== 'cleared')) throw new Error('all volunteers serving minors must have a cleared background check');
  if (!input.consentBasis) throw new Error('consentBasis is required for communications');
  return { name: text(input.name, 'name', 200), facilityId: text(input.facilityId, 'facilityId', 100), startsAt: text(input.startsAt, 'startsAt', 80), endsAt: text(input.endsAt, 'endsAt', 80), includesMinors: input.includesMinors === true, volunteers: input.volunteers, households: Array.isArray(input.households) ? input.households : [], donationBudgetCents: Number.isInteger(input.donationBudgetCents) ? input.donationBudgetCents : 0, consentBasis: input.consentBasis, retentionUntil: input.retentionUntil || null };
}
function transition(current, next, role, record, note) {
  if (!STATES[current]?.includes(next)) throw new Error(`transition ${current} -> ${next} is not allowed`);
  if (next === 'approved' && (!APPROVERS.has(role) || !note || note.trim().length < 10)) throw new Error('documented separated-role approval is required');
  if (next === 'scheduled' && Date.parse(record.endsAt) <= Date.parse(record.startsAt)) throw new Error('program end must be after start');
  return next;
}
module.exports = { STATES, validateProgram, transition };
