/**
 * Quest inventory extractor for the DFO Online Handbook.
 *
 * Reads the pinned Daggerfall Unity quest pack vendored at
 * upstream/snapshot-e4f093166/vendor/dfu-quests (265 quest sources + the two quest lists) and the port's online
 * questline data (14 lines, 39 quest scripts, their sheets and the main-quest sheets), and writes one stable JSON
 * snapshot to handbook/facts/quests.json.
 *
 * Why handbook/facts/: it is a generated, rerunnable snapshot of pinned input, exactly like facts.json and
 * tables.json — evidence the build and future page generation consume, never hand-edited. It is NOT numeric game
 * facts, hence its own file name quests.json rather than being mixed into facts.json.
 *
 * No dependencies: only Node built-ins. Ids are stable: a quest's id is its source filename without `.txt`
 * (e.g. `S0000001`, `QLBD01`, `00B00Y00`, `_BRISEN`), a questline's id is the `id` in qlLines.js.
 */
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SCHEMA_VERSION = 1;
export const SNAPSHOT_COMMIT = 'e4f093166';
export const DEFAULT_PACK_DIR = 'upstream/snapshot-e4f093166/vendor/dfu-quests';
export const DEFAULT_SRC_DIR = 'upstream/snapshot-e4f093166/src';
// Public, committed index (no copied quest dialogue). The full extraction with message text is local evidence only.
export const DEFAULT_OUTPUT = 'handbook/facts/quests.json';
export const DEFAULT_FULL_OUTPUT = 'audit/work/quests-full.json';
export const PACK_PROVENANCE = Object.freeze({
  repository: 'https://github.com/Interkarma/daggerfall-unity',
  commit: '81e89e90c27bc3c1a7a61871e545fad129174dec',
  license: 'MIT (Daggerfall Unity, Copyright (C) 2009-2023 Daggerfall Workshop / Gavin Clayton and contributors)',
});

const root = fileURLToPath(new URL('../../', import.meta.url));
const oneLine = value => String(value ?? '').replace(/\r\n?/g, '\n').split('\n').map(line => line.trimEnd()).join('\n').trim();
const lines = value => String(value ?? '').replace(/\r\n?/g, '\n').split('\n');
const numberOrNull = value => /^\d+$/.test(String(value ?? '').trim()) ? Number(String(value).trim()) : null;

// Header comments carry the quest's social metadata; keep every other comment as a note.
const HEADER_KEYS = new Map([
  ['Quest', 'questPath'],
  ['StartsBy', 'startsBy'],
  ['Questee', 'questee'],
  ['Questor', 'questor'],
  ['Repute', 'repute'],
  ['QuestId', 'questId'],
]);

export function parseQuestFile(source, filename) {
  const text = String(source ?? '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const allLines = text.split('\n');
  const errors = [];
  const record = {
    id: filename.replace(/\.txt$/i, ''),
    filename,
    displayName: null,
    startsBy: null,
    questee: null,
    questor: null,
    repute: null,
    questId: null,
    declaredMessages: null,
    notes: [],
    messages: [],
    journal: null,
    tasks: [],
    variables: [],
    clocks: [],
    timeLimit: null,
    resources: { items: [], persons: [], places: [], foes: [] },
    qbnOther: [],
    objectiveSummary: null,
    reward: { gold: false, items: [], summary: 'no item reward declared' },
    parseErrors: errors,
  };

  // Header: comment lines before the first structural line.
  for (const line of allLines) {
    if (!line.startsWith('--')) break;
    const match = line.match(/^--\s*([A-Za-z]+):\s*(.*)$/);
    if (match && HEADER_KEYS.has(match[1])) {
      const key = HEADER_KEYS.get(match[1]);
      record[key] = match[2].trim() || null;
      continue;
    }
    const messageCount = line.match(/^--\s*Main story quest\.?\s*$/i);
    if (messageCount) {
      record.notes.push('Main story quest');
      continue;
    }
    const note = line.replace(/^--\s?/, '').trim();
    if (note) record.notes.push(note);
  }

  // Structural single-line fields can appear anywhere before QRC.
  const beforeQrc = text.split(/^QRC:\s*$/m)[0];
  const declared = beforeQrc.match(/^Messages:\s*(\d+)\s*$/m);
  if (declared) record.declaredMessages = Number(declared[1]);
  const displayName = beforeQrc.match(/^DisplayName:\s*(.*)$/m);
  if (displayName && displayName[1].trim()) record.displayName = displayName[1].trim();
  const questName = beforeQrc.match(/^Quest:\s*(\S+)\s*$/m);
  if (questName) record.questId ||= questName[1];

  const qrcStart = text.search(/^QRC:\s*$/m);
  const qbnStart = text.search(/^QBN:\s*$/m);
  if (qrcStart < 0) errors.push('missing QRC section');
  if (qbnStart < 0) errors.push('missing QBN section');
  const qrc = qrcStart < 0 ? '' : text.slice(qrcStart, qbnStart > qrcStart ? qbnStart : undefined);
  const qbn = qbnStart < 0 ? '' : text.slice(qbnStart);

  record.messages = parseMessages(qrc, errors);
  record.messageCount = record.messages.length;
  record.messageCounts = record.messages.reduce((counts, message) => {
    counts[message.key] = (counts[message.key] ?? 0) + 1;
    return counts;
  }, {});
  record.journal = journalOf(record.messages);
  record.journalMessage = journalMessageOf(record.messages);
  const qbnData = parseQbn(qbn, errors);
  record.tasks = qbnData.tasks;
  record.variables = qbnData.variables;
  record.clocks = qbnData.clocks;
  record.resources = qbnData.resources;
  record.qbnOther = qbnData.other;
  record.timeLimit = timeLimitOf(qbnData);
  record.reward = rewardOf(qbnData);
  record.objectiveSummary = objectiveSummaryOf(record);
  return record;
}

// QRC message panels: `Key: [id]` or `Message:  id`, body until the next panel or comment.
export function parseMessages(section, errors = []) {
  const messages = [];
  let current = null;
  const flush = () => {
    if (!current) return;
    const text = current.lines.map(line => line.replace(/^\s*<ce>\s?/, '').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
    const message = { key: current.key, id: current.id };
    const variants = text.split(/\n\s*<--->\s*\n/).map(part => part.trim()).filter(Boolean);
    if (variants.length > 1) message.variants = variants;
    message.text = text;
    messages.push(message);
    current = null;
  };
  for (const raw of lines(section)) {
    const line = raw.replace(/\r$/, '');
    if (/^\s*QRC:\s*$/.test(line)) continue; // the section marker, not a panel
    const header = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(?:\[(\d+)\]|(\d+))?\s*$/);
    if (header) {
      flush();
      current = { key: header[1], id: numberOrNull(header[2] ?? header[3]), lines: [] };
      continue;
    }
    if (!current) continue;
    if (/^\s*--/.test(line)) {
      flush();
      continue;
    }
    current.lines.push(line);
  }
  flush();
  return messages;
}

// The panel a journal line came from, by id only, so the public index can point at it without copying its text.
export function journalMessageOf(messages) {
  const message = messages.find(candidate => candidate.key === 'QuestLogEntry')
    ?? messages.find(candidate => /^%qdt:/i.test((candidate.text ?? '').trim()));
  return message ? { key: message.key, id: message.id } : null;
}

// The player-facing journal line: the QuestLogEntry panel, else the first panel that starts with the %qdt marker.
export function journalOf(messages) {
  const entry = messages.find(message => message.key === 'QuestLogEntry');
  const source = entry ?? messages.find(message => /^%qdt:/i.test((message.text ?? '').trim()));
  if (!source) return null;
  const text = String(source.text ?? '').replace(/^%qdt:\s*/i, '').trim();
  return text || null;
}

// QBN: resource declarations, variables, clocks and `task:` blocks with their actions.
export function parseQbn(section, errors = []) {
  const data = { resources: { items: [], persons: [], places: [], foes: [] }, tasks: [], variables: [], clocks: [], other: [] };
  let current = null;
  for (const raw of lines(section)) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trim().startsWith('--')) continue;
    if (/^QBN:\s*$/.test(line.trim())) continue;
    const task = line.match(/^(\S+)\s+task:\s*$/);
    if (task) {
      current = { name: task[1], actions: [] };
      data.tasks.push(current);
      continue;
    }
    if (/^\s/.test(line)) {
      if (current) current.actions.push(line.trim());
      else data.other.push(line.trim());
      continue;
    }
    const variable = line.match(/^variable\s+(\S+)\s*$/);
    if (variable) {
      data.variables.push(variable[1]);
      current = null;
      continue;
    }
    const declaration = line.match(/^(Item|Person|Place|Foe|Clock)\s+(.+)$/);
    if (declaration) {
      current = null;
      const [, type, rest] = declaration;
      const name = rest.split(/\s+/)[0];
      const entry = { name, raw: rest.trim() };
      if (type === 'Clock') {
        Object.assign(entry, parseClock(rest));
        data.clocks.push(entry);
      } else if (type === 'Item') {
        const kind = rest.trim().split(/\s+/)[1] ?? null;
        data.resources.items.push({ ...entry, kind });
      } else if (type === 'Foe') {
        const kind = rest.trim().replace(/^\S+\s+is\s+/, '').trim() || null;
        data.resources.foes.push({ ...entry, kind });
      } else if (type === 'Person') {
        data.resources.persons.push(entry);
      } else {
        data.resources.places.push(entry);
      }
      continue;
    }
    // Top-level action lines (start timer, dialog link, ...) outside a task block.
    current = null;
    data.other.push(line.trim());
  }
  return data;
}

// Clock <name> <start> <end> [flag N] [range a b]; times are hh:mm or d.hh:mm.
export function parseClock(rest) {
  const tokens = rest.trim().split(/\s+/);
  const name = tokens.shift();
  const start = tokens.shift() ?? null;
  const end = tokens.shift() ?? null;
  const flagIndex = tokens.indexOf('flag');
  const rangeIndex = tokens.indexOf('range');
  return {
    name,
    start,
    end,
    flag: flagIndex >= 0 ? numberOrNull(tokens[flagIndex + 1]) : null,
    range: rangeIndex >= 0 ? [numberOrNull(tokens[rangeIndex + 1]), numberOrNull(tokens[rangeIndex + 2])] : null,
    raw: rest.trim(),
  };
}

function timeLimitOf(qbn) {
  const actions = [...qbn.tasks.flatMap(task => task.actions), ...qbn.other];
  const started = actions.map(action => action.match(/^start timer\s+(\S+)/)?.[1]).filter(Boolean);
  const clock = qbn.clocks.find(candidate => started.includes(candidate.name))
    ?? qbn.clocks.find(candidate => candidate.range)
    ?? null;
  if (!clock) return null;
  return {
    clock: clock.name,
    start: clock.start,
    end: clock.end,
    minDays: clock.range ? clock.range[0] : null,
    maxDays: clock.range ? clock.range[1] : null,
    raw: clock.raw,
  };
}

function rewardOf(qbn) {
  const items = qbn.resources.items;
  const gold = items.some(item => /\bgold\b/i.test(item.raw));
  const namedItems = items.filter(item => !/^_/.test(item.name) && !/\bgold\b/i.test(item.raw)).map(item => item.name);
  const summary = gold
    ? namedItems.length ? 'gold reward declared; other item declarations listed' : 'gold reward declared'
    : namedItems.length ? 'item declarations (no gold item declared)' : 'no item reward declared';
  return { gold, items: namesOf(items), namedItems, summary };
}
const namesOf = entries => entries.map(entry => entry.name);

function objectiveSummaryOf(record) {
  const journal = record.journal;
  if (journal) {
    const cleaned = journal.replace(/^%qdt:\s*/i, '').replace(/\s+/g, ' ').trim();
    return cleaned.length > 240 ? `${cleaned.slice(0, 237)}...` : cleaned;
  }
  if (record.tasks.length) return record.tasks.map(task => task.name).join(', ');
  return null;
}

// A sheet's objectives are the authored, player-facing objectives; prefer them over a narrative journal entry.
function sheetObjectiveSummary(sheet) {
  const texts = (sheet?.objectives ?? []).map(objective => objective.text).filter(Boolean);
  if (!texts.length) return null;
  const joined = texts.join('; ').replace(/\s+/g, ' ').trim();
  return joined.length > 240 ? `${joined.slice(0, 237)}...` : joined;
}

// Main-quest and questline rewards are the sheet's pay bands and named outcomes, not QBN item placeholders.
function attachSheet(record, sheet) {
  record.sheet = sheet;
  const summary = sheetObjectiveSummary(sheet);
  if (summary) record.objectiveSummary = summary;
  const pay = [...new Set((sheet?.outcomes ?? []).map(outcome => outcome.pay).filter(Boolean))];
  const named = (sheet?.outcomes ?? []).flatMap(outcome => outcome.named ? [outcome.named.name] : []);
  record.reward.sheetPay = pay;
  record.reward.sheetNamed = [...new Set(named)];
  if (pay.length) record.reward.summary += `; sheet pay: ${pay.join(', ')}`;
  if (record.reward.sheetNamed.length) record.reward.summary += `; named: ${record.reward.sheetNamed.join(', ')}`;
}

// QuestList rows: name, group, membership, minReq, flag, notes (a leading '-' disables the row).
export function parseQuestList(source, listSource = 'Classic') {
  const rows = new Map();
  for (const raw of lines(source)) {
    const line = raw.trim();
    if (!line || line.startsWith('--') || line.startsWith('schema:')) continue;
    const disabled = line.startsWith('-');
    const body = disabled ? line.slice(1) : line;
    if (!/^[A-Za-z0-9$_-]+,/.test(body)) continue;
    const parts = body.split(',').map(part => part.trim());
    const [name, group, membership, minReq, flag] = parts;
    const notes = parts.slice(5).filter(Boolean).join(', ');
    if (!name || !group) continue;
    rows.set(name, {
      name,
      group,
      membership: membership || null,
      minReq: numberOrNull(minReq),
      flag: flag || null,
      notes: notes || null,
      disabled,
      listSource,
    });
  }
  return [...rows.values()];
}

export const MEMBERSHIP_CODES = Object.freeze({
  N: 'non-member or any', M: 'member or male', F: 'female', P: 'prospect',
  T: 'Akatosh', A: 'Arkay', D: 'Dibella', J: 'Julianos', K: 'Kynareth', R: 'Mara', S: 'Stendarr', Z: 'Zenithar',
});
export const FLAG_CODES = Object.freeze({ '0': 'none', '1': 'one-time quest', X: 'adult content' });
export const groupLabel = group => String(group ?? '').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').trim();

const SET_SOCIAL = new Set(['Commoners', 'Merchants', 'Nobility', 'Scholars', 'Underworld', 'Vampires', 'Werewolves', 'Witches']);

async function readOrderedTextFiles(directory) {
  const files = (await readdir(directory)).filter(file => file.endsWith('.txt')).sort();
  const records = [];
  for (const file of files) records.push({ file, text: await readFile(join(directory, file), 'utf8') });
  return records;
}

// Evaluate the port's questline lines (their titles are i18n functions, so call them).
async function collectQuestlines(srcDir) {
  const { sourceContext } = await import('./source-context.mjs');
  const dfo = sourceContext(resolve(root, srcDir));
  const module = await dfo('systems/questlines/qlLines.js');
  const lines = module.QL_LINES.map(line => ({
    id: line.id,
    group: line.group,
    tier: line.tier,
    title: typeof line.title === 'function' ? line.title() : line.title,
    lead: typeof line.lead === 'function' ? line.lead() : line.lead,
    giver: typeof line.giver === 'function' ? line.giver() : line.giver,
    opens: { ...line.opens },
    steps: line.steps.map((step, index) => ({
      quest: step.quest,
      title: typeof step.title === 'function' ? step.title() : step.title,
      step: index + 1,
      needs: step.needs ? [...step.needs] : undefined,
    })),
    stepCount: line.steps.length,
  }));
  return { lines, sheets: await readSheetMap(join(resolve(root, srcDir), 'systems/questlines/sheets/questlines.json')) };
}

async function readSheetMap(file) {
  const data = JSON.parse((await readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
  const map = new Map();
  for (const sheet of data.sheets ?? []) map.set(sheet.quest, trimSheet(sheet));
  return map;
}

// Keep sheet fields that a page generator needs, without parser-only power fields.
function trimSheet(sheet) {
  const trimmed = {};
  if (Array.isArray(sheet.objectives)) trimmed.objectives = sheet.objectives.map(objective => ({
    id: objective.id,
    text: objective.text,
    ...(objective.optional ? { optional: true } : {}),
  }));
  if (sheet.success) trimmed.success = sheet.success;
  if (Array.isArray(sheet.outcomes)) trimmed.outcomes = sheet.outcomes.map(outcome => ({
    id: outcome.id,
    text: outcome.text,
    pay: outcome.pay ?? null,
    ...(outcome.failure ? { failure: true } : {}),
    ...(outcome.named ? { named: outcome.named } : {}),
  }));
  if (Array.isArray(sheet.branches)) trimmed.branches = sheet.branches.map(branch => ({
    id: branch.id,
    text: branch.text,
    choices: (branch.choices ?? []).map(choice => ({ id: choice.id, text: choice.text })),
  }));
  return trimmed;
}

// Group for files the quest lists do not cover: main quests from their sheets, then the known families.
function fallbackGroup(id, mainSheets) {
  if (mainSheets.has(id)) return { raw: 'MainQuest', label: 'Main quest', source: 'main-quest-sheet' };
  if (/^\$CURE/i.test(id)) return { raw: 'Cure', label: 'Cure quest', source: 'file-class' };
  if (id === '_TUTOR__') return { raw: 'Tutorial', label: 'Tutorial', source: 'file-class' };
  if (/^__DEMO/i.test(id)) return { raw: 'Demo', label: 'Demo quest', source: 'file-class' };
  return { raw: 'Unlisted', label: 'Unlisted', source: 'unclassified' };
}

export async function collectQuestData({
  packDir = DEFAULT_PACK_DIR,
  srcDir = DEFAULT_SRC_DIR,
} = {}) {
  const pack = resolve(root, packDir);
  const src = resolve(root, srcDir);
  const errors = [];
  const listRows = [
    ...parseQuestList(await readFile(join(pack, 'Tables/QuestList-Classic.txt'), 'utf8'), 'Classic'),
    ...parseQuestList(await readFile(join(pack, 'Tables/QuestList-DFU.txt'), 'utf8'), 'DFU'),
  ];
  const listByName = new Map(listRows.map(row => [row.name, row]));
  const { lines: questlines, sheets: questlineSheets } = await collectQuestlines(srcDir);
  const mainSheets = await readSheetMap(join(src, 'systems/questlines/sheets/mainQuest.json'));

  const questlineByQuest = new Map();
  for (const line of questlines) for (const step of line.steps) questlineByQuest.set(step.quest, { line, step });

  const quests = [];
  for (const { file, text } of await readOrderedTextFiles(join(pack, 'Quests'))) {
    try {
      const record = parseQuestFile(text, file);
      const list = listByName.get(record.id);
      record.listed = Boolean(list);
      record.source = 'dfu-quest-pack';
      record.group = list
        ? { raw: list.group, label: groupLabel(list.group), source: list.listSource === 'DFU' ? 'quest-list-dfu' : 'quest-list-classic' }
        : fallbackGroup(record.id, mainSheets);
      record.questList = list ?? null;
      if (mainSheets.has(record.id)) attachSheet(record, mainSheets.get(record.id));
      quests.push(record);
    } catch (error) {
      errors.push({ file, error: error.message });
    }
  }

  // The port's own online questline scripts, parsed with the same DFU-language reader.
  const questlineDir = join(src, 'systems/questlines/quests');
  for (const { file, text } of await readOrderedTextFiles(questlineDir)) {
    try {
      const record = parseQuestFile(text, file);
      const linked = questlineByQuest.get(record.id);
      record.listed = false;
      record.source = 'online-questline';
      record.group = { raw: 'Questline', label: linked ? linked.line.title : 'Online questline', source: 'qlLines' };
      if (linked) {
        record.questline = {
          id: linked.line.id,
          title: linked.line.title,
          group: linked.line.group,
          tier: linked.line.tier,
          step: linked.step.step,
          stepCount: linked.line.stepCount,
        };
      }
      if (questlineSheets.has(record.id)) attachSheet(record, questlineSheets.get(record.id));
      quests.push(record);
    } catch (error) {
      errors.push({ file, error: error.message });
    }
  }

  const byId = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  quests.sort(byId);
  // Demo scripts are DFU's "how to script a custom action" examples, not player-facing quests; keep them in the
  // inventory (for completeness) but mark them so page generation and the guide can filter them out.
  for (const quest of quests) quest.playerFacing = quest.group.raw !== 'Demo';

  const listedNames = new Set(listRows.map(row => row.name));
  const files = new Set(quests.filter(quest => quest.source === 'dfu-quest-pack').map(quest => quest.id));
  const listedWithoutFile = listRows.filter(row => !files.has(row.name)).map(row => row.name).sort();
  const byGroup = {};
  for (const quest of quests) byGroup[quest.group.raw] = (byGroup[quest.group.raw] ?? 0) + 1;
  const sortedGroups = Object.fromEntries(Object.entries(byGroup).sort(([a], [b]) => a < b ? -1 : 1));
  const stepQuestIds = questlines.flatMap(line => line.steps.map(step => step.quest));
  const questIds = new Set(quests.map(quest => quest.id));
  const unmatchedSteps = stepQuestIds.filter(id => !questIds.has(id));
  const unmatchedSheets = [...questlineSheets.keys()].filter(id => !questIds.has(id));
  const unmatchedMainSheets = [...mainSheets.keys()].filter(id => !questIds.has(id));
  const messageCounts = quests.reduce((total, quest) => total + quest.messages.length, 0);
  const declaredMessages = quests.map(quest => quest.declaredMessages).filter(value => value !== null);
  const displayNameMissing = quests.filter(quest => !quest.displayName).map(quest => quest.id);
  const recordErrors = quests.filter(quest => quest.parseErrors.length).map(quest => ({ id: quest.id, errors: quest.parseErrors }));
  const noMessages = quests.filter(quest => !quest.messages.length).map(quest => quest.id);
  const noTasks = quests.filter(quest => !quest.tasks.length).map(quest => quest.id);
  // The source header counts QRC records in the compiled file, so it need not equal our parsed panel count.
  const declaredHeaderDiff = quests
    .filter(quest => quest.declaredMessages !== null && quest.declaredMessages !== quest.messages.length)
    .map(quest => ({ id: quest.id, declared: quest.declaredMessages, parsed: quest.messages.length }));

  const data = {
    schemaVersion: SCHEMA_VERSION,
    note: 'Generated quest inventory for the DFO Online Handbook. Do not edit by hand: run `node handbook/tools/extract-quests.mjs`.',
    source: {
      snapshotCommit: SNAPSHOT_COMMIT,
      pack: packDir,
      packProvenance: PACK_PROVENANCE,
      src: srcDir,
      questlists: ['Tables/QuestList-Classic.txt', 'Tables/QuestList-DFU.txt'],
      questlines: ['systems/questlines/qlLines.js', 'systems/questlines/quests/*.txt', 'systems/questlines/sheets/questlines.json', 'systems/questlines/sheets/mainQuest.json'],
    },
    fields: {
      'quests[].id': 'Stable id = source filename without .txt (e.g. S0000001, QLBD01, 00B00Y00, _BRISIEN). Never changes for a given source file.',
      'quests[].filename': 'Source file name with .txt inside the pack or questline quests directory.',
      'quests[].source': 'dfu-quest-pack (265 pinned DFU quests) or online-questline (39 port questline scripts).',
      'quests[].displayName': 'DisplayName header; null for 28 trigger/demo scripts that declare none.',
      'quests[].group': '{ raw: quest-list group or family, label: humanised, source: where the group came from }.',
      'quests[].listed': 'true when a QuestList-Classic/DFU row names the file (listed quests are offered by guilds/social groups).',
      'quests[].questList': 'The raw list row: membership, minReq, flag, notes, disabled, listSource. minReq < 10 = guild rank/player level, >= 10 = minimum reputation.',
      'quests[].startsBy / questee / questor / repute / questId': 'Values from the file header comments (null when the file does not state them).',
      'quests[].notes': 'Every other header comment, including "Main story quest" and the port questline notes.',
      'quests[].messages': 'QRC panels in file order: { key, id, text, variants? }. `variants` splits the <---> alternates (rumours). `messageCount`/`messageCounts` summarise them.',
      'quests[].declaredMessages': 'The source `Messages:` header. It counts QRC records in the compiled file, which is not the same as the number of panels this reader splits (see gaps.declaredMessageHeaderDiff).',
      'quests[].journal': 'The QuestLogEntry panel text (or first %qdt panel) with the %qdt: marker removed: the player-facing objective.',
      'quests[].tasks / variables': 'QBN task blocks (name + action lines) and variable names.',
      'quests[].clocks': 'QBN clocks: { name, start, end, flag, range:[minDays,maxDays], raw }.',
      'quests[].timeLimit': 'The clock the script starts with `start timer`, with its day range when given (else null).',
      'quests[].resources': 'QBN Item/Person/Place/Foe declarations, each with its raw declaration.',
      'quests[].objectiveSummary': 'For main/questline quests the sheet objectives (authored, player-facing); otherwise journal text clipped to 240 chars, else task names. Null when neither exists.',
      'quests[].reward': 'Declared QBN item resources (includes quest items, not only rewards): gold flag, item names, named items and a summary. Sheet-backed quests also carry sheetPay pay bands and sheetNamed items.',
      'quests[].sheet': 'For main quests and questline quests: objectives/outcomes/branches from Questlines sheets (text + pay band).',
      'questlines[]': '14 online lines: { id, group, tier, title, lead, giver, opens, steps:[{quest,title,step,needs}], stepCount }.',
      'questlineQuests': 'The 39 online questline quests are included in quests[] with source "online-questline" and questline metadata.',
      counts: 'Totals, per-group counts and parse/coverage figures; gaps lists unresolved or missing inputs.',
    },
    counts: {
      packQuestFiles: files.size,
      questlineQuestFiles: quests.filter(quest => quest.source === 'online-questline').length,
      totalQuestRecords: quests.length,
      questListRows: listRows.length,
      questListClassicRows: listRows.filter(row => row.listSource === 'Classic').length,
      questListDfuRows: listRows.filter(row => row.listSource === 'DFU').length,
      listedQuestsMatched: listRows.filter(row => files.has(row.name)).length,
      listedWithoutFile: listedWithoutFile.length,
      unlistedQuestFiles: [...files].filter(id => !listedNames.has(id)).length,
      displayNameMissing: displayNameMissing.length,
      messages: messageCounts,
      messageHeaders: declaredMessages.length,
      declaredMessagesSum: declaredMessages.reduce((total, value) => total + value, 0),
      tasks: quests.reduce((total, quest) => total + quest.tasks.length, 0),
      variables: quests.reduce((total, quest) => total + quest.variables.length, 0),
      clocks: quests.reduce((total, quest) => total + quest.clocks.length, 0),
      sheetedQuests: quests.filter(quest => quest.sheet).length,
      playerFacingQuests: quests.filter(quest => quest.playerFacing).length,
      nonPlayerFacingQuests: quests.filter(quest => !quest.playerFacing).length,
      questlines: questlines.length,
      questlineSteps: stepQuestIds.length,
      mainQuestSheets: mainSheets.size,
      questlineSheets: questlineSheets.size,
      questsWithoutMessages: noMessages.length,
      questsWithoutTasks: noTasks.length,
      byGroup: sortedGroups,
      parseErrors: recordErrors.length,
    },
    gaps: {
      listedWithoutFile,
      displayNameMissing,
      questsWithoutMessages: noMessages,
      questsWithoutTasks: noTasks,
      declaredMessageHeaderDiff: declaredHeaderDiff,
      declaredMessageHeaderNote: 'The source Messages: header counts compiled QRC records; parsed panels can differ. Informational, not a parse failure.',
      questlineStepsWithoutQuest: unmatchedSteps,
      questlineSheetsWithoutQuest: unmatchedSheets,
      mainQuestSheetsWithoutQuest: unmatchedMainSheets,
      filesWithoutGroup: quests.filter(quest => quest.group.raw === 'Unlisted').map(quest => quest.id),
      questRecordsWithParseErrors: recordErrors,
      parseErrors: errors,
    },
    questlines,
    quests,
  };
  return data;
}

// Public sheet references only: ids and pay bands, never the authored objective/outcome sentences.
function publicSheet(sheet) {
  if (!sheet) return null;
  return {
    objectives: (sheet.objectives ?? []).map(objective => ({ id: objective.id, ...(objective.optional ? { optional: true } : {}) })),
    outcomes: (sheet.outcomes ?? []).map(outcome => ({
      id: outcome.id,
      pay: outcome.pay ?? null,
      ...(outcome.failure ? { failure: true } : {}),
      ...(outcome.named ? { named: outcome.named.name } : {}),
    })),
    ...(sheet.success ? { success: sheet.success } : {}),
    ...(sheet.branches ? { branchIds: sheet.branches.map(branch => branch.id) } : {}),
  };
}

function publicQuest(quest) {
  // Message ids only, sorted and de-duplicated: no panel text, keys or variant sentences are published.
  const messageIds = [...new Set(quest.messages.map(message => message.id).filter(id => id !== null))].sort((a, b) => a - b);
  const record = {
    id: quest.id,
    filename: quest.filename,
    source: quest.source,
    playerFacing: quest.playerFacing,
    displayName: quest.displayName,
    group: quest.group,
    listed: quest.listed,
    questList: quest.questList,
    startsBy: quest.startsBy,
    questee: quest.questee,
    questor: quest.questor,
    repute: quest.repute,
    questId: quest.questId,
    notes: quest.notes,
    messageCount: quest.messageCount,
    messageIds,
    journalMessage: quest.journalMessage,
    taskNames: quest.tasks.map(task => task.name),
    timeLimit: quest.timeLimit,
    resources: {
      items: quest.resources.items.map(item => item.name),
      persons: quest.resources.persons.map(person => person.name),
      places: quest.resources.places.map(place => place.name),
      foes: quest.resources.foes.map(foe => foe.name),
    },
    reward: quest.reward,
    objectiveSource: quest.sheet ? 'sheet' : quest.journal ? 'journal' : quest.tasks.length ? 'tasks' : null,
    sheet: publicSheet(quest.sheet),
    ...(quest.questline ? { questline: quest.questline } : {}),
    parseErrors: quest.parseErrors,
  };
  return record;
}

/**
 * Trim the full extraction into the committed public index: the handbook must not republish copied quest dialogue,
 * so every message/journal/objective/outcome sentence is replaced by its id, key or count.
 */
export function publicQuestIndex(data) {
  const fields = {
    'quests[].id': 'Stable id = source filename without .txt (e.g. S0000001, QLBD01, 00B00Y00, _BRISIEN).',
    'quests[].filename': 'Source file name with .txt inside the pack or questline quests directory.',
    'quests[].source': 'dfu-quest-pack (265 pinned DFU quests) or online-questline (39 port questline scripts).',
    'quests[].playerFacing': 'false for the 21 __DEMO scripting examples, which are not player-facing quests and should be excluded from the guide.',
    'quests[].displayName': 'DisplayName header; null for 28 trigger/demo scripts that declare none.',
    'quests[].group': '{ raw: quest-list group or family, label: humanised, source: where the group came from }.',
    'quests[].listed': 'true when a QuestList-Classic/DFU row names the file (offered by guilds/social groups).',
    'quests[].questList': 'Raw list row: membership, minReq, flag, notes, disabled, listSource. minReq < 10 = guild rank/player level, >= 10 = reputation.',
    'quests[].startsBy / questee / questor / repute / questId': 'Values from the file header comments (null when the file does not state them); questId falls back to the Quest: line.',
    'quests[].notes': 'Every other file header comment (design/audit notes, not dialogue).',
    'quests[].messageCount / messageIds': 'How many QRC panels exist and the sorted, de-duplicated numeric message ids. No panel text, keys or variant sentences are published.',
    'quests[].journalMessage': 'The { key, id } of the journal/QRC panel a journal line came from; its text is not published.',
    'quests[].taskNames': 'QBN task identifiers (the scripted objective steps); action lines stay in the local full extraction.',
    'quests[].timeLimit': 'The started timer: { clock, start, end, minDays, maxDays, raw }. Clock arrays and variable names stay in the local full extraction.',
    'quests[].resources': 'QBN resource names only (items, persons, places, foes); kinds/raw declaration lines stay in the local full extraction.',
    'quests[].reward': 'Declared QBN item resources: gold flag, item names, named items, summary; sheet-backed quests add sheetPay pay bands and sheetNamed item names.',
    'quests[].objectiveSource': 'Where a page generator can find the objective: sheet (ids only here), journal (id only) or tasks.',
    'quests[].sheet': 'Public sheet reference: objective/outcome ids, pay bands, success id, named item names, branch ids; text lives in the local full extraction.',
    'questlines[]': '14 online lines: { id, group, tier, title, opens, steps:[{quest,title,step,needs}], stepCount } (port-authored display strings, no DFU dialogue).',
    counts: 'Totals, per-group counts and parse/coverage figures; gaps lists unresolved or missing inputs.',
  };
  return {
    schemaVersion: data.schemaVersion,
    note: 'Public quest index: generated from the pinned snapshot with message and sheet dialogue text deliberately removed. Run `node handbook/tools/extract-quests.mjs`; the full text extraction stays local in audit/work/quests-full.json and is gitignored.',
    publicIndex: true,
    source: data.source,
    fields,
    counts: { ...data.counts, fullTextExtraction: DEFAULT_FULL_OUTPUT },
    gaps: data.gaps,
    questlines: data.questlines.map(line => ({
      id: line.id,
      group: line.group,
      tier: line.tier,
      title: line.title,
      opens: line.opens,
      steps: line.steps.map(step => ({ quest: step.quest, title: step.title, step: step.step, ...(step.needs ? { needs: step.needs } : {}) })),
      stepCount: line.stepCount,
    })),
    quests: data.quests.map(publicQuest),
  };
}

export async function writeQuestData({ outFile = DEFAULT_OUTPUT, fullFile = DEFAULT_FULL_OUTPUT, writeFull = true, ...options } = {}) {
  const full = await collectQuestData(options);
  const publicData = publicQuestIndex(full);
  const target = resolve(root, outFile);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, JSON.stringify(publicData, null, 2) + '\n');
  let fullTarget = null;
  if (writeFull) {
    fullTarget = resolve(root, fullFile);
    await mkdir(dirname(fullTarget), { recursive: true });
    await writeFile(fullTarget, JSON.stringify(full, null, 2) + '\n');
  }
  return { data: full, publicData, file: target, fullFile: fullTarget };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = name => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : undefined;
  };
  writeQuestData({
    outFile: arg('--out') ?? DEFAULT_OUTPUT,
    fullFile: arg('--full') ?? DEFAULT_FULL_OUTPUT,
    writeFull: !process.argv.includes('--index-only'),
    packDir: arg('--pack') ?? DEFAULT_PACK_DIR,
    srcDir: arg('--src') ?? DEFAULT_SRC_DIR,
  }).then(({ publicData, file, fullFile }) => {
    const counts = publicData.counts;
    console.log(`Extracted ${counts.totalQuestRecords} quests (${counts.packQuestFiles} pack + ${counts.questlineQuestFiles} online questline; ${counts.playerFacingQuests} player-facing, ${counts.nonPlayerFacingQuests} demo/script) and ${counts.questlines} questlines.`);
    console.log(`Groups: ${Object.entries(counts.byGroup).map(([group, count]) => `${group} ${count}`).join(', ')}`);
    console.log(`Messages ${counts.messages} panels, tasks ${counts.tasks}, sheets ${counts.mainQuestSheets} main / ${counts.questlineSheets} questline, ${counts.parseErrors} quest parse errors.`);
    console.log(`Wrote public index ${file} (no dialogue text).`);
    if (fullFile) console.log(`Wrote local full extraction ${fullFile} (gitignored).`);
  }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
