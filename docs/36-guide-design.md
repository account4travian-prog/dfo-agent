# Guide and quest-guide design

Research and decisions for the handbook's next stage: a complete quest guide. This file records what the research
found, what the guide will do differently, and the page/data contract. Research reports:
[`research/guide-research.md`](research/guide-research.md) (handbook/guide patterns) and
[`research/quest-research.md`](research/quest-research.md) (Daggerfall/DFO quest pain points).

## What the best guides have in common

The sources are consistent about six things:

1. **A giver/faction index, not an alphabet.** UESP's Daggerfall quest page lists 227 quests under the faction that
   gives them, each with a one-line hook. It is both the browse page and the search landing page.
   [UESP: Daggerfall:Quests](https://en.uesp.net/wiki/Daggerfall:Quests)
2. **A fixed facts block before prose.** UESP's Quest Header and OSRS's quick-guide details table answer "can I do
   this, where, what do I get, what do I need?" in seconds. [UESP quest layout](https://en.uesp.net/wiki/UESPWiki:Style_Guide/Quest_Layout),
   [OSRS quick guide](https://oldschool.runescape.wiki/w/Cook%27s_Assistant/Quick_guide)
3. **A quick path and a detailed walkthrough.** UESP requires a numbered, spoiler-light Quick Walkthrough and a
   paragraph Detailed Walkthrough with per-step headings; OSRS splits them into cross-linked quick and in-depth pages.
4. **Choices, failure and recovery are first-class.** UESP requires alternatives and consequences, and a section
   always titled *Bugs* so other pages can deep-link it. OSRS adds "Required for completing". Almost no Daggerfall
   guide has a real recovery ladder.
5. **Generated facts do not drift.** UESP's journal/stage sections are generated from game data by scripts. The
   handbook already has the same instinct in `facts/` and the build checks.
6. **Freshness is visible at the point of use.** BG3 wiki shows the latest game update and date, PoE shows the latest
   version and date, Wowhead serves Live/PTR versions. Game8's BG3 index still said "Last updated September 7, 2023"
   in October 2026 — the anti-pattern. [BG3 wiki](https://bg3.wiki/), [PoE wiki](https://www.poewiki.net/wiki/Path_of_Exile_Wiki),
   [Game8 BG3](https://game8.co/games/BG3/archives/419608)

Supporting patterns: task-oriented hubs, search as a product surface (quest names, givers, aliases), tables/checklists
for repeat use, maps as a retention surface (UESP's map tool reports 10–15k views/day), a visible correction route, and
mobile/accessibility as table stakes. The full list, with anti-patterns and retention analysis, is in the research
report.

## What Daggerfall/DFO players actually get stuck on

From UESP, the DFWorkshop forums (including archived threads), Steam and Ludo guides, plus DFO's own source and docs:

1. **Time limits vs. travel and rest.** The forum thread is literally "Please is there anyway to increase more time
   on Quests?" — players fail deliveries because a generated site is across the region.
2. **Finding the quest item.** Huge dungeons, secret doors, dressing and containers; the 3D map is the tool, and a
   fixed quest item is not vendor loot.
3. **The journal does not repeat everything.** Players are advised to screenshot the offer; region, place, person and
   time may not all appear together in one later entry.
4. **Permanent breaks.** The DFQFIX catalogue lists timers that never start, missing locations, vanishing rewards and
   NPCs gone; selling a quest item is unrecoverable; killing a target too quickly can skip a trigger.
5. **Hidden reputation and fragile refusals.** Delivery/rescue quests can cost standing; refusing a castle NPC can
   break the main story.
6. **Gates that are not explained by the quest.** Questlines have level, prior-line, online, registered-account and
   event gates; DFO letters arrive only in town, outdoors, by day, at most one per character hour.
7. **DFO differences no classic guide covers.** Online failure costs no faction standing; clocks charge played time;
   online delays are shorter; quest dungeons are private full-size instances; quests can be shared with a party.

The full ranked list with citations is in the quest research report.

## Decisions

### The guide is a browser, not 265 near-duplicate pages

Classic Daggerfall has many generated quests with randomized towns, dungeons and NPCs. Writing one fixed walkthrough
per generated quest would be wrong, and copying UESP's per-quest pages would produce a lot of pages that say the same
thing. The guide therefore has:

- **A complete index** of every player-facing quest (265-pack minus 21 DFU demo scripts, plus 39 online questline steps
  = 283) with category, giver/questor, requirement, time, place type and reward.
- **Fixed pages** for named quests and lines (main story, the 14 online questlines, cures, tutorial, Daedric quests and
  the named classic quests) — hand-written, 600–1,300 words.
- **Pattern pages** for generated quest families (Fighters Guild hunts, Mages Guild fetches, temple errands, noble
  deliveries, and so on) — 400–600 words plus a "what varies" table; every generated quest points at its pattern.
- **A stable anchor per quest** (`/quests/#<id>`) so a search result, a Discord answer or the future guide assistant
  can deep-link the exact quest even before its fixed page exists.

The first implementation is the `/quests/` browser: complete index, filters, source facts, sheet objectives for main
and questline steps, pattern guidance and a recovery ladder. The fixed-page layer now covers the main-story overview,
Lady Brisienna, **all 14 questlines** (every step has a full guide) and **all 14 generated-quest families** (Fighters,
Mages, temples, Thieves, Dark Brotherhood, knightly orders, nobles, commoners, merchants, covens, vampires, Daedric,
cures and tutorial). A test asserts that every questline step and every generated category has a page on disk; every
browser record points at its fixed or pattern guide.

### Page contract

Every fixed quest page follows the handbook's normal page anatomy plus these blocks, in this order:

1. Title and one-sentence summary.
2. **Quest facts** table: type; giver/where; opens when; how it reaches you; time limit; can it fail; rewards; permanent
   choices; instance/party.
3. At a glance (3–5 actionable bullets).
4. How you get it; before you accept.
5. Quick walkthrough (numbered, spoiler-light) and detailed walkthrough (per beat, with `###` headings).
6. Journal and HUD: what the quest text names, what it omits, what to write down.
7. Time, travel and rest: deadline vs delay; online played-time rule.
8. Choices that matter (choice → immediate effect → later effect → reversible?).
9. Rewards and reputation (online and offline), unlocks.
10. If it breaks or you get stuck: a numbered triage ladder.
11. Known bugs at the verified commit; online/party notes.
12. Next and Sources.

Stable anchors required on every page: `#walkthrough`, `#choices`, `#rewards`, `#bugs` (and `#facts` where there is a
facts block). Generated pattern pages use the same recovery ladder and callouts.

### Source and spoiler rules

- Quest names, ids, objectives and outcomes come from the pinned pack and DFO's questline sheets
  (`upstream/snapshot-e4f093166/vendor/dfu-quests`, `src/systems/questlines/`). The guide paraphrases; it does not
  reproduce message panels or journal prose.
- Generated locations are described as generated: the page tells the player what to read in the journal, never a fake
  fixed pin.
- Numbers and rules are checked against `e4f093166`; each page says so near the title.
- The quick path avoids story twists; the detailed section may spoil. A choice table names the permanent ones.

### Freshness and trust

- Per-page "checked against" near the title, not only in the footer.
- A quest-data section in *What changed* after each sync: new quests, changed gates, changed rewards, fixed quest bugs.
- A correction route on each page (the existing "How this guide is checked" page and Discord/issue links).
- The assistant (next document) must stamp the corpus commit and be rebuilt after every sync.

## Implementation

- `handbook/tools/extract-quests.mjs` — parses the pinned DFU quest pack and DFO's 14 questlines/39 sheets into a
  public, dialogue-free index plus a local full extraction.
- `handbook/tools/build-quest-index.mjs` — turns the local extraction into `handbook/quests/quests.json`, the compact
  browser index (283 quests; no message text).
- `handbook/tools/quest-plugin.mjs` — builds `/quests/`, the data file and browser assets, and adds one search record
  per quest.
- `handbook/theme/quests/{quests.js,quests.css}` — index, filters, deep links, quest facts, sheet objectives,
  pattern guidance and recovery ladder.
- Tests: `handbook/tools/test/quests.test.mjs` (parser/data) and `quest-browser.test.mjs` (coverage, public data
  shape, plugin records).

## Open decisions

- **Fixed-page order:** Privateer's Hold, Instructions from the Empire, The Court Crafter, Written in the Stars, then
  the Fighters/Mages/temple templates, then the Bay's Troubles and the Burning Doors.
- **Spoiler policy** for main-story twists and Daedric quests: the quick path avoids them; the detailed sections do not.
- **DFO recovery promises:** online save/reload/abandon behaviour is not yet verified; the recovery ladder deliberately
  does not promise a reload until it is tested.
- **Map pins:** the browser does not yet deep-link a generated location (it cannot — the location is per character).
  Fixed quests can get pins once the map build exposes a pin API.
