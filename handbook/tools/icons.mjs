// Only known symbols can be selected; content cannot inject SVG markup.
export const iconNames = [
  'tip', 'warning', 'online', 'example', 'note',
  'level', 'renown', 'registered', 'quest', 'other',
  'bank', 'general-store', 'temple', 'tavern', 'guild-hall',
  'armorer', 'weapon-smith', 'stable', 'port', 'carriage'
];
const escapeAttribute = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function icon(name, sprite = 'theme/icons.svg') {
  if (!iconNames.includes(name)) throw Error(`Unknown handbook icon: ${name}`);
  return `<svg class="icon" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="${escapeAttribute(sprite)}#${name}"></use></svg>`;
}
export function gateIcon(gate) {
  const value = String(gate || '').trim().toLowerCase();
  if (/^levels?\b/.test(value)) return 'level';
  if (/^renown\b/.test(value)) return 'renown';
  if (/^registered\b/.test(value)) return 'registered';
  if (/^quest\b/.test(value)) return 'quest';
  return 'other';
}
