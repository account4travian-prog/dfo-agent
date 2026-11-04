const root = document.querySelector('.quest-browser');
const dataUrl = `${root?.dataset.assets ?? '../quests/'}quests.json`;
const searchInput = document.getElementById('qb-search');
const categorySelect = document.getElementById('qb-category');
const kindSelect = document.getElementById('qb-kind');
const resultsList = document.getElementById('qb-results');
const count = document.getElementById('qb-count');
const detail = document.getElementById('qb-detail');
let data = null;
let state = { query: '', category: '', kind: '', selected: null };

const categoryGuides = {
  "main": "Main-story steps are fixed chapters, not generated errands. Read each chapter's journal entry before travelling; several chapters have their own clock, and refusing a ruler's request can close that branch permanently.",
  "questlines": "Questline steps run in order and each one names an explicit objective. Check the Quests tab for what the line is waiting on; a held step waits rather than failing. The step's outcome and reward card decide what the line remembers.",
  "fighters": "Most Fighters Guild work is a hunt: the journal names a house or dungeon, and the target is inside. Clear the rooms methodically, keep the quest target from escaping, and return to the hall for the reward card.",
  "mages": "Mages Guild work often sends you to fetch an item from a dungeon. Search containers, dressed rooms and behind secret doors; bring Open or a lockpick. A quest item is not vendor loot - do not sell it.",
  "thieves": "Thieves Guild work is theft, smuggling or quiet persuasion. Watch the law and the watch; a delivery can be failed by a fight or a guard. Keep the quest item on you until the hand-off.",
  "darkBrotherhood": "Brotherhood contracts are executions. The target may be in a town house or a dungeon; guards and witnesses can turn a clean job into a crime. Finish the contract and leave before the watch closes in.",
  "knightly": "Knightly orders send you after traitors, monsters and the occasional rescue. Expect a dungeon and a named foe; a failed rescue or a broken oath costs standing with the order.",
  "temples": "Temple work ranges from exorcism to relic recovery. Undead and hidden shrines are common; bring healing and a way to open locked doors. The temple's standing is the reward that outlasts the gold.",
  "nobles": "Noble work is delivery, smuggling and discreet violence. The offer often hides a reputation cost; read the questor's faction and the journal before you agree. A tight clock is normal.",
  "commoners": "Commoner quests are local problems: a missing person, a beast in a house, a debt. Ask directions in town, search the named building, and return to the person who asked.",
  "merchants": "Merchant and innkeeper work is practical: deliver goods, recover property, protect a customer. Shop hours and NPC locations matter; the journal names the town and building.",
  "covens": "Coven work is ingredient-gathering, escorting and settling feuds. The sites are usually remote; expect a dungeon or a coven hold and a named enemy.",
  "vampires": "Vampire-clan work arrives by letter and is judged by the bloodline. Rival clans, hunters and the Masquerade all matter; a broken order can cost you the clan's favour.",
  "daedric": "A Daedric Prince asks for one thing. The request is usually a kill or a delivery, and refusing can end the encounter; the Prince's reward is often an artifact or a permanent effect.",
  "cures": "The cure quests begin with a hunter's letter. There are several routes through each; the journal tracks which one you chose, and the clock is a deadline rather than a delay.",
  "tutorial": "The opening lesson is fixed: follow the journal out of Privateer's Hold. Search the rooms, learn the controls, and leave when the journal says the way is open."
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const lower = value => String(value ?? '').toLowerCase();
const list = (items, render) => items?.length ? items.map(render).join('') : '<li class="qb-muted">None recorded.</li>';

function matches(quest) {
  if (state.category && quest.category !== state.category) return false;
  if (state.kind && quest.kind !== state.kind) return false;
  if (!state.query) return true;
  return lower(quest.search).includes(state.query) || lower(quest.name).includes(state.query);
}

function renderList() {
  const shown = data.quests.filter(matches);
  count.textContent = `${shown.length} of ${data.quests.length} quests`;
  resultsList.innerHTML = shown.length ? shown.map(q => `<li><button type="button" class="qb-result${q.id === state.selected ? ' is-selected' : ''}" data-quest="${esc(q.id)}"><span class="qb-result-name">${esc(q.name)}</span><span class="qb-result-meta">${esc(q.group)}${q.questline ? ` · step ${q.questline.step}/${q.questline.stepCount}` : ''}</span></button></li>`).join('') : '<li class="qb-muted">No quest matches that search.</li>';
  if (state.selected && !shown.some(q => q.id === state.selected)) {
    state.selected = shown[0]?.id ?? null;
    if (state.selected) history.replaceState(null, '', `#${state.selected}`);
  }
  if (!state.selected && shown[0]) state.selected = shown[0].id;
  renderDetail();
}

function renderDetail() {
  const quest = data.quests.find(q => q.id === state.selected);
  if (!quest) {
    detail.innerHTML = '<h2>Choose a quest</h2><p>Search or pick a category to begin.</p>';
    return;
  }
  const category = data.categories.find(c => c.id === quest.category);
  const categoryLabel = category?.label ?? quest.group;
  const kindLabel = quest.kind === 'main' ? 'Main quest' : quest.kind === 'questline' ? 'Questline step' : quest.kind === 'cure' ? 'Cure' : quest.kind === 'tutorial' ? 'Tutorial' : 'Generated quest';
  const line = quest.questline ? data.lines.find(l => l.id === quest.questline.id) : null;
  const giver = quest.kind === 'main' ? 'Main story: the journal names the questor' : quest.kind === 'questline' ? (line?.giver ?? quest.giver) : quest.kind === 'cure' ? "A hunter's letter" : quest.kind === 'tutorial' ? "Privateer's Hold" : quest.giver;
  const steps = quest.kind === 'generated' ? generatedSteps(quest) : quest.objectives.map((o, i) => ({ text: o.text, n: i + 1 }));
  detail.innerHTML = `<div class="qb-detail-head">${quest.guide ? `<p class="qb-guide-link"><a href="../${esc(quest.guide)}">Read the full guide to this quest →</a></p>` : quest.patternGuide ? `<p class="qb-guide-link"><a href="../${esc(quest.patternGuide)}">Read the full pattern guide →</a></p>` : ''}<p class="eyebrow">${esc(categoryLabel.toLowerCase() === kindLabel.toLowerCase() ? kindLabel : categoryLabel + ' · ' + kindLabel)}</p><h2>${esc(quest.name)}</h2><p class="qb-detail-sub">${esc(category?.blurb ?? '')}</p></div>
<div class="qb-facts"><table><caption>Quest facts</caption><tbody>
<tr><th scope="row">Questor / giver</th><td>${esc(giver)}</td></tr>
<tr><th scope="row">Requirement</th><td>${esc(quest.requirement)}</td></tr>
<tr><th scope="row">Time limit</th><td>${esc(quest.timeLimit)} <small>played time; read the journal's own clock</small></td></tr>
<tr><th scope="row">Where</th><td>${esc(quest.where)}</td></tr>
<tr><th scope="row">Reward</th><td>${esc(quest.reward)}</td></tr>
${quest.questline ? `<tr><th scope="row">Line</th><td>${esc(line?.title ?? quest.questline.title)} · step ${quest.questline.step} of ${quest.questline.stepCount}</td></tr>` : ''}
<tr><th scope="row">Source</th><td><code>${esc(quest.source ?? 'quest pack')}</code></td></tr>
</tbody></table></div>
${line ? `<div class="qb-line"><strong>${esc(line.title)}</strong><p>${esc(line.lead)}</p><p class="qb-muted">Opens: ${esc(openLabel(line.opens))}. Giver: ${esc(line.giver)}</p></div>` : ''}
${quest.notes?.length ? `<div class="qb-callout"><strong>Source notes</strong><ul>${list(quest.notes, n => `<li>${esc(n)}</li>`)}</ul></div>` : ''}
<section class="qb-pattern"><h3>Pattern guide: ${esc(category?.label ?? quest.group)}</h3><p>${esc(categoryGuides[quest.category] ?? categoryGuides.fighters)}</p></section>
<section><h3>${quest.kind === 'generated' ? 'How to run this kind of quest' : 'Quick path'}</h3><ol class="qb-steps">${list(steps, s => `<li>${esc(s.text)}</li>`)}</ol></section>
${quest.outcomes?.length ? `<section><h3>Outcomes</h3><ul class="qb-outcomes">${list(quest.outcomes, o => `<li class="${o.failure ? 'is-failure' : ''}"><span>${o.failure ? 'Failure' : 'Success'}</span> ${esc(o.text)}${o.pay ? ` <em>(${esc(o.pay)} pay)</em>` : ''}</li>`)}</ul></section>` : ''}
<section><h3>Before you accept</h3><ul><li>Read the offer twice and note the region, town, building, target and time in the journal.</li><li>Generated quests choose a different site for each character. The journal names it; there is no fixed map pin.</li><li>Carry Open or a lockpick for dungeon work, healing for fights and an empty carry weight for quest items.</li><li>Online, a failed quest costs no faction standing; a deliberate betrayal or crime still has its own consequences.</li></ul></section>
<section><h3>If it goes wrong</h3><ol class="qb-steps"><li>Re-read the latest journal entry; it names the current place or person.</li><li>Check the Quests tab / Questlines list for what the step is waiting on.</li><li>Inside a dungeon, check the 3D map for a secret door and search containers and dressed rooms.</li><li>Confirm you are in the right private instance, then leave and re-enter once.</li><li>If the target is gone or the item vanished, the quest may be broken; note the quest name, source file and what you saw and report it.</li></ol></section>
<p class="qb-related">Related: <a href="../reference/quest-rewards/">Quest rewards</a> · <a href="../reference/questline-ladder/">Questline ladder</a> · <a href="../reference/how-this-guide-is-checked/">How this guide is checked</a></p>`;
}

function generatedSteps(quest) {
  const out = [{ text: 'Read the offer and journal. Note the region, town or dungeon, the target and the time you have.' },
    { text: `Travel to the ${quest.where}. A quest dungeon can be entered as your private instance; choose it when the door asks.` }];
  if (quest.targetFoes?.length) out.push({ text: `Find and defeat the named target${quest.targetFoes.length > 1 ? 's' : ''}: ${quest.targetFoes.join(', ')}. Stay until the journal updates.` });
  if (quest.targetItems?.length) out.push({ text: `Find the quest item (${quest.targetItems.join(', ')}) in the dungeon or building. Search secret doors, containers and dressed rooms; do not sell it.` });
  if (quest.targetPeople?.length) out.push({ text: 'Find the person the journal names. Ask directions in town or use the journal\'s building hint.' });
  out.push({ text: 'Return to the questor and report. Read the reward card before you choose a piece.' });
  return out;
}

function openLabel(opens = {}) {
  const bits = [];
  if (opens.level) bits.push(`level ${opens.level}`);
  if (opens.renown) bits.push(`Renown ${opens.renown}`);
  if (opens.after) bits.push(`after ${opens.after}`);
  if (opens.online) bits.push('online');
  if (opens.account) bits.push('registered account');
  if (opens.event) bits.push(`event: ${opens.event}`);
  return bits.join(', ') || 'always';
}

function select(id) {
  state.selected = id;
  if (location.hash.slice(1) !== id) history.pushState(null, '', `#${id}`);
  renderList();
  const selected = document.querySelector(`[data-quest="${CSS.escape(id)}"]`);
  selected?.scrollIntoView({ block: 'nearest' });
}

root.addEventListener('click', event => {
  const chip = event.target.closest('[data-category]');
  if (chip) {
    state.category = state.category === chip.dataset.category ? '' : chip.dataset.category;
    categorySelect.value = state.category;
    document.querySelectorAll('[data-category]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.category === state.category)));
    renderList();
    return;
  }
  const result = event.target.closest('[data-quest]');
  if (result) select(result.dataset.quest);
});
searchInput.addEventListener('input', () => { state.query = lower(searchInput.value.trim()); renderList(); });
categorySelect.addEventListener('change', () => {
  state.category = categorySelect.value;
  document.querySelectorAll('[data-category]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.category === state.category)));
  renderList();
});
kindSelect.addEventListener('change', () => { state.kind = kindSelect.value; renderList(); });

window.addEventListener('popstate', () => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (data?.quests.some(quest => quest.id === id)) { state.selected = id; renderList(); }
});

fetch(dataUrl).then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status)))).then(json => {
  data = json;
  if (location.hash) {
    const id = decodeURIComponent(location.hash.slice(1));
    state.selected = data.quests.some(q => q.id === id) ? id : null;
  }
  renderList();
}).catch(error => {
  detail.innerHTML = `<h2>Quest data did not load</h2><p>The quest index could not be read (${esc(error.message)}). The <noscript> list below is the fallback.</p>`;
});
