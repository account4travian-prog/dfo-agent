# Quest guide research — Track B

Status: complete (timeboxed, ~30 minutes of web research plus snapshot reading). This is a research report only: no handbook content was edited. Scope: how Daggerfall players actually use quest guides, where they get stuck, what formats exist, and what a DFO Online quest-page template and pilot list should look like.

---

## 1. Method and source table

I searched for Daggerfall quest guides, quest troubleshooting and "stuck" threads, then fetched the reachable pages. Live `forums.dfworkshop.net` is behind Cloudflare (HTTP 403), so forum threads were read through Wayback Machine snapshots. Reddit served a login wall and YouTube returned no readable description text; both are recorded as limits rather than sources. DFO's own site has no quest guide, so DFO-specific behaviour was grounded in the workspace snapshot (`upstream/snapshot-e4f093166/`) and the project's own design notes.

| # | Source | Type | What it gave | Limits |
|---|---|---|---|---|
| S1 | [UESP: Daggerfall:Quests](https://en.uesp.net/wiki/Daggerfall:Quests) | Wiki index | 227 classic quests, sorted by faction; side quests have no official names; "running in the background" quests; unofficial/mod quests called out to avoid confusion | Classic only; no DFO differences |
| S2 | [UESP: Quest Related Hints](https://en.uesp.net/wiki/Daggerfall:Quest_Related_Hints) | Wiki guide | Time limits, reputation effects, dungeon maps/doors/obstacles/dressing, attacking quest targets without killing them, quest items (green background, sold = unrecoverable), finding people, delivery/rescue quests, twisting endings, the "your own house" location bug | Classic mechanics; advice quality variable (page flagged for cleanup) |
| S3 | [UESP: Reputation General](https://en.uesp.net/wiki/Daggerfall:Reputation_General) | Wiki table | Success: +5 questgiver faction, +2 associated. Failure (time limit): −2 / −1 | Tiny page, classic only |
| S4 | [UESP: A Special Substance](https://en.uesp.net/wiki/Daggerfall:A_Special_Substance) | Wiki quest page | The classic per-quest page anatomy: infobox (location, reward, reputation, ID, required reputation, difficulty), Quick Walkthrough, Detailed Walkthrough, Reward, Reputation tables, Enemies, Notes, Additional Dialogue, Quest Log stages. Also: two-stage delivery with tight time limits, horse/fast travel advised | Dynamic names/towns; DFO values differ |
| S5 | [UESP: DFQFIX](https://en.uesp.net/wiki/Daggerfall_Mod:DFQFIX) | Wiki patch documentation | A catalogue of real quest failure modes: time limits never starting, too-short tutorial timer, missing quest locations, locked doors with no Open/lockpick, NPCs disappearing forever, rewards flagged as quest items and vanishing, wrong or absent journal locations, duplicated map IDs crashing saves | Classic bugs; some fixed by DFU/DFO source, some not |
| S6 | [UESP: Daggerfall:Videos](https://en.uesp.net/wiki/Daggerfall:Videos) | Wiki index | The video-guide format players use: multi-part dungeon walkthroughs (Mantellan Crux 1–5, Laboratory of Tiuthan I–II, per-faction quest videos) for exactly the content text cannot convey | Index only; YouTube descriptions unreadable |
| S7 | [DFWorkshop: "Cannot find any quest item" (t=4013)](https://web.archive.org/web/20240829105957/https://forums.dfworkshop.net/viewtopic.php?t=4013) | Forum thread (archive) | Quest item behind a secret passage; use the 3D map to spot secret doors; `tele2qmarker` console last resort; toggling Smaller Dungeons *after* taking a quest breaks item placement | 2020 thread, DFU era |
| S8 | [DFWorkshop: "Can't start any quest from the game" (t=4106)](https://web.archive.org/web/20240101014528/https://forums.dfworkshop.net/viewtopic.php?t=4106) | Forum thread (archive) | "No quests offered" can be a damaged install (missing `StreamingAssets/Quests`), not a gameplay gate — a good support-triage case | Not a quest mechanic |
| S9 | [DFWorkshop: "Please is there anyway to increase more time on Quests?" (t=2704)](https://web.archive.org/web/20231231235507/https://forums.dfworkshop.net/viewtopic.php?t=2704) | Forum thread (archive) | Pure time-limit anxiety: "I feel so stressed with timed quests and usually fail to deliver objects." Community fixes: reckless travel, Recall anchor at questgiver, small province, coin piles to mark cleared rooms, click everything, left/right maze rule, healing to cut rest time | 2019, classic/DFU |
| S10 | [DFWorkshop: "Support with final quest" (t=5206)](https://web.archive.org/web/20231231125930/https://forums.dfworkshop.net/viewtopic.php?t=5206) | Forum thread (archive) | A player stuck on the Mantellan Crux skull puzzle; the answers were "check UESP" and, in the end, the player used the console teleport: "this last dungeon is simply impossible to me" | Classic main quest; one player's experience |
| S11 | [Steam: "Guía básica pero útil antes de empezar a jugar al Daggerfall"](https://steamcommunity.com/sharedfiles/filedetails/?id=3086442181) | Steam guide | A long general beginner handbook, not per-quest. Explicit pain points: random quests send you to non-existent towns; random main-quest items drop from random monsters and can bug out of bounds; an innkeeper false-accusation quest can wreck reputation; refusing a castle NPC's quest can permanently break the main quest; only 6 save slots; screenshot the quest offer because the journal does not repeat everything | Spanish; classic/DFU; one author's experience |
| S12 | [Ludo.guide: "V.2 — Quests and Reputation"](https://www.ludo.guide/guide/the-elder-scrolls-ii-daggerfall/v-2-quests-and-reputation-032) | Modern web guide | Format: quick summary + short sections + bullet tips. Advice: one dungeon quest at a time, save before accepting, decline is free, 5 rep per quest, reputation normalises to zero at 1 point/month, quest type matters more than length | Secondary guide; classic only |
| S13 | [Ludo.guide: "VII — The Main Story"](https://www.ludo.guide/guide/the-elder-scrolls-ii-daggerfall/vii-the-main-story-042) | Modern web guide | Main-quest format: quick summary, numbered walkthrough, then Tips. Facts: 24 quests, 18 mandatory, non-linear, levitation/jump/climb needed, many level requirements, refusing castle quests can break the run, "easy to fail" | Secondary; classic only |
| S14 | [DFO Online site](https://daggerfalljs.dev/) | Official site | "Quests: 265 of them, running on the game's own scripts and tracked in the journal." Also confirms browser/desktop play and that the official links are the game, Discord, source and issues | No quest guide, no quest details; site commit is newer (`bad8ded8f0cb`) than the handbook snapshot |
| S15 | Workspace design notes: `docs/23-playing-online.md` lines 164–203, `docs/32-questions.md` lines 28–33 | Project docs (verified research) | DFO's questline overhaul: objectives/branches, quest gear choice of three, failing costs no standing online, guild quest ladders, letters arrive one per character hour (about seven real minutes), letters only in a town/outdoors/by day, next step needs a town building or waits a day (about two real hours), Questlines tab; Renown per quest 75 + 30 × character level; quest dungeons are private instances | Project's own summary; not community-observed |
| S16 | Snapshot: `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js` | Game source | 14 questlines, 39 steps; gates `level`, `after`, `online`, `account`, `event`; steps have `needs` (lootRarity, kingsGambit, naval, renown, starfall); line titles/givers | Code at the verified commit |
| S17 | Snapshot: `src/systems/quest/quest.js`, `quest/clock.js` | Game source | Online a failed/unfinished quest costs **no faction standing** (`failureFree`); deadlines charge **played time only**, with one frame capped at 30 world minutes; online **delays** are cut once to `ONLINE_DELAY_SECONDS` = 24 character minutes (about two real minutes of play) | Code at the verified commit |
| S18 | Snapshot: `src/systems/quest/questShare.js`, `questRepair.js` | Game source | Quests can be shared with party members; online dungeons are laid at the world's size, and running quests are re-laid when the layout differs (so a quest dungeon can differ from an offline save) | Code at the verified commit |
| S19 | Snapshot: `src/systems/quest/onlineRepute.js`, `onlineGuard.js` | Game source | Online, two guild quests (Guard the Guild, Protect an Honored Mage) wait for the guild's standing; guards of a guarded quest use an arrival-based window online (~1 minute after arrival, one game hour) | Code at the verified commit |
| S20 | Snapshot: `src/systems/features.js` (quest herald), `src/ui/quest/*` | Game source | DFO's quest UX: a notice for quest start/journal entries/deadlines, a Questlines journal/rail, "Time remains" from the quest's own journal; useful for the "what the journal tells you" section | Code at the verified commit |

Not reachable / not used: Reddit r/Daggerfall (login wall), YouTube descriptions (no readable text), DFO Discord (no access), any DFO wiki (none exists). The live DFWorkshop forum may contain newer threads than these archived ones.

---

## 2. What formats players actually use

1. **Wiki quest page (UESP pattern).** Infobox → Quick Walkthrough (3–6 numbered steps) → Detailed Walkthrough → Reward → Reputation gain/loss → Enemies → Notes → Dialogue → Quest Log stages. Players use this as the lookup when a quest is already underway; the quick walkthrough is the most-scanned part.
2. **"I'm stuck" forum post.** Short question, one specific symptom ("cannot find any quest item", "can't start any quest", "can't finish Former Student III"), answered by a veteran with one fix or a UESP link. These are the highest-signal pain-point records.
3. **Video walkthrough of a dungeon.** Multi-part videos for the Mantellan Crux and other mazes (S6); players watch a specific room/puzzle, not the whole quest.
4. **General beginner handbook (Steam).** Long prose guide with character creation, travel, guilds, magic, money, reputation and a "weird bugs" section. Players read this once, before playing, and search it for tips.
5. **Modern chapter guide (Ludo).** Quick summary + numbered walkthrough + bullet tips, one page per quest or story part; clean web layout, community-verified claim.
6. **Console/command answers.** `tele2qmarker`, `teleport`, Alt+F11 (stuck position) are the community's emergency layer. A DFO guide cannot copy these directly (online is browser/account play) but should name the in-game equivalent or say there is none.
7. **Screenshot-your-quest-text habit.** The Steam guide explicitly tells players to screenshot the quest offer because the journal does not repeat the region, place, person and time limit together (S11). That is a design signal about the journal.

What guides do **well**: the UESP quick walkthrough and infobox are excellent for scanning; Ludo's summary + tips is a good modern shape; Steam guides carry the practical survival warnings that wikis omit. What they do **poorly**: almost none are organised around failure recovery or "what to do when it breaks"; generated-quest pages show dynamic placeholders that look like facts; reputation tables are enormous; DFO differences are absent everywhere; and no guide tells a new player which quests to take first.

---

## 3. Ranked pain points (with citations)

Ranked by how often they appear across sources and how much a guide can fix them.

1. **Time limits and travel time** — "I feel so stressed with timed quests and usually fail to deliver objects" (S9); UESP warns that "the way you are traveling to destinations must be considered before embarking" (S2); Ludo says "the given time may seem generous, [but] travel and resting in dungeons can consume significant time" (S12); DFQFIX documents timers that never start, timers too short to finish the tutorial, and quests that stay open forever (S5). Multi-stage deliveries with "very tight" limits are a named example (S4). **Guide implication:** every timed quest page needs a time-limit block, a travel plan and an online clock note.
2. **Finding the quest item / the dungeon is too big** — the single most common forum symptom: "I can't find any quest items in dungeons… it's pretty gamebreaking" (S7); answer: secret passage behind the map's visible door, use the 3D map, last resort teleport. UESP devotes sections to doors, hidden doors, switches, portcullises, obstacles and "quest items can look like dungeon dressing" (S2). The Steam guide lists maze tactics and a teleport spell (S11). **Guide implication:** "where to look" and "what it looks like" are more valuable than a route; include a stop-and-check checklist and note what a private instance changes.
3. **The journal does not tell you enough** — players are told to screenshot the NPC's instructions "because later you'll look in the log and it won't have everything you need" (S11); UESP has a whole "Finding People" procedure and DFQFIX lists wrong or missing journal locations (S2, S5). DFO improves this with a Questlines window and deadline display (S20), but the underlying oddity remains. **Guide implication:** every page should state what the journal records and what the player must note themselves.
4. **A quest breaks and the run is stuck** — UESP hints: selling a quest item makes it unrecoverable; leaving a quest target at low health or killing it too fast can skip a trigger ("stronger characters may kill the target with a single hit… making the quest impossible") (S2); DFQFIX is a long catalogue of NPCs who vanish, rewards that disappear and quests that never close (S5); the Steam guide warns that refusing a castle NPC's quest can permanently break the main quest and that random main-quest items can spawn out of bounds or bug when the carrier dies (S11). **Guide implication:** every page needs a "known bugs and recovery" section and a clear "this is permanent" callout.
5. **Reputation consequences, including hidden ones** — success/failure tables (+5/+2 vs −2/−1) (S3); rescue quests can secretly cost reputation with the Thieves Guild or Dark Brotherhood, and expulsion is permanent (S2); failed quests cost standing and NPCs greet you differently (S4); reputation decays to zero over months (S12). DFO changes this online (no standing loss on failure, S17), which removes one stressor but makes classic advice misleading. **Guide implication:** state reputation effects separately for online and offline.
6. **Getting the quest to start at all (gates)** — thread after thread asks why no quest is offered (S8 is the extreme case: a damaged install). Real gates in classic are level/rank/standing; Ludo notes many main quests have level requirements and refusing castle quests can end the run (S13). In DFO the gates are explicit and displayed: level, account, prior line, event, and feature `needs` (S15, S16); the project's own FAQ has "Why haven't my questline letters arrived?" (S15, `docs/32`). **Guide implication:** a "before you accept" block listing level/rank/account/letter conditions and where to see them.
7. **Generated quests send you to places that do not work** — UESP documents the town bug where a quest with two houses produces only "(your name) house" and the quest cannot be completed (S2); the Steam guide hit a wedding location that did not exist and a random quest sending them to a non-existent town (S11); DFQFIX's missing-location entries are the same class of problem (S5). **Guide implication:** do not present generated-quest locations as fixed; teach the player to read the offer, check the map/quest marker, and recognise a broken location.
8. **Rewards are unclear or vanish** — DFQFIX: several classic rewards are still flagged as quest items and disappear when the quest ends, and taking some gold "directly from the inventory" can destroy it (S5); UESP notes some quest items can be kept and some cannot (S4). DFO now offers a choice of three gear pieces and pays Renown (S15). **Guide implication:** exact reward block plus "what you may keep" and the online gear-choice behaviour.
9. **Dungeon size, instances and shared rooms** — classic players complain about huge dungeons (S6, S10); online DFO turns this into "public or your instance" and quest dungeons are private full-size copies (S15). Players who don't know this fight through half-cleared public rooms or miss the private door. **Guide implication:** an online-instance box on every dungeon quest page.
10. **The main quest is fragile and non-linear** — 24 quests, 18 mandatory, branching, "easy to fail", many level gates, levitation needed (S13); one refusal can break it (S11); final dungeon puzzles send players to video/console (S10). **Guide implication:** main-quest pages need spoiler-light order guidance, a "do not refuse these" warning, and a recovery/save checkpoint.
11. **Locked doors and missing traversal tools** — no Open spell or lockpicking means quest doors may be impassable; DFQFIX repeatedly unlocks quest doors as a fix (S2, S5); the Steam guide recommends Open/Levitate/Buoyancy for dungeons (S11). **Guide implication:** "what to bring" list per quest, including spells/scrolls.
12. **Mods and installs breaking quests** — Smaller Dungeons toggled after accepting a quest (S7); a quest pack/mod conflict on a specific quest (search result: "Former Student Part III Quest not finishing [RESOLVED, MOD-RELATED]"); missing quest files from a bad install (S8). **Guide implication:** a support-triage clause ("if no quest works at all, this is not a gameplay problem") and a "before you report a bug" checklist.

---

## 4. Where DFO Online differs from classic Daggerfall (notes for the guide)

This is the material that no existing Daggerfall guide covers, and it must be part of every DFO quest page.

1. **Two quest pools.** DFO keeps the classic quests ("265 of them, running on the game's own scripts and tracked in the journal", S14) and adds 14 questlines with 39 steps (S16). The questlines are DFO-authored introductions and endgame stories; the classic pool supplies the random guild, temple, noble, Daedric and main-quest content.
2. **Questline gates are explicit and displayed.** A line opens on `level`, `after` another line, `online`, `account` (registered, not guest) or `event` (Starfall) (S16). Some steps additionally wait on a feature `needs` — Loot rarity, King's Gambit, Naval Combat, Renown 10 for revenants, the Starfall event — and the step waits, saying so, rather than starting and failing (S16). The Questlines tab lists what each line waits on (S15).
3. **Letters arrive on a clock and in a place.** At most one new line begins per hour of the character's clock (about seven real minutes online), never while another first letter is in flight, and a courier hands a letter over only in a town, outdoors, by day (S15, `docs/23`). If the next step needs a building that the current town lacks, it says "its next step could not begin here" and retries after a day of character time (~2 real hours) (S15). **This is the single biggest practical difference for quest planning.**
4. **Online failure is free.** A failed or unfinished quest costs no faction standing online (`quest.js` `failureFree`, S17), where classic applies −2 and propagates it (S3). Offline DFO keeps the classic cost. A guide must not tell an online player that failure is costly, or an offline player that it is free.
5. **Clocks behave differently.** Deadlines (the quest's own "you have N days") run on **played** world time online: resting, waiting and travel raises are forgiven, and one frame can charge at most 30 world minutes (`clock.js`, S17). Delays ("come back in three days", letters) are cut once to 24 character minutes — about two real minutes of play (S17). So "time limit" and "wait" are different animals online and the page should say which one it is.
6. **Quest dungeons are private instances.** When a quest names a dungeon or building, the door offers Public or Your instance; your instance is yours and your party's, at full size (public dungeons are built smaller online), and it remembers what you cleared (S15). Quest sharing and layout repair mean a quest can be shared with the party, and an online dungeon is laid at the world's size (`questShare.js`, `questRepair.js`, S18).
7. **Two classic quests are reputation-gated online.** Guard the Guild and Protect an Honored Mage wait for the guild's standing (S19), and guarded quests use an arrival-based watch window online (~1 minute after arrival, one game hour) (`onlineGuard.js`, S19).
8. **Rewards are structured.** Quests pay Renown (75 + 30 × character level, S15), and a gear-paying quest offers a choice of three pieces — weapon, armour, jewel — with tier 1–2 Magic and 3–4 Rare, higher at higher guild rank (S15). Classic guides describe random gold and a fixed item instead.
9. **Better quest UX.** DFO has a Questlines window/rail, a quest herald that announces start/entries/deadlines, and a "Time remains" display from the quest's own journal entries (S20). Pages can tell the reader where to look instead of "check your journal".
10. **Recovery is unresolved and must be checked before writing.** Classic guides lean on saving and reloading (S12, S11). DFO online characters are saved through the browser/desktop app (S14) and have quick save/load defaults (F9/F11, S14 site controls), but the interaction between online quests, party-shared copies, death and reload has not been verified for this report. The template below asks for a recovery block; **what belongs in it needs an in-game check** before any quest page ships.

---

## 5. Proposed DFO quest-page template

Two page types, because classic Daggerfall has 227 quests (S1) and many are generated from templates with dynamic names and locations. Writing one fixed page per generated quest would be wrong. Write one page per fixed quest and one page per **quest template** (quest type).

### 5.1 Page types

- **Fixed quest page** — hand-authored quests: main quest parts, DFO questline steps, Daedric quests, invitations. 600–900 words; 1,000–1,300 for main-quest chapters and questline overviews.
- **Quest template page** — one page per generated pattern, e.g. "Fighters Guild: kill the beast", "Mages Guild: fetch the item", "Temple: deliver the relic", "Noble: smuggle and deliver". 400–600 words plus a "what varies" table. Explains how to read the offer and where the randomness lives, instead of pretending every instance is the same.

### 5.2 Front matter

```yaml
---
title: The Missing Prince
summary: Lhotun's brother is missing, the trail runs through a random dungeon, and the journal may not record where.
stage: rivals            # the stage at which the quest is first available
order: 20                # gaps of 10 inside the quest chapter
gate: quest "The Missing Letter"   # level N | renown N | quest "Title" | other "after The Burning Doors"
tags: [quest, main-quest, wayrest, dungeon, random-location]
verified: e4f093166
status: draft
---
```

### 5.3 Required page blocks

1. **Quest card table** (directly under the title, before At a glance):
   | Field | Value |
   |---|---|
   | Type | Main quest / guild random / temple / noble / Daedric / invitation / DFO questline |
   | Given by, and where they stand | name + building/region |
   | Opens when | level / rank / Renown / account / prior quest / event / feature requirement |
   | How it reaches you | courier letter (and where it can arrive) / hall / direct conversation |
   | Time limit | none / deadline (duration) / delays (what kind) — with the online rule |
   | Can it fail? | yes/no; what counts; what failure costs online and offline |
   | Rewards | gold formula + gear choice tiers + Renown + reputation + title/key/item |
   | Permanent choices | yes/no, and which |
   | Instance / party | private quest dungeon, public, party-shareable |
2. **At a glance** (3–5 bullets): the one thing that gates it, the one thing that gets players stuck, the one thing not to do, and where to recover.
3. **How you get it** — the gate, the letter rule, the building requirement, and what to do if it does not appear.
4. **Before you accept** — level/rank/standing, spells or tools (Open, Levitate, healing, horse), gold, empty inventory space, party, and a note to read the offer twice.
5. **Quick walkthrough** — numbered, spoiler-light, 4–8 steps, one line each.
6. **Detailed walkthrough** — by beat or stage, not by map tile. Use "if you see X, do Y" phrasing. Include what the item looks like, where it hides (secret doors, dressing, locked doors), and how the objective updates.
7. **The journal and the HUD** — what the quest text names (region, place, person, time), what it omits, what to screenshot or write down, and where DFO's Questlines tab / herald / Time remains show it.
8. **Time, travel and rest** — a plan in the player's own order: travel mode, stop-at-inn vs cautious, when to rest, whether the clock is a deadline or a delay, and the online played-time rule.
9. **Choices that matter** — a small table: choice → immediate effect → later effect → reversible? This is where hidden reputation losses and quest-breaking refusals live.
10. **Rewards and reputation** — exact online and offline values, what can be kept, and what disappears.
11. **If it breaks or you get stuck** — a numbered triage ladder: re-read the offer; check the Questlines list; check the 3D map for secret doors; confirm you are in the right instance; leave the dungeon and return; check known bugs; reload a save if available; report it. This is the section almost every existing guide lacks.
12. **Known bugs at `e4f093166`** — dated list with workaround and whether the source fixed it. If unknown, say so.
13. **Online and party notes** — gates, clocks, failure-free, private instance, quest sharing, two reputation-gated quests.
14. **Next** — the questline overview or the next quest; never a dead end.
15. **Sources** — snapshot files/symbols for rules; UESP/Docs only for classic context and design intent (per the handbook's style rules, game source wins).

### 5.4 Callouts to standardise

- `> [!warning]` — permanent choice or run-breaking refusal.
- `> [!tip]` — the "do this before you accept" action (read twice, note the location, bring Open, bank gold).
- `> [!online]` — DFO difference (clock, failure, instance, account gate).
- `> [!example]` — a worked timing or reward calculation, labelled as an example.
- `> [!note]` — a known bug with its workaround.

### 5.5 Length and writing rules

- Fixed quest: **600–900 words**; main-quest chapter/questline overview: **1,000–1,300**; quest template: **400–600** plus table.
- One page = one quest or one pattern. Do not merge three quests into a "guild quests" page unless the content is genuinely shared.
- Spoiler-light by default: the quick walkthrough gives the shape; the detailed section may spoil, and that is what it is for.
- Build-agnostic: name what a warrior, a caster or a thief may need differently (Open/Levitate/stealth), not one build's route.
- Every number and rule from the snapshot, with `verified: e4f093166`; classic UESP facts only for context, cited as external sources.

---

## 6. "Questions every quest page must answer" checklist

Use this before marking a quest page complete. A page that cannot answer a line should say "the source does not state this".

1. Who gives the quest, and where do they stand?
2. What opens it — level, Renown, rank, registered account, prior quest, event, feature?
3. How does it reach the player — letter, hall, direct conversation — and can the letter be blocked?
4. What must the player have before accepting (spells, tools, gold, rank, party, inventory space)?
5. What is the objective in one sentence?
6. Is the destination fixed or generated? If generated, what varies and how does the player learn it?
7. Which region, town, building and dungeon type does it use?
8. Is there a time limit? Deadline or delay? How long, and what starts the clock?
9. What does that clock do online (played time, short delay) vs offline?
10. Can it fail? What exactly counts as failure?
11. What does failure cost online and offline (standing, reward, item, later quests)?
12. What choices exist, which are irreversible, and what do they change now and later?
13. What is the exact reward — gold, gear choice/tier, Renown, reputation, title, key, item?
14. What reputation changes happen on success, failure and each choice, and with which factions?
15. What does the journal record, and what must the player write down or screenshot?
16. Where do players get stuck here, and what is the fix order?
17. What are the known bugs at this commit, their workarounds, and whether the source fixed them?
18. Does it need a private instance, a public dungeon or a party?
19. What differs in DFO online from classic Daggerfall for this quest?
20. What should the reader do next (questline overview, next quest, or recovery page)?

---

## 7. Pilot list: 10 quests/types to cover first

Chosen to cover all stages, both page types, the highest-frequency pain points, and DFO-only content. Ordered by writing order (not play order).

| # | Quest or type | Page type | Stage | Why first | Evidence |
|---|---|---|---|---|---|
| 1 | **Privateer's Hold** | Fixed quest | `hold` | Every player meets it; tutorial dungeon; sets the pattern for "where do I go" and "how do I get out" | S1, S2 |
| 2 | **Instructions from the Empire** (Lady Brisienna's letter) | Fixed quest | `town` | First courier letter and first deadline; teaches letter, tavern meeting, time limit and the cost of ignoring it | S4, S13, S2 |
| 3 | **The Court Crafter** | Fixed quest (DFO line) | `feet` | DFO-only introduction; teaches registration, level 2 gate, town/building requirement and letter timing | S15, S16 |
| 4 | **Written in the Stars** | Fixed quest (DFO line) | `feet` | DFO-only; short line, non-combat, proves the template on a questline step | S15, S16 |
| 5 | **Fighters Guild hunt** (kill the beast template) | Quest template | `town`/`bay` | Most common generated quest; covers "kill in a house vs dungeon", private instance, reward choice, level scaling | S1, S2, S15 |
| 6 | **Mages Guild fetch** (item in a dungeon template) | Quest template | `town` | The canonical "can't find the quest item" complaint; covers dungeons, secret doors, dressing, and sometimes a required spell | S2, S7, S1 |
| 7 | **Temple errand/delivery** | Quest template | `town` | Town-only delivery; covers finding people, the journal gap, and hidden reputation | S1, S2 |
| 8 | **A Special Substance** (noble multi-stage delivery) | Fixed quest (classic) | `town` | Two tight deadlines, smuggling reputation effects, a full UESP model to compare against | S4, S2, S3 |
| 9 | **The Bay's Troubles** | Fixed quest / questline overview | `bay` | DFO-only, level 6, shared world; covers raids, party play, Renown and the "be in town when a step is due" rule | S15, S16 |
| 10 | **The Burning Doors** | Fixed questline overview | `rivals` | DFO endgame line; covers multi-step chains, account gate, witnessed steps and the Dagon Cycle | S15, S16 |

Wave two (do not start until the template is proven): main-quest chapters (`The Missing Prince`, `Journey to Aetherius`/Mantellan Crux), the Thieves Guild and Dark Brotherhood invitation quests, a Daedric quest, `The Old Coil`, `The Hour That Was Not`, and the full questline index page.

---

## 8. Gaps, unverified items, and decisions the Lead must make

1. **Reddit could not be read** (login wall) and **YouTube descriptions could not be read** (no text returned). The Reddit gap is partly covered by DFWorkshop threads; the YouTube gap is covered by UESP's Videos index (S6). If Reddit is required, a signed-in session or a different access path is needed.
2. **DFWorkshop was read through Wayback snapshots**, mostly 2020–2024; newer threads and the live forum may contain DFO-specific reports. The forum is Cloudflare-blocked to this session.
3. **DFO's site commit (`bad8ded8f0cb`) is newer than the handbook snapshot (`e4f093166`)**. The "265 quests" figure is site-level and should be re-checked against the snapshot before publishing.
4. **Online save/reload/abandon behaviour is not verified.** Classic guides lean on reloading; DFO's recovery block needs an in-game test before any quest page promises "reload" as a fix.
5. **No DFO wiki or public DFO quest guide exists.** The DFO-specific sections of this report come from the snapshot and `docs/`, not from player reports; they should be treated as design truth, then confirmed in play.
6. **Generated-quest variety is unbounded.** The template page approach needs a decision on how many templates to document and how to name them (by guild + verb is the suggested pattern).
7. **Spoiler policy needs an editorial decision** for main-quest pages (how much of the story the quick walkthrough may reveal).
8. **Classic values vs DFO values.** Reputation, rewards, clocks and failure costs differ; every page must label which game it describes. A short "this page describes DFO Online" banner on quest pages would prevent the common confusion.
9. **No player-data or live values** are included, per the project rules.

---

## 9. One-line recommendation

Build a **quest chapter** with two page types — fixed quest pages and quest-template pages — fronted by a quest index that teaches the four DFO-specific rules (letters arrive in town by day, deadline = played time, delays are short, failing costs no standing). Put "If it breaks or you get stuck" and "what the journal does not tell you" on every page; those two sections are what the community evidence says players actually need and what every existing Daggerfall guide under-serves.
