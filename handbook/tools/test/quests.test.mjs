import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SCHEMA_VERSION, DEFAULT_OUTPUT, DEFAULT_FULL_OUTPUT, parseQuestFile, parseQuestList, parseMessages, parseQbn, parseClock, journalOf,
  groupLabel, collectQuestData, writeQuestData,
} from '../extract-quests.mjs';

const fixtures = fileURLToPath(new URL('./fixtures/', import.meta.url));

// The pinned corpus is in the repository, so the real extractor is exercised directly (once for the whole file).
const data = await collectQuestData();
const quest = id => data.quests.find(record => record.id === id);

test('a quest file yields header metadata, message panels, QBN resources, tasks and a time limit', () => {
  const source = [
    '-- Quest: C:\\QUESTS\\WORKING\\TEST01.Qbn.',
    '-- StartsBy: NPC',
    '-- Questee: member',
    '-- Questor: Julianos',
    '-- Repute: 2',
    '-- QuestId: 7',
    '-- Main story quest.',
    'Messages: 4',
    'Quest: TEST01',
    'DisplayName: A Test Errand',
    'QRC:',
    '',
    'QuestorOffer:  [1000]',
    '<ce>   Please fetch the _thing_.',
    '',
    'AcceptQuest:  [1002]',
    'Yes, at once.',
    '',
    'RumorsDuringQuest:  [1005]',
    'One rumour.',
    '<--->',
    'Another rumour.',
    '',
    'QuestLogEntry:  [1010]',
    '%qdt:',
    ' Fetch the _thing_ from _place_.',
    '',
    '-- Symbols used in the QRC file:',
    'QBN:',
    'Item _thing_ artifact',
    'Item _reward_ gold',
    'Person _questor_ named Test_Person',
    'Place _place_ remote dungeon',
    'Foe _foe_ is Rat',
    'Clock _timer_ 1.00:00 2.00:00',
    '',
    '--\tQuest start-up:',
    '\tstart timer _timer_',
    '\tlog 1010 step 0',
    '',
    '_done_ task:',
    '\tkilled 1 _foe_ saying 1002',
    'variable _seen_',
    '',
  ].join('\n');
  const record = parseQuestFile(source, 'TEST01.txt');
  assert.equal(record.id, 'TEST01');
  assert.equal(record.displayName, 'A Test Errand');
  assert.equal(record.startsBy, 'NPC');
  assert.equal(record.questee, 'member');
  assert.equal(record.questor, 'Julianos');
  assert.equal(record.repute, '2');
  assert.equal(record.questId, '7');
  assert.deepEqual(record.notes, ['Main story quest']);
  assert.equal(record.declaredMessages, 4);
  assert.equal(record.messages.length, 4);
  assert.deepEqual(record.messages.map(message => message.key), ['QuestorOffer', 'AcceptQuest', 'RumorsDuringQuest', 'QuestLogEntry']);
  assert.equal(record.messages[0].id, 1000);
  assert.match(record.messages[0].text, /fetch the _thing_/);
  assert.deepEqual(record.messages[2].variants, ['One rumour.', 'Another rumour.']);
  assert.equal(record.journal, 'Fetch the _thing_ from _place_.');
  assert.match(record.objectiveSummary, /Fetch the _thing_/);
  assert.deepEqual(record.variables, ['_seen_']);
  assert.deepEqual(record.resources.items.map(item => item.name), ['_thing_', '_reward_']);
  assert.deepEqual(record.resources.foes.map(foe => foe.kind), ['Rat']);
  assert.equal(record.clocks[0].name, '_timer_');
  assert.deepEqual(record.clocks[0].range, null);
  assert.equal(record.timeLimit.clock, '_timer_');
  assert.equal(record.timeLimit.start, '1.00:00');
  assert.equal(record.reward.gold, true);
  assert.equal(record.tasks.length, 1);
  assert.equal(record.tasks[0].name, '_done_');
  assert.equal(record.tasks[0].actions[0], 'killed 1 _foe_ saying 1002');
  assert.deepEqual(record.parseErrors, []);
});

test('malformed files report parse errors instead of throwing', () => {
  const record = parseQuestFile('Quest: X\nDisplayName: Broken\n', 'BROKEN.txt');
  assert.ok(record.parseErrors.includes('missing QRC section'));
  assert.ok(record.parseErrors.includes('missing QBN section'));
  assert.deepEqual(parseMessages(''), []);
  assert.deepEqual(parseMessages('QRC:\n'), []);
  assert.deepEqual(parseQbn('QBN:\nItem _gold_ gold\n').tasks, []);
  assert.deepEqual(parseQbn('QBN:\nItem _gold_ gold\n').resources.items.map(item => item.name), ['_gold_']);
});

test('quest list rows keep group, membership, requirements, flags, notes and disabled rows', () => {
  const source = [
    '-- comment',
    '-- name: filename of QRC txt file',
    'schema: *name, group, membership, minReq, flag, notes',
    'M0C00Y11, FightersGuild, N, 0, 0, Passed',
    'G0B00Y00, HolyOrder, K, 0, 0, Passed.',
    '-K0C00Y06, Merchants, M, 0, 0, disabled',
    'R0C11Y27, Nobility, N, 1, 1, duplicate of r0c10y17',
    'CUSTOM01, FightersGuild, M, 40, 0, New quest exclusive to Daggerfall Unity',
  ].join('\n');
  const rows = parseQuestList(source, 'Classic');
  assert.equal(rows.length, 5);
  assert.deepEqual(rows[0], {
    name: 'M0C00Y11', group: 'FightersGuild', membership: 'N', minReq: 0, flag: '0', notes: 'Passed', disabled: false, listSource: 'Classic',
  });
  assert.equal(rows[2].name, 'K0C00Y06');
  assert.equal(rows[2].disabled, true);
  assert.equal(rows[3].notes, 'duplicate of r0c10y17');
  assert.equal(rows[4].minReq, 40);
  assert.equal(rows[4].listSource, 'Classic');
});

test('clock parsing covers fixed windows and day ranges', () => {
  assert.deepEqual(parseClock('_S.13_ 3.00:00 7.00:00'), {
    name: '_S.13_', start: '3.00:00', end: '7.00:00', flag: null, range: null, raw: '_S.13_ 3.00:00 7.00:00',
  });
  const ranged = parseClock('_1stparton_ 00:00 0 flag 17 range 0 2');
  assert.equal(ranged.name, '_1stparton_');
  assert.equal(ranged.flag, 17);
  assert.deepEqual(ranged.range, [0, 2]);
  assert.equal(groupLabel('DarkBrotherHood'), 'Dark Brother Hood');
});

test('journal prefers QuestLogEntry and falls back to a %qdt panel', () => {
  assert.equal(journalOf([{ key: 'Message', text: 'ordinary' }]), null);
  assert.equal(journalOf([{ key: 'QuestLogEntry', text: '%qdt:\n Follow the road.' }]), 'Follow the road.');
  assert.equal(journalOf([{ key: 'Message', text: '%qdt:\n Find the hall.' }]), 'Find the hall.');
});

test('the real corpus parses completely: 265 pinned DFU quests plus 39 online questline quests', () => {
  assert.equal(data.schemaVersion, SCHEMA_VERSION);
  assert.equal(data.source.snapshotCommit, 'e4f093166');
  assert.equal(data.counts.packQuestFiles, 265);
  assert.equal(data.counts.questlineQuestFiles, 39);
  assert.equal(data.counts.totalQuestRecords, 304);
  assert.equal(data.counts.parseErrors, 0);
  assert.deepEqual(data.gaps.parseErrors, []);
  assert.deepEqual(data.gaps.questRecordsWithParseErrors, []);
  assert.deepEqual(data.gaps.questsWithoutMessages, ['__DEMO01']);
  assert.equal(data.counts.questsWithoutMessages, 1);
  assert.equal(data.counts.questsWithoutTasks, data.gaps.questsWithoutTasks.length);
  assert.ok(data.gaps.questsWithoutTasks.includes('S0000107'));
  assert.equal(new Set(data.quests.map(record => record.id)).size, 304);
  assert.deepEqual(data.quests.map(record => record.id), data.quests.map(record => record.id).slice().sort((a, b) => a < b ? -1 : 1));
  for (const record of data.quests) {
    assert.ok(record.id && record.filename && record.source, record.id);
    assert.ok(record.group?.raw && record.group?.label, record.id);
    assert.ok(Array.isArray(record.messages) && Array.isArray(record.tasks), record.id);
    assert.equal(record.messages.filter(message => message.key === 'QRC').length, 0, `${record.id} has no phantom QRC panel`);
  }
  assert.equal(data.quests.filter(record => record.source === 'dfu-quest-pack').length, 265);
  assert.equal(data.quests.filter(record => record.source === 'online-questline').length, 39);
});

test('corpus counts, groups, messages, tasks and sheets match the pinned inputs', () => {
  assert.equal(data.counts.questListRows, 211);
  assert.equal(data.counts.questListClassicRows, 210);
  assert.equal(data.counts.questListDfuRows, 1);
  assert.equal(data.counts.listedQuestsMatched, 206);
  assert.equal(data.counts.listedWithoutFile, 5);
  assert.deepEqual(data.gaps.listedWithoutFile, ['80C00Y00', 'A0C00Y04', 'M0B40Y04', 'N0C00Y01', 'R0C40Y23']);
  assert.equal(data.counts.unlistedQuestFiles, 59);
  assert.deepEqual(data.counts.byGroup, {
    Commoners: 20, Cure: 2, DarkBrotherHood: 13, Demo: 21, FightersGuild: 21, GeneralPopulace: 15, HolyOrder: 24,
    KnightlyOrder: 17, MagesGuild: 18, MainQuest: 35, Merchants: 13, Nobility: 29, Oblivion: 16, Questline: 39,
    Tutorial: 1, Vampires: 10, Witches: 10,
  });
  assert.equal(data.counts.messages, 4194);
  assert.equal(data.counts.tasks, 2755);
  assert.equal(data.counts.variables, 470);
  assert.equal(data.counts.clocks, 471);
  assert.equal(data.counts.sheetedQuests, 74);
  assert.equal(data.counts.mainQuestSheets, 35);
  assert.equal(data.counts.questlineSheets, 39);
  assert.equal(data.counts.questlines, 14);
  assert.equal(data.counts.questlineSteps, 39);
  assert.deepEqual(data.gaps.questlineStepsWithoutQuest, []);
  assert.deepEqual(data.gaps.questlineSheetsWithoutQuest, []);
  assert.deepEqual(data.gaps.mainQuestSheetsWithoutQuest, []);
  assert.deepEqual(data.gaps.filesWithoutGroup, []);
  assert.ok(data.gaps.declaredMessageHeaderDiff.length > 0);
  assert.match(data.gaps.declaredMessageHeaderNote, /header/i);
});

test('a listed quest keeps its list row, QRC text, journal and gold reward', () => {
  const horses = quest('00B00Y00');
  assert.equal(horses.displayName, 'The Price of Knowledge');
  assert.equal(horses.source, 'dfu-quest-pack');
  assert.equal(horses.listed, true);
  assert.equal(horses.group.raw, 'HolyOrder');
  assert.equal(horses.group.label, 'Holy Order');
  assert.equal(horses.questList.membership, 'J');
  assert.equal(horses.startsBy, 'NPC');
  assert.equal(horses.questee, 'member');
  assert.equal(horses.questor, 'Julianos');
  assert.equal(horses.repute, '0');
  assert.match(horses.messages.find(message => message.key === 'QuestorOffer').text, /School of Julianos/);
  assert.match(horses.journal, /^The School of Julianos/);
  assert.match(horses.objectiveSummary, /School of Julianos/);
  assert.equal(horses.reward.gold, true);
  assert.equal(horses.timeLimit.clock, '_1stparton_');
  assert.equal(horses.timeLimit.maxDays, 2);
  assert.equal(horses.tasks.find(task => task.name === '_mondead_').actions[0], 'killed 1 _monster_ saying 1031');
});

test('main quests come from the main-quest sheets with authored objectives and pay bands', () => {
  const prince = quest('S0000001');
  assert.equal(prince.group.raw, 'MainQuest');
  assert.equal(prince.group.source, 'main-quest-sheet');
  assert.equal(prince.displayName, 'Missing Prince');
  assert.equal(prince.listed, false);
  assert.equal(prince.sheet.objectives.length, 4);
  assert.match(prince.objectiveSummary, /^Find proof of what really became of Prince/);
  assert.ok(prince.reward.sheetPay.length > 0);
  assert.ok(prince.reward.sheetPay.includes('standard'));
  assert.equal(prince.timeLimit.clock, '_S.13_');
  assert.equal(prince.journal.includes('Prince Lhotun') || prince.journal.length > 0, true);
  const brisienna = quest('_BRISIEN');
  assert.equal(brisienna.group.raw, 'MainQuest');
  assert.ok(brisienna.sheet.outcomes.some(outcome => outcome.id === 'met'));
});

test('online questline quests carry line, step and sheet metadata', () => {
  assert.equal(data.questlines.length, 14);
  assert.equal(data.questlines.reduce((total, line) => total + line.steps.length, 0), 39);
  assert.equal(data.questlines[0].id, 'burningDoors');
  assert.equal(data.questlines[0].title, 'The Burning Doors');
  const groups = new Set(data.questlines.map(line => line.group));
  for (const group of ['cycle', 'hour', 'coil', 'intro', 'festival']) assert.ok(groups.has(group), group);
  for (const line of data.questlines) {
    assert.ok(line.title && line.lead && line.giver, line.id);
    for (const step of line.steps) {
      assert.ok(step.title, `${line.id}/${step.quest}`);
      assert.ok(quest(step.quest), `${step.quest} exists`);
    }
  }
  const first = quest('QLBD01');
  assert.equal(first.source, 'online-questline');
  assert.equal(first.group.raw, 'Questline');
  assert.deepEqual(first.questline, { id: 'burningDoors', title: 'The Burning Doors', group: 'cycle', tier: 3, step: 1, stepCount: 5 });
  assert.equal(first.sheet.objectives.length, 1);
  assert.match(first.objectiveSummary, /Meet Ysolde/);
});

test('the snapshot is deterministic; the public index holds ids only and the full text stays local', async () => {
  const again = await collectQuestData();
  assert.equal(JSON.stringify(again), JSON.stringify(data));
  const dir = await mkdtemp(join(fixtures, 'quests-'));
  const outFile = join(dir, 'quests.json'), fullFile = join(dir, 'quests-full.json');
  try {
    const written = await writeQuestData({ outFile, fullFile });
    assert.equal(written.file, outFile);
    assert.equal(written.fullFile, fullFile);
    assert.equal(written.publicData.counts.totalQuestRecords, 304);
    assert.equal(written.data.counts.totalQuestRecords, 304);

    const raw = await readFile(outFile, 'utf8');
    assert.ok(raw.endsWith('\n'));
    const parked = JSON.parse(raw);
    assert.equal(parked.schemaVersion, SCHEMA_VERSION);
    assert.equal(parked.publicIndex, true);
    assert.equal(parked.counts.totalQuestRecords, 304);
    assert.equal(parked.quests.length, 304);
    assert.ok(parked.fields['quests[].id']);
    assert.equal(DEFAULT_OUTPUT.split('\\').join('/'), 'handbook/facts/quests.json');
    assert.equal(DEFAULT_FULL_OUTPUT.split('\\').join('/'), 'audit/work/quests-full.json');
    assert.match(parked.note, /extract-quests\.mjs/);
    assert.match(parked.note, /deliberately removed/);

    // No copied dialogue or sheet prose in the public file: message bodies, journals, objectives and outcomes are ids only.
    assert.doesNotMatch(raw, /"text":/);
    assert.doesNotMatch(raw, /"variants":/);
    assert.doesNotMatch(raw, /"messageIndex":|"messageCounts":/);
    assert.doesNotMatch(raw, /"journal":/);
    assert.doesNotMatch(raw, /"objectiveSummary":/);
    assert.doesNotMatch(raw, /"lead":|"giver":/);
    assert.doesNotMatch(raw, /"actions":/);
    const horses = parked.quests.find(record => record.id === '00B00Y00');
    assert.equal(horses.messageCount, 12);
    assert.deepEqual(horses.messageIds, [...horses.messageIds].sort((a, b) => a - b));
    assert.equal(new Set(horses.messageIds).size, horses.messageIds.length);
    for (const id of [1000, 1002, 1005, 1030]) assert.ok(horses.messageIds.includes(id), `message id ${id}`);
    assert.deepEqual(horses.journalMessage, { key: 'Message', id: 1030 });
    assert.ok(horses.taskNames.includes('_mondead_'));
    assert.equal('tasks' in horses, false);
    assert.equal('clocks' in horses, false);
    assert.ok(horses.resources.items.includes('_reward_'));
    assert.ok(horses.reward.gold);
    const prince = parked.quests.find(record => record.id === 'S0000001');
    assert.equal(prince.objectiveSource, 'sheet');
    assert.ok(prince.sheet.objectives.every(objective => objective.id && !('text' in objective)));
    assert.ok(prince.sheet.outcomes.every(outcome => outcome.id && !('text' in outcome)));
    const full = JSON.parse(await readFile(fullFile, 'utf8'));
    assert.ok(full.quests.find(record => record.id === 'S0000001').sheet.objectives[0].text);
    assert.ok(full.quests.find(record => record.id === '00B00Y00').messages[0].text);
    const publicBytes = raw.length, fullBytes = (await readFile(fullFile, 'utf8')).length;
    assert.ok(publicBytes < fullBytes / 2, `public ${publicBytes} should be much smaller than full ${fullBytes}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
