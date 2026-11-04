// The planner's page. All rules live in ../rules; this file only draws them and edits the build.
import {
  STAT_KEYS, STAT_LABELS, STAT_SHORT, SKILLS, RACES, ADVANTAGE_KEYS, DISADVANTAGE_KEYS,
  secondaryListFor, labelOf, pickLabel, advDisAdjustment, EFFECT_FLAGS,
} from '../rules/tables.js';
import {
  refusalFor, picksFromCareer, difficultyPoints, totalAdjust, advancementMultiplier, HP_MIN, HP_MAX,
  STAT_MIN, STAT_MAX, STAT_BUDGET, DIFFICULTY_MIN, DIFFICULTY_MAX, REP_MAX, decodeCareer,
} from '../rules/career.js';
import { defaultBuild, compute, applyRollPreset, ROLL_LIMITS, TIER_BASE } from '../rules/build.js';
import { describeEffect } from '../rules/biography.js';
import { classDocument, customFromClassDocument, encodeBuild, decodeBuild } from '../rules/share.js';

const STEPS = [
  ['race', 'Race'], ['class', 'Class'], ['bio', 'Biography'], ['stats', 'Attributes'],
  ['skills', 'Skills'], ['reflexes', 'Reflexes'], ['summary', 'Summary'],
];
const REFLEXES = ['Very High', 'High', 'Average', 'Low', 'Very Low'];
const REP_KEYS = [['peasants', 'Commoners'], ['merchants', 'Merchants'], ['scholars', 'Scholars'], ['nobility', 'Nobility'], ['underworld', 'Underworld']];
const STORE_KEY = 'dfo-planner/build';

const state = {
  data: null,
  build: defaultBuild(),
  step: 'race',
  sheet: null,
  pending: { advantage: { primary: '', secondary: '' }, disadvantage: { primary: '', secondary: '' } },
  refusal: { advantage: '', disadvantage: '' },
};

// ---------------------------------------------------------------- helpers
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const signed = (n) => (n > 0 ? `+${n}` : `${n}`);
const pct = (n) => `${Math.round(n)}%`;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmt1 = (n) => (Math.round(n * 10) / 10).toString();

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, 2600);
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state.build)); } catch { /* private window: the link still works */ }
  const code = encodeBuild(state.build);
  history.replaceState(null, '', `#b=${code}`);
}

// spendPoolLowest (src/systems/chargen.js): one point at a time into the lowest of the set - the
// game's own rule for placing points nobody placed by hand.
function fillStats(b, sheet) {
  const values = { ...sheet.stats };
  for (let left = sheet.statPoolLeft; left > 0; left--) {
    const open = STAT_KEYS.filter((k) => values[k] < 100);
    if (!open.length) break;
    const low = open.reduce((a, k) => (values[k] < values[a] ? k : a), open[0]);
    values[low]++;
    b.statSpend[low] = (b.statSpend[low] ?? 0) + 1;
  }
}
function fillSkills(b, sheet) {
  const values = sheet.skillRows.map((r) => r.rolled + r.add);   // what the game's screen distributes over (no biography)
  const { career } = sheet;
  for (const [group, ids] of [['primary', career.primarySkills], ['major', career.majorSkills], ['minor', career.minorSkills]]) {
    for (let left = sheet.groupLeft[group]; left > 0; left--) {
      const low = ids.reduce((a, id) => (values[id] < values[a] ? id : a), ids[0]);
      values[low]++;
      b.skillSpend[low] = (b.skillSpend[low] ?? 0) + 1;
    }
  }
}
/** A brand-new plan starts as a character the game would accept: every rolled point placed. */
function freshBuild() {
  const b = defaultBuild();
  const sheet = compute(b, state.data);
  if (sheet.ok) { fillStats(b, sheet); fillSkills(b, compute(b, state.data)); }
  return b;
}

function update(mutate) {
  mutate(state.build);
  state.sheet = compute(state.build, state.data);
  save();
  render();
}

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------------------------------------------------------------- header
function renderSituation() {
  const s = state.build.settings;
  const seg = (name, opts, value) => `<span class="seg" role="group" aria-label="${esc(name)}">${opts.map(([v, l, extra]) =>
    `<button type="button" data-act="setting" data-key="${esc(name)}" data-val="${esc(v)}" aria-pressed="${String(value) === String(v)}" ${extra ?? ''}>${esc(l)}</button>`).join('')}</span>`;
  $('situation').innerHTML = `
    <label>Play ${seg('online', [['true', 'Online'], ['false', 'Offline']], s.online)}</label>
    <label title="Physical Combat And Armor Overhaul. DFO turns it on by default; online it cannot be turned off.">Combat rules
      ${seg('overhaul', [['true', 'DFO (overhaul)'], ['false', 'Daggerfall Unity', s.online ? 'disabled' : '']], s.online ? true : s.overhaul)}</label>
    <label>Dice ${seg('preset', [['worst', 'Worst'], ['typical', 'Typical'], ['best', 'Best']], state.build.rolls.preset)}</label>
    <label>Plan to level <span class="spin"><input type="number" min="1" max="100" value="${s.planLevel}" data-bind="planLevel" aria-label="Plan level"></span></label>`;
}

function renderActions() {
  const custom = state.build.classMode === 'custom';
  $('actions').innerHTML = `
    <button class="btn primary" data-act="share" type="button">Copy share link</button>
    <button class="btn" data-act="save-file" type="button">Save plan</button>
    <button class="btn" data-act="open-file" type="button">Open plan or class file</button>
    <button class="btn" data-act="export-class" type="button" ${custom ? '' : 'disabled title="Only a custom class has a class file"'}>Export class for DFO</button>
    <button class="btn" data-act="reset" type="button">New</button>`;
}

function renderSteps() {
  const p = state.sheet?.problems ?? [];
  const has = { class: p.some((x) => /class|Attributes must|Difficulty|Reputation|skills \(3/i.test(x)), stats: p.some((x) => /attribute point|cannot go above/.test(x)), skills: p.some((x) => /skill point/.test(x)) };
  $('steps').innerHTML = STEPS.map(([key, label], i) => `<button type="button" data-act="step" data-step="${key}" ${state.step === key ? 'aria-current="step"' : ''}>
    <span class="n">${i + 1}</span>${label}${has[key] ? '<span class="dot" title="Something here still needs fixing"></span>' : ''}</button>`).join('');
}

// ---------------------------------------------------------------- step: race
function raceTraits(race) {
  const out = [];
  const flag = (bits, word) => Object.entries(EFFECT_FLAGS).filter(([, b]) => bits & b).map(([n]) => `${word} ${n}`);
  out.push(...flag(race.resistanceFlags, 'Resists'), ...flag(race.immunityFlags, 'Immune to'));
  const pcaao = { Breton: 'none', HighElf: 'none', DarkElf: 'long & short blades', Redguard: 'long blades, blunt, axes, bows', WoodElf: 'short blades, bows', Khajiit: 'short blades, bare hands', Nord: 'axes, blunt, bare hands', Argonian: 'short blades' };
  const dfu = { DarkElf: 'all weapons (level/4)', Redguard: 'all but bows (level/3)', WoodElf: 'bows (level/3)' };
  return { flags: out, pcaao: pcaao[race.key], dfu: dfu[race.key] ?? 'none' };
}

function stepRace() {
  const b = state.build;
  const overhaul = state.sheet?.overhaul ?? true;
  return `<div class="panel"><h2>Choose a race</h2>
    <p class="lead">In DFO a race changes no attributes or skills. It decides resistances, weapon bonuses and how warm you stay (Climates &amp; Calories).</p>
    <div class="row"><span>Sex</span>${['female', 'male'].map((g) => `<button class="btn small" type="button" data-act="gender" data-val="${g}" aria-pressed="${b.gender === g}">${g[0].toUpperCase() + g.slice(1)}</button>`).join('')}
      <span class="muted">Sex changes only appearance and starting clothes.</span></div>
    <div class="cards">${RACES.map((r) => {
      const t = raceTraits(r);
      return `<button type="button" class="card" data-act="race" data-val="${r.key}" aria-pressed="${b.race === r.key}">
        <h3>${esc(r.name)}</h3>
        <ul>${t.flags.map((f) => `<li>${esc(f)}</li>`).join('')}
          <li>Weapon bonus: ${esc(overhaul ? t.pcaao : t.dfu)}</li>
          <li>Body warmth ${signed(r.temp)}°</li></ul></button>`;
    }).join('')}</div></div>`;
}

// ---------------------------------------------------------------- step: class
function specialTags(career) {
  const { advantages, disadvantages } = picksFromCareer(career);
  return [...advantages.map((p) => `<span class="tag adv">${esc(pickLabel(p))}</span>`), ...disadvantages.map((p) => `<span class="tag dis">${esc(pickLabel(p))}</span>`)].join('');
}

function stepClass() {
  const b = state.build;
  const classes = state.data.classes;
  const mode = `<div class="row"><span class="seg" role="group" aria-label="Class type">
    <button type="button" data-act="class-mode" data-val="standard" aria-pressed="${b.classMode === 'standard'}">Standard class</button>
    <button type="button" data-act="class-mode" data-val="custom" aria-pressed="${b.classMode === 'custom'}">Custom class</button></span></div>`;
  if (b.classMode === 'standard') {
    return `<div class="panel"><h2>Choose a class</h2>${mode}
      <p class="lead">Lower <b>advancement</b> means skills rise faster. You can open any class in the custom builder to change it.</p>
      <div class="cards">${classes.map((c, i) => `<button type="button" class="card" data-act="class" data-val="${i}" aria-pressed="${b.classIndex === i}">
        <h3>${esc(c.name)}</h3>
        <div class="muted num">HP/level ${c.hitPointsPerLevel} · advancement x${c.advancementMultiplier}</div>
        <div class="muted" style="font-size:.82rem;margin:4px 0">${[...c.primarySkills].map((id) => esc(SKILLS[id].name)).join(', ')}</div>
        <div>${specialTags(c)}</div></button>`).join('')}</div>
      <p style="margin-top:10px"><button class="btn" type="button" data-act="to-custom">Open ${esc(classes[b.classIndex].name)} in the custom builder</button></p></div>`;
  }
  return `<div class="panel"><h2>Custom class</h2>${mode}${customBuilder()}</div>`;
}

function customBuilder() {
  const c = state.build.custom;
  const adv = totalAdjust(c.advantages);
  const dis = totalAdjust(c.disadvantages);
  const points = difficultyPoints(c.hp, adv, dis);
  const mult = advancementMultiplier(points);
  const inRange = points >= DIFFICULTY_MIN && points <= DIFFICULTY_MAX;
  const markAt = ((clamp(points, DIFFICULTY_MIN, DIFFICULTY_MAX) - DIFFICULTY_MIN) / (DIFFICULTY_MAX - DIFFICULTY_MIN)) * 100;
  const spent = STAT_KEYS.reduce((n, k) => n + c.stats[k], 0);
  const skillSel = (slot) => {
    const taken = new Set(c.skills.filter((s, i) => s != null && i !== slot));
    return `<select data-bind="custom-skill" data-slot="${slot}" aria-label="Skill ${slot + 1}">
      <option value="">- choose -</option>
      ${[...SKILLS].sort((a, z) => a.name.localeCompare(z.name)).map((s) => `<option value="${s.id}" ${c.skills[slot] === s.id ? 'selected' : ''} ${taken.has(s.id) ? 'disabled' : ''}>${esc(s.name)}</option>`).join('')}</select>`;
  };
  const groups = [['Primary', 0, 3], ['Major', 3, 6], ['Minor', 6, 12]];
  const repSum = REP_KEYS.reduce((a, [k]) => a + (c.reps[k] ?? 0), 0);
  return `
    <div class="row">
      <label class="field">Class name<input type="text" maxlength="23" value="${esc(c.name)}" data-bind="custom-name"></label>
      <label class="field">Hit points per level
        <span class="spin"><button type="button" data-act="hp" data-d="-1" aria-label="Fewer hit points">-</button>
        <input type="number" min="${HP_MIN}" max="${HP_MAX}" value="${c.hp}" data-bind="custom-hp" aria-label="Hit points per level">
        <button type="button" data-act="hp" data-d="1" aria-label="More hit points">+</button></span></label>
    </div>
    <h3>Difficulty <span class="num ${inRange ? '' : 'bad'}">${signed(points)}</span> <span class="muted num">→ skills need x${mult.toFixed(2)} the uses</span></h3>
    <div class="gauge" aria-hidden="true"><span class="mark" style="left:${markAt}%"></span></div>
    <div class="gauge-labels"><span>${DIFFICULTY_MIN}: x0.30, fastest</span><span>0: x0.92</span><span>+${DIFFICULTY_MAX}: x3.00, slowest</span></div>
    <p class="muted" style="font-size:.85rem">Hit points ${signed(c.hp >= 8 ? c.hp - 8 : -2 * (8 - c.hp))}, advantages ${signed(adv)}, disadvantages ${signed(dis)}. The game refuses a class outside ${DIFFICULTY_MIN}..+${DIFFICULTY_MAX}.</p>

    <h3>Skills</h3>
    ${groups.map(([label, from, to]) => `<div class="row"><b style="width:70px">${label}</b><div class="grid-skills" style="flex:1">${Array.from({ length: to - from }, (_, i) => skillSel(from + i)).join('')}</div></div>`).join('')}

    <h3>Attributes <span class="pool num ${spent === STAT_BUDGET ? 'done' : 'over'}">${spent} / ${STAT_BUDGET}</span></h3>
    <p class="muted" style="font-size:.85rem">Each ${STAT_MIN}-${STAT_MAX}; together exactly ${STAT_BUDGET}. These are the class's base values - the dice add 0-10 to each, and a pool of 6-14, at the Attributes step.</p>
    <div class="grid-skills">${STAT_KEYS.map((k) => `<label class="field">${STAT_LABELS[k]}<span class="spin">
      <button type="button" data-act="cstat" data-key="${k}" data-d="-1" aria-label="Lower ${STAT_LABELS[k]}">-</button>
      <input type="number" min="${STAT_MIN}" max="${STAT_MAX}" value="${c.stats[k]}" data-bind="custom-stat" data-key="${k}" aria-label="${STAT_LABELS[k]}">
      <button type="button" data-act="cstat" data-key="${k}" data-d="1" aria-label="Raise ${STAT_LABELS[k]}">+</button></span></label>`).join('')}</div>

    <div class="row" style="align-items:start;margin-top:12px">
      ${pickWindow('advantage', c.advantages, c.disadvantages)}
      ${pickWindow('disadvantage', c.disadvantages, c.advantages)}
    </div>

    <h3>Reputations <span class="pool num ${repSum === 0 ? 'done' : 'over'}">${signed(repSum)}</span></h3>
    <p class="muted" style="font-size:.85rem">Raise one group by lowering another: the game requires the five to balance to 0.</p>
    <div class="grid-skills">${REP_KEYS.map(([k, label]) => `<label class="field">${label}<span class="spin">
      <button type="button" data-act="rep" data-key="${k}" data-d="-1" aria-label="Lower ${label}">-</button>
      <input type="number" min="${-REP_MAX}" max="${REP_MAX}" value="${c.reps[k] ?? 0}" data-bind="rep" data-key="${k}" aria-label="${label}">
      <button type="button" data-act="rep" data-key="${k}" data-d="1" aria-label="Raise ${label}">+</button></span></label>`).join('')}</div>`;
}

function pickWindow(kind, list, other) {
  const keys = kind === 'advantage' ? ADVANTAGE_KEYS : DISADVANTAGE_KEYS;
  const p = state.pending[kind];
  const second = p.primary ? secondaryListFor(p.primary) : null;
  const cand = { primary: p.primary, secondary: second ? (p.secondary || second[0]) : '' };
  const preview = p.primary ? refusalFor(cand, kind, kind === 'advantage' ? list : other, kind === 'advantage' ? other : list) : null;
  const title = kind === 'advantage' ? 'Special advantages' : 'Special disadvantages';
  return `<div class="panel" style="flex:1;min-width:260px;margin:0">
    <h3>${title} <span class="muted num">${list.length}/7 · ${signed(totalAdjust(list))}</span></h3>
    <div class="row">
      <select data-bind="pick-primary" data-kind="${kind}" aria-label="${title}"><option value="">- add -</option>
        ${keys.map((k) => `<option value="${k}" ${p.primary === k ? 'selected' : ''}>${esc(labelOf(k))}${secondaryListFor(k) ? '' : ` (${signed(advDisAdjustment(k))})`}</option>`).join('')}</select>
      ${second ? `<select data-bind="pick-secondary" data-kind="${kind}" aria-label="Option">${second.map((s) => `<option value="${s}" ${cand.secondary === s ? 'selected' : ''}>${esc(labelOf(s))} (${signed(advDisAdjustment(p.primary, s))})</option>`).join('')}</select>` : ''}
      <button class="btn small" type="button" data-act="pick-add" data-kind="${kind}" ${!p.primary || preview ? 'disabled' : ''}>Add</button>
    </div>
    <div class="refusal">${esc(preview || state.refusal[kind] || '')}</div>
    <ul class="picks">${list.map((x, i) => `<li><span>${esc(pickLabel(x))}</span><span><span class="num muted">${signed(advDisAdjustment(x.primary, x.secondary))}</span>
      <button class="btn small" type="button" data-act="pick-remove" data-kind="${kind}" data-i="${i}" aria-label="Remove ${esc(pickLabel(x))}">✕</button></span></li>`).join('') || '<li class="muted">None</li>'}</ul></div>`;
}

// ---------------------------------------------------------------- step: biography
function stepBio() {
  const s = state.sheet;
  const qs = s.bio.questions;
  const who = s.classInfo.isCustom ? `A custom class answers the ${esc(state.data.classes[s.bio.classIndex].name)}'s questions (the class sharing the most of its skills).` : '';
  if (!qs) return '<div class="panel"><h2>Biography</h2><p>No biography data for this class.</p></div>';
  return `<div class="panel"><h2>Biography</h2>
    <p class="lead">${who} Answers add skills, gold, items, reputations and a few resistances. Skipping the questionnaire in the game picks <b>random</b> answers.</p>
    <p><button class="btn small" type="button" data-act="bio-clear">Clear answers</button></p>
    ${qs.map((q, qi) => `<fieldset class="panel" style="margin:0 0 10px"><legend><b>${qi + 1}.</b> ${esc(q.text)}</legend>
      ${q.answers.map((a, ai) => {
        const eff = a.effects.map(describeEffect).filter(Boolean).map((e) => e.text);
        return `<label style="display:block;margin:3px 0"><input type="radio" name="q${qi}" data-bind="bio" data-q="${qi}" value="${ai}" ${state.build.bio[qi] === ai ? 'checked' : ''}>
          ${esc(a.text)} <span class="muted" style="font-size:.85rem">${eff.length ? `- ${esc(eff.join(', '))}` : ''}</span></label>`;
      }).join('')}</fieldset>`).join('')}</div>`;
}

// ---------------------------------------------------------------- step: attributes
function stepStats() {
  const s = state.sheet;
  const r = state.build.rolls;
  return `<div class="panel"><h2>Attributes</h2>
    <p class="lead">The game adds a roll of 0-10 to each of the class's attributes and gives you ${ROLL_LIMITS.pool[0]}-${ROLL_LIMITS.pool[1]} points to place. Enter what you rolled, or pick Worst / Typical / Best above. Nothing may pass 100, and every point must be placed.</p>
    <div class="row">Bonus pool <span class="spin"><input type="number" min="${ROLL_LIMITS.pool[0]}" max="${ROLL_LIMITS.pool[1]}" value="${r.pool}" data-bind="pool" aria-label="Bonus pool"></span>
      <span class="pool num ${s.statPoolLeft === 0 ? 'done' : 'over'}">${s.statPoolLeft} left</span>
      <button class="btn small" type="button" data-act="stats-fill" ${s.statPoolLeft > 0 ? '' : 'disabled'} title="One point at a time into the lowest attribute - the game's own fallback rule">Place the rest (lowest first)</button>
      <button class="btn small" type="button" data-act="stats-clear">Take all points back</button></div>
    <div class="table-scroll"><table><thead><tr><th>Attribute</th><th class="r">Class</th><th class="r">Roll</th><th class="r">Placed</th><th class="r">Total</th><th>What it does</th></tr></thead><tbody>
    ${s.statRows.map((row) => `<tr><td>${STAT_LABELS[row.key]}</td><td class="r num">${row.base}</td>
      <td class="r"><input class="num" style="width:48px" type="number" min="0" max="10" value="${row.roll}" data-bind="stat-roll" data-key="${row.key}" aria-label="${STAT_LABELS[row.key]} roll"></td>
      <td class="r"><span class="spin"><button type="button" data-act="spend" data-key="${row.key}" data-d="-1" aria-label="Take a point from ${STAT_LABELS[row.key]}">-</button><span class="num" style="min-width:20px;text-align:center">${row.add}</span>
        <button type="button" data-act="spend" data-key="${row.key}" data-d="1" aria-label="Put a point in ${STAT_LABELS[row.key]}">+</button></span></td>
      <td class="r num ${row.capped ? 'bad' : ''}"><b>${row.value}</b></td><td class="muted" style="font-size:.84rem">${esc(statEffect(row.key, row.value))}</td></tr>`).join('')}
    </tbody></table></div></div>`;
}

function statEffect(key, v) {
  const s = state.sheet;
  const d = s.derived;
  switch (key) {
    case 'strength': return `Damage ${signed(d.damage)} (${s.overhaul ? 'overhaul' : 'DFU'}), carry ${d.encumbrance} kg`;
    case 'intelligence': return `Magicka ${d.magicka} (x${d.magickaMultiplier})`;
    case 'willpower': return `+${Math.floor(v / 10)} to every saving throw`;
    case 'agility': return `To hit ${signed(d.toHit)} (DFU); overhaul compares with the foe's Agility /4`;
    case 'endurance': return `${signed(d.hpPerLevel.modifier)} health per level, fatigue ${d.fatigue}`;
    case 'personality': return 'Prices, reactions and persuasion';
    case 'speed': return `Walk ${fmt1(d.walk)}, run ${fmt1(d.run)} m/s`;
    case 'luck': return 'A little of everything (to hit, crits under the overhaul)';
    default: return '';
  }
}

// ---------------------------------------------------------------- step: skills
function stepSkills() {
  const s = state.sheet;
  const tiers = [['primary', 'Primary'], ['major', 'Major'], ['minor', 'Minor'], ['misc', 'Miscellaneous']];
  return `<div class="panel"><h2>Skills</h2>
    <p class="lead">Primary skills start at ${TIER_BASE.primary}, major at ${TIER_BASE.major}, minor at ${TIER_BASE.minor}, each plus a roll of 0-3; every other skill rolls 3-6. Each of the three groups gets ${ROLL_LIMITS.groupPool} points that only its own skills may take. Biography bonuses are added on top.</p>
    <div class="row">${['primary', 'major', 'minor'].map((g) => `<span>${g[0].toUpperCase() + g.slice(1)} <span class="pool num ${s.groupLeft[g] === 0 ? 'done' : 'over'}">${s.groupLeft[g]} left</span></span>`).join('')}
      <button class="btn small" type="button" data-act="skills-fill" ${['primary', 'major', 'minor'].some((g) => s.groupLeft[g] > 0) ? '' : 'disabled'} title="Each group's points, one at a time into its lowest skill - the game's own fallback rule">Place the rest (lowest first)</button>
      <button class="btn small" type="button" data-act="skills-clear">Take all points back</button></div>
    <div class="table-scroll"><table><thead><tr><th>Skill</th><th>Governs</th><th class="r">Roll</th><th class="r">Placed</th><th class="r">Bio</th><th class="r">Total</th></tr></thead><tbody>
    ${tiers.map(([tier, label]) => {
      const rows = s.skillRows.filter((r) => r.tier === tier);
      return `<tr class="tier-head"><td colspan="6">${label}</td></tr>${rows.map((r) => {
        const [lo, hi] = tier === 'misc' ? ROLL_LIMITS.misc : ROLL_LIMITS.tier;
        const rollVal = tier === 'misc' ? r.rolled : r.rolled - TIER_BASE[tier];
        return `<tr><td>${esc(r.name)}</td><td class="muted">${STAT_SHORT[r.stat]}</td>
          <td class="r"><input class="num" style="width:48px" type="number" min="${lo}" max="${hi}" value="${rollVal}" data-bind="skill-roll" data-id="${r.id}" aria-label="${esc(r.name)} roll"></td>
          <td class="r">${tier === 'misc' ? '' : `<span class="spin"><button type="button" data-act="sspend" data-id="${r.id}" data-d="-1" aria-label="Take a point from ${esc(r.name)}">-</button><span class="num" style="min-width:20px;text-align:center">${r.add}</span><button type="button" data-act="sspend" data-id="${r.id}" data-d="1" aria-label="Put a point in ${esc(r.name)}">+</button></span>`}</td>
          <td class="r num">${r.bio ? signed(r.bio) : ''}</td><td class="r num"><b>${r.value}</b></td></tr>`;
      }).join('')}`;
    }).join('')}</tbody></table></div></div>`;
}

// ---------------------------------------------------------------- step: reflexes
function stepReflexes() {
  const r = state.build.reflexes;
  return `<div class="panel"><h2>Reflexes</h2>
    <p class="lead">Reflexes set how quickly enemies swing at you: each step from Average adds or removes 0.45 s to an enemy's melee timer. Higher reflexes means foes attack <b>more</b> often - a harder game, not a better character.</p>
    <div class="row">${REFLEXES.map((label, i) => `<button class="btn" type="button" data-act="reflexes" data-val="${i}" aria-pressed="${r === i}">${label}</button>`).join('')}</div>
    <p class="muted">Source: src/characters/enemyAttack.js resetMeleeTimer (MELEE_TIMER_REFLEX_MS = 450 per step).</p></div>`;
}

// ---------------------------------------------------------------- step: summary
function stepSummary() {
  const s = state.sheet;
  const custom = s.classInfo.isCustom;
  return `<div class="panel"><h2>${esc(s.classInfo.name)} · ${esc(s.race.name)}</h2>
    ${s.problems.length ? `<p class="bad">The game would not accept this character yet:</p><ul class="problems">${s.problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="good">The game would accept this character.</p>'}
    <p>${custom ? 'Use <b>Export class for DFO</b> to save the class; in DFO\'s custom-class builder, <b>Import</b> reads it back.' : 'This is a standard class: pick it from the class list in DFO.'}
      <b>Copy share link</b> gives a link to this exact plan.</p></div>
    <div class="panel"><h3>Attributes</h3><div class="vitals">${STAT_KEYS.map((k) => `<div class="vital"><div class="k">${STAT_LABELS[k]}</div><div class="v">${s.stats[k]}</div></div>`).join('')}</div></div>
    <div class="panel"><h3>Leveling skills</h3>
      <p class="muted" style="font-size:.86rem">Starting level-up sum ${s.leveling.startSum}. Level = floor((gained + 28) / 15): two points make level 2, then every 15. Uses below are what one raise costs now and at level ${s.level}.</p>
      <table><thead><tr><th>Skill</th><th class="r">Value</th><th class="r">Uses (lvl 1)</th><th class="r">Uses (lvl ${s.level})</th></tr></thead>
      <tbody>${s.leveling.usesTable.map((r) => `<tr><td>${esc(r.name)}</td><td class="r num">${r.value}</td><td class="r num">${r.uses}</td><td class="r num">${r.usesAtPlan}</td></tr>`).join('')}</tbody></table></div>
    ${weaponsPanel(s)}`;
}

function weaponsPanel(s) {
  const rules = s.overhaul ? 'pcaao' : 'dfu';
  return `<div class="panel"><h3>Weapons</h3>
    <p class="muted" style="font-size:.85rem">Bonus to hit / damage from race and Expertise, under ${s.overhaul ? 'DFO\'s combat overhaul (attribute-driven)' : 'Daggerfall Unity\'s rules (level-driven, at level ' + s.level + ')'}.</p>
    <div class="table-scroll"><table><thead><tr><th>Weapon</th><th class="r">Race</th><th class="r">Expertise</th><th class="r">Other rules</th></tr></thead><tbody>
    ${s.weapons.map((w) => {
      const now = w[rules];
      const other = w[rules === 'pcaao' ? 'dfu' : 'pcaao'];
      const pair = (x) => (x.toHit || x.damage ? `${signed(x.toHit)} / ${signed(x.damage)}` : '-');
      const sum = (x) => ({ toHit: x.race.toHit + x.expertise.toHit, damage: x.race.damage + x.expertise.damage });
      return `<tr><td>${esc(w.name)}${w.forbidden ? ' <span class="tag dis">forbidden</span>' : ''}${w.expert ? ' <span class="tag adv">expert</span>' : ''}</td>
        <td class="r num">${pair(now.race)}</td><td class="r num">${pair(now.expertise)}</td><td class="r num muted">${pair(sum(other))}</td></tr>`;
    }).join('')}</tbody></table></div></div>`;
}

// ---------------------------------------------------------------- the sheet (always visible)
function renderSheet() {
  const s = state.sheet;
  const d = s.derived;
  const order = { exploit: 0, trap: 1, online: 2, info: 3 };
  const notes = [...s.notes].sort((a, b) => order[a.kind] - order[b.kind]);
  const word = { exploit: 'exploit', trap: 'trap', online: 'online', info: 'note' };
  $('sheet').innerHTML = `
    <div class="panel"><h2>${esc(s.classInfo.name)} <span class="muted" style="font-size:.9rem">${esc(s.race.name)} · ${s.online ? 'online' : 'offline'}</span></h2>
      ${s.problems.length ? `<ul class="problems">${s.problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="good" style="margin:0">Ready to make in DFO.</p>'}</div>
    <div class="panel"><h3>At level 1</h3><div class="vitals">
      <div class="vital"><div class="k">Health</div><div class="v">${d.health}</div><div class="s">+${d.hpPerLevel.min}-${d.hpPerLevel.max}/level · ~${d.healthAtPlanLevel} at ${s.level}</div></div>
      <div class="vital"><div class="k">Magicka</div><div class="v">${d.magicka}</div><div class="s">x${d.magickaMultiplier} INT${d.mageryWindows.inSunlight !== d.magicka ? ` · ${d.mageryWindows.inSunlight} in sun` : ''}${d.mageryWindows.outOfSunlight !== d.magicka ? ` · ${d.mageryWindows.outOfSunlight} out of sun` : ''}</div></div>
      <div class="vital"><div class="k">Fatigue</div><div class="v">${d.fatigue}</div></div>
      <div class="vital"><div class="k">Carry</div><div class="v">${d.encumbrance}</div><div class="s">kg</div></div>
      <div class="vital"><div class="k">Damage</div><div class="v">${signed(d.damage)}</div><div class="s">${s.overhaul ? 'overhaul' : 'DFU'} (other: ${signed(d.damageOtherRules)})</div></div>
      <div class="vital"><div class="k">Rest / hour</div><div class="v">${d.healthPerRestHour}</div><div class="s">health · ${d.magickaPerRestHour} magicka</div></div>
    </div></div>
    <div class="panel"><h3>What the rules do with this build <span class="muted num">${notes.length}</span></h3>
      ${notes.map((n) => `<details class="note ${n.kind}" ${n.kind === 'exploit' || n.kind === 'trap' ? 'open' : ''}><summary><span class="kind ${n.kind}">${word[n.kind]}</span>${esc(n.title)}</summary>
        <p>${esc(n.body)}</p><div class="src">${esc(n.source)}</div></details>`).join('')}</div>
    <div class="panel"><h3>Resistances</h3>
      <p class="muted" style="font-size:.82rem">Paralysis, poison and disease need a <b>full</b> save to stop: about 20 points below the throw. Damage spells are scaled by the throw instead. Open a row to see how it is worked out.</p>
      ${s.resistances.map((r) => {
        const val = r.allOrNothing ? r.stopChance : 100 - r.damageTaken;
        const cls = val >= 66 ? '' : val >= 33 ? 'mid' : 'low';
        const head = r.allOrNothing ? `${r.immune ? 'immune' : `stops ${pct(r.stopChance)}`}` : `${r.immune ? 'immune' : `takes ${pct(r.damageTaken)} on average`}`;
        return `<details class="note"><summary>${esc(r.name)} <span class="num muted">· throw ${r.saving.immune ? 100 : r.saving.chance} · ${head}</span>
          <div class="bar ${cls}"><i style="width:${val}%"></i></div></summary>
          <ul class="steps-list">${r.gate.why ? `<li><b>${r.gate.immune ? 'Hard immunity' : 'No immunity'}:</b> ${esc(r.gate.why)}</li>` : ''}
          ${r.saving.steps.map((st) => `<li>${esc(st.label)}: <span class="num">${st.set != null ? `= ${st.set}` : signed(st.delta ?? st.value)}</span></li>`).join('')}</ul>
          <p class="muted" style="font-size:.8rem">Tested against ${esc(r.example)}.</p></details>`;
      }).join('')}</div>
    ${state.step === 'summary' ? '' : weaponsPanel(s)}`;
}

// ---------------------------------------------------------------- render
function render() {
  if (!state.data) return;
  renderSituation();
  renderActions();
  renderSteps();
  const step = { race: stepRace, class: stepClass, bio: stepBio, stats: stepStats, skills: stepSkills, reflexes: stepReflexes, summary: stepSummary }[state.step];
  const focusId = document.activeElement?.dataset?.bind ? { bind: document.activeElement.dataset.bind, key: document.activeElement.dataset.key ?? document.activeElement.dataset.slot ?? document.activeElement.dataset.id ?? '' } : null;
  $('step').innerHTML = state.sheet.ok ? step() : `<div class="panel">${esc(state.sheet.problems.join(' '))}</div>`;
  if (state.sheet.ok) renderSheet();
  if (focusId) {
    const el = [...document.querySelectorAll(`[data-bind="${focusId.bind}"]`)].find((e) => (e.dataset.key ?? e.dataset.slot ?? e.dataset.id ?? '') === focusId.key);
    if (el && el.type !== 'radio') el.focus();
  }
}

// ---------------------------------------------------------------- events
document.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const { act } = el.dataset;
  const d = Number(el.dataset.d ?? 0);
  switch (act) {
    case 'step': state.step = el.dataset.step; render(); window.scrollTo({ top: 0 }); return;
    case 'setting': {
      const key = el.dataset.key;
      const v = el.dataset.val;
      if (key === 'preset') { update((b) => { applyRollPreset(b, v); }); return; }
      update((b) => { b.settings[key] = v === 'true'; });
      return;
    }
    case 'gender': update((b) => { b.gender = el.dataset.val; }); return;
    case 'race': update((b) => { b.race = el.dataset.val; }); return;
    case 'class-mode': update((b) => { b.classMode = el.dataset.val; }); return;
    case 'class': update((b) => { b.classIndex = Number(el.dataset.val); b.bio = {}; b.skillSpend = {}; }); return;
    case 'to-custom': update((b) => {
      const c = state.data.classes[b.classIndex];
      const { advantages, disadvantages } = picksFromCareer(c);
      b.custom = { name: `${c.name} (custom)`.slice(0, 23), hp: c.hitPointsPerLevel, skills: [...c.primarySkills, ...c.majorSkills, ...c.minorSkills],
        stats: Object.fromEntries(STAT_KEYS.map((k) => [k, clamp(c[k], STAT_MIN, STAT_MAX)])), advantages, disadvantages, reps: { merchants: 0, peasants: 0, scholars: 0, nobility: 0, underworld: 0 } };
      b.classMode = 'custom';
    }); toast('Opened in the custom builder'); return;
    case 'hp': update((b) => { b.custom.hp = clamp(b.custom.hp + d, HP_MIN, HP_MAX); }); return;
    case 'cstat': update((b) => { b.custom.stats[el.dataset.key] = clamp(b.custom.stats[el.dataset.key] + d, STAT_MIN, STAT_MAX); }); return;
    case 'rep': update((b) => { b.custom.reps[el.dataset.key] = clamp((b.custom.reps[el.dataset.key] ?? 0) + d, -REP_MAX, REP_MAX); }); return;
    case 'pick-add': {
      const kind = el.dataset.kind;
      const p = state.pending[kind];
      const second = secondaryListFor(p.primary);
      const pick = { primary: p.primary, secondary: second ? (p.secondary || second[0]) : '' };
      const c = state.build.custom;
      const refusal = refusalFor(pick, kind, c.advantages, c.disadvantages);
      if (refusal) { state.refusal[kind] = refusal; render(); return; }
      state.pending[kind] = { primary: '', secondary: '' };
      state.refusal[kind] = '';
      update((b) => { (kind === 'advantage' ? b.custom.advantages : b.custom.disadvantages).push(pick); });
      return;
    }
    case 'pick-remove': update((b) => { (el.dataset.kind === 'advantage' ? b.custom.advantages : b.custom.disadvantages).splice(Number(el.dataset.i), 1); }); return;
    case 'bio-clear': update((b) => { b.bio = {}; }); return;
    case 'spend': update((b) => { const k = el.dataset.key; b.statSpend[k] = Math.max(0, (b.statSpend[k] ?? 0) + d); }); return;
    case 'stats-clear': update((b) => { b.statSpend = Object.fromEntries(STAT_KEYS.map((k) => [k, 0])); }); return;
    case 'sspend': update((b) => { const id = el.dataset.id; b.skillSpend[id] = Math.max(0, (b.skillSpend[id] ?? 0) + d); }); return;
    case 'stats-fill': update((b) => fillStats(b, state.sheet)); return;
    case 'skills-fill': update((b) => fillSkills(b, state.sheet)); return;
    case 'skills-clear': update((b) => { b.skillSpend = {}; }); return;
    case 'reflexes': update((b) => { b.reflexes = Number(el.dataset.val); }); return;
    case 'share': {
      save();
      try { await navigator.clipboard.writeText(location.href); toast('Link copied - it holds the whole plan'); } catch { toast('Copy the address bar: it holds the whole plan'); }
      return;
    }
    case 'save-file': download(`${(state.build.name || state.sheet.classInfo.name || 'plan').replace(/[^\w-]+/g, '_')}.dfo-plan.json`, JSON.stringify({ format: 'dfo-planner/build', build: state.build }, null, 2)); return;
    case 'open-file': $('file-input').click(); return;
    case 'export-class': {
      const c = state.build.custom;
      download(`${c.name.replace(/[^\w-]+/g, '_') || 'class'}.json`, JSON.stringify(classDocument(c), null, 2));
      toast(state.sheet.problems.length ? 'Exported - but DFO will refuse it until the problems are fixed' : 'Exported. In DFO: custom class builder → Import');
      return;
    }
    case 'reset':
      if (!confirm('Start a new plan? The current one stays in your share link history only.')) return;
      state.build = freshBuild();
      state.step = 'race';
      update(() => {});
      return;
    default: return;
  }
});

document.addEventListener('change', (ev) => {
  const el = ev.target;
  const bind = el.dataset?.bind;
  if (!bind) return;
  const n = Number(el.value);
  switch (bind) {
    case 'planLevel': update((b) => { b.settings.planLevel = clamp(Math.round(n) || 1, 1, 100); }); return;
    case 'custom-name': update((b) => { b.custom.name = el.value.slice(0, 23); }); return;
    case 'custom-hp': update((b) => { b.custom.hp = clamp(Math.round(n) || 8, HP_MIN, HP_MAX); }); return;
    case 'custom-stat': update((b) => { b.custom.stats[el.dataset.key] = clamp(Math.round(n) || STAT_MIN, STAT_MIN, STAT_MAX); }); return;
    case 'custom-skill': update((b) => { b.custom.skills[Number(el.dataset.slot)] = el.value === '' ? null : Number(el.value); b.skillSpend = {}; }); return;
    case 'rep': update((b) => { b.custom.reps[el.dataset.key] = clamp(Math.round(n) || 0, -REP_MAX, REP_MAX); }); return;
    case 'pick-primary': state.pending[el.dataset.kind] = { primary: el.value, secondary: '' }; state.refusal[el.dataset.kind] = ''; render(); return;
    case 'pick-secondary': state.pending[el.dataset.kind].secondary = el.value; state.refusal[el.dataset.kind] = ''; render(); return;
    case 'bio': update((b) => { b.bio = { ...b.bio, [el.dataset.q]: Number(el.value) }; }); return;
    case 'pool': update((b) => { b.rolls.pool = clamp(Math.round(n) || 6, ...ROLL_LIMITS.pool); b.rolls.preset = 'custom'; }); return;
    case 'stat-roll': update((b) => { b.rolls.stats[el.dataset.key] = clamp(Math.round(n) || 0, ...ROLL_LIMITS.stat); b.rolls.preset = 'custom'; }); return;
    case 'skill-roll': update((b) => {
      const id = Number(el.dataset.id);
      const misc = state.sheet.skillRows[id].tier === 'misc';
      b.rolls.skills = { ...b.rolls.skills, [id]: clamp(Math.round(n), ...(misc ? ROLL_LIMITS.misc : ROLL_LIMITS.tier)) };
    }); return;
    default: return;
  }
});

$('file-input').addEventListener('change', async (ev) => {
  const file = ev.target.files?.[0];
  ev.target.value = '';
  if (!file) return;
  try {
    const json = JSON.parse(await file.text());
    if (json.format === 'dfo-planner/build') {
      state.build = decodeBuild(encodeBuild(json.build));
      toast('Plan opened');
    } else {
      const custom = customFromClassDocument(json);
      state.build.custom = custom;
      state.build.classMode = 'custom';
      state.step = 'class';
      toast(`Class "${custom.name}" opened in the custom builder`);
    }
    update(() => {});
  } catch (e) {
    toast(e.message || 'That file could not be read');
  }
});

// ---------------------------------------------------------------- start
async function start() {
  try {
    const res = await fetch('data/game-data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    state.data = await res.json();
  } catch {
    $('step').innerHTML = `<div class="panel empty"><h2>The planner needs your game data</h2>
      <p>The class and biography tables come from your own copy of Daggerfall. Run this once from the DFO folder:</p>
      <p><code>node planner/tools/extract-game-data.mjs</code></p>
      <p class="muted">It reads ARENA2 through DFO Online's own file readers and writes planner/data/game-data.json.</p></div>`;
    return;
  }
  const hash = location.hash.match(/^#b=(.+)$/);
  try {
    let stored = null;
    try { stored = localStorage.getItem(STORE_KEY); } catch { /* storage blocked: start fresh */ }
    if (hash) state.build = decodeBuild(hash[1]);
    else if (stored) state.build = decodeBuild(encodeBuild(JSON.parse(stored)));
    else state.build = freshBuild();
  } catch (e) {
    toast(`Could not open that plan: ${e.message}`);
  }
  state.sheet = compute(state.build, state.data);
  render();
}
start();

// Exposed for the console and for debugging a plan.
window.dfoPlanner = { state, compute, decodeCareer };
