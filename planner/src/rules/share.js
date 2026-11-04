// Getting a build out of the planner: a share link, a planner file, and - for a custom class -
// DFO Online's own class file, which the game's custom-class builder imports
// (src/systems/customClass.js customClassDoc / parseCustomClassDoc, format 'daggerfall-enhanced/custom-class').
import { SKILLS, STAT_KEYS } from './tables.js';
import { BUILD_VERSION, defaultBuild } from './build.js';

export const CLASS_FILE_FORMAT = 'daggerfall-enhanced/custom-class';
export const CLASS_FILE_VERSION = 1;
const GROUPS = [['primary', 3], ['major', 3], ['minor', 6]];
const REP_GROUPS = ['merchants', 'peasants', 'scholars', 'nobility', 'underworld'];

/** The custom class as DFO's class document (what its Export button writes). */
export function classDocument(custom) {
  let at = 0;
  const skills = {};
  for (const [group, n] of GROUPS) {
    skills[group] = custom.skills.slice(at, at + n).map((id) => (id == null ? null : SKILLS[id].name));
    at += n;
  }
  const picks = (list) => list.map(({ primary, secondary }) => (secondary ? { primary, secondary } : { primary }));
  return {
    format: CLASS_FILE_FORMAT,
    version: CLASS_FILE_VERSION,
    name: custom.name,
    hitPointsPerLevel: custom.hp,
    skills,
    attributes: Object.fromEntries(STAT_KEYS.map((k) => [k, custom.stats[k]])),
    advantages: picks(custom.advantages),
    disadvantages: picks(custom.disadvantages),
    reputations: Object.fromEntries(REP_GROUPS.map((g) => [g, custom.reps?.[g] ?? 0])),
  };
}

/** Read one of DFO's class documents back into the planner's custom-class shape. Lenient on
 *  purpose: the planner shows what the game would refuse rather than refusing to load it. */
export function customFromClassDocument(input) {
  const doc = typeof input === 'string' ? JSON.parse(input) : input;
  if (doc?.format !== CLASS_FILE_FORMAT) throw new Error('That is not a DFO Online class file.');
  const byName = new Map(SKILLS.map((s) => [s.name.toLowerCase(), s.id]));
  const skills = [];
  for (const [group, n] of GROUPS) {
    const row = doc.skills?.[group] ?? [];
    for (let i = 0; i < n; i++) {
      const v = row[i];
      skills.push(v == null ? null : Number.isInteger(v) ? v : byName.get(String(v).trim().toLowerCase()) ?? null);
    }
  }
  const norm = (list) => (Array.isArray(list) ? list : []).map((p) => ({ primary: p.primary, secondary: p.secondary ?? '' }));
  return {
    name: String(doc.name ?? ''),
    hp: Number(doc.hitPointsPerLevel) || 8,
    skills,
    stats: Object.fromEntries(STAT_KEYS.map((k) => [k, Number(doc.attributes?.[k]) || 50])),
    advantages: norm(doc.advantages),
    disadvantages: norm(doc.disadvantages),
    reps: Object.fromEntries(REP_GROUPS.map((g) => [g, Number(doc.reputations?.[g]) || 0])),
  };
}

// ---- the share link: the build as compact JSON, base64url in the URL's #fragment ----
// The fragment never reaches a server, so a shared link carries the plan and nothing else.

const toBase64Url = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromBase64Url = (s) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export const encodeBuild = (build) => toBase64Url(JSON.stringify(build));

/** Decode a share string onto a fresh default build, so a link from an older planner still opens. */
export function decodeBuild(code) {
  const raw = JSON.parse(fromBase64Url(code));
  if (raw?.v !== BUILD_VERSION) throw new Error(`This link was made by planner format ${raw?.v}; this planner reads ${BUILD_VERSION}.`);
  const base = defaultBuild();
  return {
    ...base,
    ...raw,
    custom: { ...base.custom, ...raw.custom },
    rolls: { ...base.rolls, ...raw.rolls },
    settings: { ...base.settings, ...raw.settings },
  };
}
