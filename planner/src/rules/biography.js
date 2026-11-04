// What a biography answer does (src/systems/biography.js applyBiographyEffect; DFU BiogFile.cs).
// The effect lines come from your own BIOG*.TXT, via planner/tools/extract-game-data.mjs.
import { SKILLS, SOCIAL_GROUPS } from './tables.js';

/** ItemGroups (ItemEnums.cs) - the numbers an `IT` line carries. */
const ITEM_GROUPS = ['Drug', 'Useless item', 'Armor', 'Weapon', 'Magic item', 'Artifact', "Men's clothing", 'Book',
  'Furniture', 'Useless item', 'Religious item', 'Map', "Women's clothing", 'Painting', 'Gem', 'Plant ingredient',
  'Plant ingredient', 'Creature ingredient', 'Creature ingredient', 'Creature ingredient', 'Misc ingredient',
  'Metal ingredient', 'Misc ingredient', 'Transportation', 'Deed', 'Jewellery', 'Quest item', 'Misc item', 'Currency'];
const WEAPON_MATERIALS = ['Iron', 'Steel', 'Silver', 'Elven', 'Dwarven', 'Mithril', 'Adamantium', 'Ebony', 'Orcish', 'Daedric'];

/** The modifier commands. They ASSIGN, they do not add: two answers that both set one only keep
 *  the later answer's value. */
export const BIO_MODS = Object.freeze({
  MR: { field: 'magic', label: 'Resist magic' },
  RP: { field: 'poison', label: 'Resist poison' },
  RD: { field: 'disease', label: 'Resist disease' },
  TH: { field: 'avoidHit', label: 'To be hit' },
  FT: { field: 'fatigue', label: 'Fatigue' },
  RR: { field: 'reaction', label: 'Reaction' },
});

/** One effect line -> { kind, text, ... }, or null for lines that do nothing a planner needs. */
export function describeEffect(line) {
  const tokens = line.trim().split(/\s+/);
  if (/^-?\d+$/.test(tokens[0])) {
    const id = Number(tokens[0]);
    const amount = Number.parseInt(tokens[1], 10);
    if (!SKILLS[id] || !Number.isFinite(amount)) return null;
    return { kind: 'skill', skillId: id, amount, text: `${SKILLS[id].name} ${amount > 0 ? '+' : ''}${amount}` };
  }
  if (line.startsWith('GP')) {
    const arg = tokens.length > 2 ? tokens[1] + tokens[2] : tokens[1];
    const v = Number.parseInt(arg, 10);
    return Number.isFinite(v) ? { kind: 'gold', amount: v, text: `${v > 0 ? '+' : ''}${v} gold` } : null;
  }
  if (line.startsWith('IT')) {
    const [g, , mat] = tokens.slice(1).map(Number);
    const group = ITEM_GROUPS[g] ?? 'Item';
    const material = g === 3 && WEAPON_MATERIALS[mat] ? `${WEAPON_MATERIALS[mat]} ` : '';
    return { kind: 'item', text: `${material}${group.toLowerCase()}`.replace(/^./, (c) => c.toUpperCase()) };
  }
  if (line.startsWith('rf')) {
    return { kind: 'faction', amount: Number.parseInt(tokens[1], 10), text: `Faction #${tokens[0].slice(2)} reputation ${tokens[1]}` };
  }
  if (line[0] === 'r') {
    const id = Number.parseInt(tokens[0].slice(1), 10);
    const amount = Number.parseInt(tokens[1], 10);
    if (!SOCIAL_GROUPS[id] || !Number.isFinite(amount)) return null;
    return { kind: 'rep', group: id, amount, text: `${SOCIAL_GROUPS[id]} ${amount > 0 ? '+' : ''}${amount}` };
  }
  for (const [cmd, m] of Object.entries(BIO_MODS)) {
    if (!line.startsWith(cmd)) continue;
    const v = Number.parseInt(tokens[1], 10);
    return Number.isFinite(v) ? { kind: 'mod', cmd, field: m.field, amount: v, text: `${m.label} ${v > 0 ? '+' : ''}${v}` } : null;
  }
  return null;
}

/**
 * Fold the chosen answers ({ [questionIndex]: answerIndex }) into totals. Skills and reputations
 * add up; the modifier commands overwrite, in question order - `overwritten` lists what was lost.
 */
export function foldBiography(questions, answers) {
  const out = { skills: {}, reps: [0, 0, 0, 0, 0], gold: 0, items: [], mods: {}, overwritten: [], lines: [] };
  (questions ?? []).forEach((q, qi) => {
    const ai = answers?.[qi];
    const a = ai == null ? null : q.answers[ai];
    if (!a) return;
    for (const line of a.effects) {
      const e = describeEffect(line);
      if (!e) continue;
      out.lines.push({ question: qi, ...e });
      if (e.kind === 'skill') out.skills[e.skillId] = (out.skills[e.skillId] ?? 0) + e.amount;
      else if (e.kind === 'rep') out.reps[e.group] += e.amount;
      else if (e.kind === 'gold') out.gold += e.amount;
      else if (e.kind === 'item') out.items.push(e.text);
      else if (e.kind === 'mod') {
        if (out.mods[e.field] != null && out.mods[e.field] !== e.amount) {
          out.overwritten.push({ label: BIO_MODS[e.cmd].label, lost: out.mods[e.field], kept: e.amount, question: qi });
        }
        out.mods[e.field] = e.amount;
      }
    }
  });
  return out;
}
