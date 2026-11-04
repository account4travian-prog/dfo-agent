# Quest data foundation — report (task-18)

Owner: engineer. Deliverables: `handbook/tools/extract-quests.mjs` (new, no deps), the public index
`handbook/facts/quests.json`, the local full extraction `audit/work/quests-full.json`, tests
`handbook/tools/test/quests.test.mjs` (new), and this report. No content pages, facts or tools outside the task's
scope were edited. Raw run output: `audit/work/quest-extract-output.txt`, `audit/work/tests-quests.txt`.

## 1. Files, locations and sizes (policy-corrected)

| File | Size | Committed? | Contents |
|---|---|---|---|
| `handbook/facts/quests.json` | **726,095 B (~726 KB)** | yes (public index) | Full quest inventory metadata for the guide, **no copying of quest message/dialogue text** |
| `audit/work/quests-full.json` | **3,224,477 B (~3.2 MB)** | no — `/audit/` is gitignored | Local evidence extract with every QRC message/journal/sheet sentence, for page-generation research |
| `handbook/tools/extract-quests.mjs` | ~40 KB | yes | Extractor (Node built-ins only, rerunnable) |
| `handbook/tools/test/quests.test.mjs` | — | yes | 11 parser/extractor tests |

Default command:

```powershell
node handbook/tools/extract-quests.mjs
# public index  handbook/facts/quests.json   (no dialogue text)
# local full     audit/work/quests-full.json  (gitignored)
```

Flags: `--out <file>`, `--full <file>`, `--pack <dir>`, `--src <dir>`, `--index-only` (public file only; writes no
local full extraction). The public index note and `fields` block state that message text is deliberately omitted.

**Why `handbook/facts/`:** it is a generated, rerunnable snapshot of pinned input, exactly like `facts.json` /
`tables.json` (and like `tables.json`, machine-generated rather than hand-edited); it is not numeric game law, so it
has its own name `quests.json` rather than being mixed into `facts.json`. IDs (below) are the contract page generation
will key on.

**Policy correction applied:** the previous 3 MB version with full dialogue text has been replaced. The public file
keeps counts/IDs and metadata only; every text field was removed or reduced:

- `messages` → `messageCount` + `messageIds` (sorted unique numeric QRC panel ids, no text/keys/variants)
- `journal` text → `journalMessage` `{ key, id }` only
- `objectiveSummary` text → `objectiveSource` (`sheet` / `journal` / `tasks`) + `taskNames` (QBN task identifiers)
- `tasks[].actions`, `variables`, `clocks`, QBN `qbnOther`, resource `raw` declarations → local full extraction only
- `sheet` → reference only: objective/outcome ids, pay bands, named item names, success id, branch ids (no prose)
- `questlines[].lead` / `giver` sentences → local full extraction only; titles/step titles are port-authored UI
  strings and stay (needed to generate the guide's questline headings)

The test suite asserts the public JSON contains no `"text":`, `"variants":`, `"journal":`, `"objectiveSummary":`,
`"actions":`, `"lead":` or `"giver":` keys and that it is less than half the full file.

## 2. IDs and fields (stable contract)

- **Quest id** = source filename without `.txt` (`00B00Y00`, `S0000001`, `_BRISIEN`, `QLBD01`). Stable and unique
  across all 304 records; the file also carries `filename` with `.txt`.
- **Questline id** = the `id` in `qlLines.js` (`burningDoors`, `covensHoard`, …); a questline quest also carries
  `questline { id, title, group, tier, step, stepCount }`.
- **Group** = `{ raw, label, source }` where source is `quest-list-classic`, `quest-list-dfu`, `main-quest-sheet` or
  `file-class`; the raw member name is unchanged from the tables (`HolyOrder`, `DarkBrotherHood`, …).
- Public record fields: `id, filename, source, playerFacing, displayName, group, listed, questList, startsBy,
  questee, questor, repute, questId, notes, messageCount, messageIds, journalMessage, taskNames, timeLimit, resources
  {items,persons,places,foes names}, reward {gold, items, namedItems, summary, sheetPay, sheetNamed}, objectiveSource,
  sheet ref, questline ref, parseErrors`.
- Every field is documented in `handbook/facts/quests.json.fields` (machine-readable for the page generator), and the
  full record adds `messages[]` with `text`/`variants`, `journal`, `tasks[].actions`, `clocks`, `resources[].raw`,
  `sheet` texts and `questlines[].lead/giver`.

## 3. Counts, coverage and groups

Source: pinned `upstream/snapshot-e4f093166/vendor/dfu-quests` (DFU commit `81e89e90…`, MIT) and
`upstream/snapshot-e4f093166/src/systems/questlines` at snapshot `e4f093166`.

- **304 quest records = 265 pinned DFU pack files + 39 port online questline quests.** 0 parse errors.
- Quest lists: **211 rows** (210 classic + 1 DFU); 206 rows match a file, **5 listed rows have no source file**
  (`80C00Y00, A0C00Y04, M0B40Y04, N0C00Y01, R0C40Y23`); 59 pack files are unlisted (35 main quests incl. `_BRISIEN`,
  2 cure, 1 tutorial, 21 demos). 18 listed rows are `-`-disabled in the table and are recorded with `disabled: true`
  plus their note (`10C…`/`T…`–`Z…` Oblivion, `K0C00Y06`, `R0C11Y27`).
- Groups (304): Commoners 20, Cure 2, DarkBrotherHood 13, Demo 21, FightersGuild 21, GeneralPopulace 15, HolyOrder 24,
  KnightlyOrder 17, MagesGuild 18, MainQuest 35, Merchants 13, Nobility 29, Oblivion 16, Questline 39, Tutorial 1,
  Vampires 10, Witches 10.
- Parsed content: **4,194 message panels**, 2,755 QBN task blocks / 470 variables / 471 clocks; 74 sheet-backed quests
  (35 main-quest sheets + 39 questline sheets); **14 questlines / 39 steps**, every step chartered to an existing
  quest and sheet (`questlineStepsWithoutQuest: []`, `questlineSheetsWithoutQuest: []`, `mainQuestSheetsWithoutQuest: []`).
- Field coverage: displayName 276/304, startsBy 207, questee 207, questor 205, repute 205, journal panel 291,
  timeLimit 285, sheet 74 (objectiveSource: journal 225, sheet 74, tasks 3, none 2).
- Raw-line coverage checks: QRC panel headers parsed **exactly 4,194/4,194**; `task:` blocks **2,755/2,755**;
  clock lines 471/471; variable lines 470/470.
- Informational gaps: 219/236 `Messages:` headers differ from the parsed panel count — the header counts compiled QRC
  records, not text panels, so this is recorded as `gaps.declaredMessageHeaderDiff` with an explanatory note.
  28 records have no DisplayName (7 late-trigger `S000010x` and 21 demos), 1 has no message panels (`__DEMO01`),
  9 have no task blocks (8 demos + `S0000107`).

## 4. Do the 265 include the `__DEMO` quests? Should they be in the player guide?

**Yes, they are included**: the pack's 265 files include `__DEMO01`–`__DEMO21`. They are not player quests: each is
DFU's minimal scripting example ("Minimal example quest used to demonstrate how to script custom actions", no
DisplayName, no message panels or task blocks in most). **Recommendation: exclude them from the player-facing guide.**
The data records them with `playerFacing: false` and `group.raw = "Demo"`: **283 player-facing quests** and 21 demos.
The questline quests remain player-facing (283 includes all 39).

## 5. Samples (public index)

`00B00Y00` — listed Holy Order (Julianos) quest "The Price of Knowledge": `startsBy: NPC`, `questee: member`,
`questor: Julianos`, `repute: "0"`, 12 message ids (`1000`–`1009`, `1030`, `1031`), journal panel id 1030, task names
incl. `_mondead_`, time limit clock `_1stparton_` with day range 0–2, resources (`_reward_`, `_questgiver_`,
`_mondung_`, `_monster_`), `reward.gold: true`.

`S0000001` — group `MainQuest` (from the main-quest sheet), "Missing Prince", `listed: false`, sheet ref with 4
objective ids/4 outcome ids and pay bands, time limit clock `_S.13_` (fixed 3.00:00–7.00:00, no day range).

`QLBD01` — source `online-questline`, questline `burningDoors` step 1/5, sheet ref 1 objective, group raw
`Questline`, journal panel id only.

## 6. Exact results

Extractor:

```
node handbook/tools/extract-quests.mjs
Extracted 304 quests (265 pack + 39 online questline; 283 player-facing, 21 demo/script) and 14 questlines.
Groups: Commoners 20, Cure 2, DarkBrotherHood 13, Demo 21, FightersGuild 21, GeneralPopulace 15, HolyOrder 24, KnightlyOrder 17, MagesGuild 18, MainQuest 35, Merchants 13, Nobility 29, Oblivion 16, Questline 39, Tutorial 1, Vampires 10, Witches 10
Messages 4194 panels, tasks 2755, sheets 35 main / 39 questline, 0 quest parse errors.
Wrote public index …\handbook\facts\quests.json (no dialogue text).
Wrote local full extraction …\audit\work\quests-full.json (gitignored).
```

Tests:

```
node --test handbook/tools/test/quests.test.mjs
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

Full suite at this run: `node --test handbook/tools/test/` → **tests 104, pass 100, fail 2, skipped 2**. The two
failures are in `site.test.mjs` ("fixture validation and full static build") and `launch.test.mjs` ("home and article
carry canonical, Open Graph…") and come from **other agents' concurrent uncommitted edits**, not from this task:
`handbook/tools/build.mjs` had 11 mojibake sequences re-introduced while I worked (build copy/heading text), and other
new quest-plugin files are untracked. The quest data/tests are isolated from the build and pass; the Lead should rerun
the suite after the concurrent build/quest-page edits settle (the same two tests passed earlier today at 104/102/0).

## 7. Notes / limitations

- The public index is generated; do not hand-edit it. Future content/page generation should read
  `handbook/facts/quests.json`; the local full extraction is only for research that must not land in the repo.
- `timeLimit` is the clock the script starts with `start timer`, with `range` interpreted as a day range when present;
  fixed clock windows are kept as raw `start`/`end` strings (the source format mixes `hh:mm` and `d.hh:mm`).
- `questList` covers only the 211 listed quests; main-quest/tutorial/cure/demo files have `listed: false` and a group
  from the main-quest sheets or their file class. The 5 list rows without source files are reported, not invented.
- `reward` for pack quests reflects declared QBN item resources (which include quest items, not only rewards); sheet pay
  bands/named items are the better source for main/questline quests (`reward.sheetPay`/`sheetNamed`).
- Questline `lead`/`giver` sentences are omitted from the public index as a conservative policy call; they are
  port-authored UI text, not DFU dialogue, and can be re-added to the public file if the Lead wants them before page
  generation.
