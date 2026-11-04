# Handoff: source research for the DFO Online Handbook

**For:** Atlas (a research swarm is ideal: every task below is independent).
**From:** Claude, 2026-10-21. **Report back to:** the files named below; the user will tell Claude when they are posted.

## What this is for

We are writing a complete, build-agnostic player's handbook for DFO Online (a browser MMO built on Daggerfall
Unity). It introduces topics in the order the game introduces them to a new player. Read
[../README.md](../README.md), [../STRUCTURE.md](../STRUCTURE.md) and [../STYLE.md](../STYLE.md) first (ten minutes).
Your job is the **research notes** each page will be written from. Claude (and Sol) turn them into pages.

## Where the truth is

- The game's source is the DFO clone at `%USERPROFILE%\Documents\DFO\upstream\daggerfall-js-source`.
- **Read branch `main`, commit `0df2d87eb`, without checking anything out.** That clone has another branch checked out
  with the user's own work in progress. Never run `git checkout`, `git switch`, `git stash`, `git reset` or anything
  that writes in it. Read with:
  - `git -C %USERPROFILE%\Documents\DFO\upstream\daggerfall-js-source grep -n "<pattern>" 0df2d87eb -- src bible server-account server`
  - `git -C %USERPROFILE%\Documents\DFO\upstream\daggerfall-js-source show 0df2d87eb:src/net/renown.js`
  - `git -C ... ls-tree -r --name-only 0df2d87eb -- src/systems/revenant`
- `src/` and `server-account/src/` (code) win over `bible/` (design records) when they disagree. Note disagreements.
- Earlier material you may start from (it is correct as of `4bba28c6c`, one sync older, and written for one specific
  character): `%USERPROFILE%\Documents\DFO\docs\23-playing-online.md` through `35-people-and-trouble.md`. Re-check
  every claim at `0df2d87eb` and drop the character-specific advice.
- No web searches, wikis, forums or memory of classic Daggerfall as a source. If the source doesn't say, write "not
  found in source".

## Mods: find the rule that actually runs online (added 2026-10-21)

DFO folds in many mods, some forced on for everyone online, some locked at their defaults, some overlapping. A base
function can exist in the code and never run online because a mod replaces it. Before you record any rule, follow
[STYLE.md: The online rule is the effective rule](../STYLE.md#the-online-rule-is-the-effective-rule): check
`src/systems/online/onlineLane.js` (`ONLINE_ROOM_MOD_KEYS`, `ONLINE_WHOLE_MODS`, `ONLINE_PLAYERS_OWN_MODS`) and read
the overriding mod's code. Example: online combat runs through `src/combat/pcaao.js`, not the classic parts of
`src/combat/formulas.js`, so to-hit, damage, racial weapon bonuses, Expertise and Adrenaline Rush all differ from the
base functions. In each note, add a line per rule saying which layer it comes from (base / port / mod name) and why
that layer is the one live online. If you already wrote notes before this section was added, please re-check them.

## Output format (every task)

Write one file per task: `%USERPROFILE%\Documents\DFO\handbook\research\<task-id>.md` (create the `research`
folder if needed). Only create your own task's file; don't edit other files in the repo.

```markdown
# <task-id>: <task title>
Commit: 0df2d87eb · Researcher: <your name> · Date: <date>

## Player-facing summary
5-10 bullets a new player needs, in plain English.

## Rules and numbers
Each claim on its own line, followed by its citation: `path/to/file.js:LINE` (`symbolName`).
Group by sub-topic. Include every number a player could notice (costs, caps, timers, chances, multipliers).

## Gates
When a player first meets this: level, Renown, registered account, quest, location, setting. Cite each.

## Where it shows in the interface
Menu paths, window names, keys, exactly as the game labels them. Cite the UI file.

## Online vs offline
Differences a player might notice. Cite.

## Changed since 4bba28c6c
Anything in this topic that changed in the 95 commits up to 0df2d87eb (`git log --oneline 4bba28c6c..0df2d87eb -- <paths>`).

## Open questions
Anything ambiguous, contradictory, or only in the bible.
```

Quality bar: **every rule line has a citation**. No citation means it gets dropped. Prefer exact constant names and
function names; they let Claude pin numbers as facts that update automatically.

## Tasks

Priority 1 first: G sets the order of the whole handbook.

**Already taken (2026-10-21):** G, C1, C2 and C3 are being researched by Claude's Codex team. Atlas: start with the
priority-2 tasks (B1 onward) and skip those four.

| ID | Priority | Title | Scope |
|---|---|---|---|
| G | 1 | Progression gate map | Every feature a player can meet, with its gate (none / character level / Renown / registered account / quest / place / setting / server event). One table row per feature, sorted by when a new player first meets it. Include questline introductions by level, Renown gates (elites, revenants, guild founding, refund costs), account gates (professions, market, guilds, festival rewards), and late content gates. This decides the stage order in STRUCTURE.md. |
| C1 | 1 | Character creation flow and races | Every creation screen in order (online client), the choices on each, defaults; the eight races: attribute modifiers, specials, resistances, online changes. |
| C2 | 1 | Classes and the custom class builder | The 18 standard classes (skills, specials, attributes); the custom class builder: skill tiers, every advantage and disadvantage with its exact effect and dagger cost online, the difficulty dagger's effect on levelling, forbidden materials/armour/weapons, spell point multipliers. |
| C3 | 1 | Attributes and skills | What each attribute does online (formulas: health, fatigue, carry, to-hit, spell points, prices...); every skill, governing attribute, how it trains, what it unlocks; level-up rules online (points per level, the health floor). |
| B1 | 2 | Account, client, skins and controls | Guest vs registered (exact list of what a guest can't do), registration and recovery codes; interface skins and their menus; default controls and the online defaults (swing mode, technique key); settings that are forced online. |
| H1 | 2 | The opening and Privateer's Hold | What happens from first login to leaving the Hold: the opening, objectives, the journal, the LeFay Monument, where you exit, which town is nearest. Death and respawn online (what you lose, where you return). |
| H2 | 2 | Combat for every playstyle | Melee (swings, directions, reach, frames), enemy tells, dodges and perfect dodges, overreach/Open, poise and stagger, shields and blocking, archery, spellcasting basics (casting, spell points, the spellbook, spellmaker online), weapon techniques for every weapon family (names, multipliers, cooldowns, how lines roll). |
| H3 | 2 | Survival basics | Inventory and weight, encumbrance, resting rules and interruptions, fatigue and exhaustion online, health/magicka regeneration, poison and disease, food and Climates & Calories, light sources and the belt lantern. |
| T1 | 2 | Towns, shops, banks and talk | Building kinds and opening hours, shop pricing (haggle formula online), Prosperity, banks (Empire account, letters, loans), taverns and rooms, the talk/topic system, reputation with the People. |
| T2 | 2 | NPC guilds and temples | Every joinable NPC guild/order/temple: how to join, rank requirements, services per rank, training cap, quests, online promotion rules; how Thieves Guild and Dark Brotherhood membership starts. |
| T3 | 2 | Law and crime | Crimes, the watch, legal standing by region, fines, courts and sentences, banishment, curfew edicts, pardons. |
| V1 | 2 | Travel | Re-verify `docs/30-travel.md` at 0df2d87eb, build-agnostic: every travel method, costs, gates, restrictions. |
| P1 | 2 | Levelling, masteries and specialisations | Masteries at 100 (career-group limits), all 30 specialisation paths (requirements, passives, signatures), skill swaps, path resets, costs. |
| P2 | 2 | Renown and the Firmament | Renown XP sources and caps, party bonus, what Renown unlocks; the whole Firmament (all seven starts, wedge themes, node tiers, point sources, caps per channel and blow caps, refunds/respec), build-agnostic. |
| P3 | 2 | Gear and loot | Rarity tiers and their odds, materials and level ramps, item lines, sets, sockets and gems, reforging, salvage and shards, repair and resale credit, Unleveled Loot online. |
| Q1 | 2 | Quests and questlines | Every questline (title, gate, giver, steps, buildings needed, rewards), letter pacing rules, guild quest ladders, private instances, failure rules online, the main quest and the Curse of Daggerfall online. |
| S1 | 3 | Playing with others | Chat commands and channels, parties (size, invites, leader), shared kill rewards, mentor mode formulas, quest sharing, shared dungeons (respawn, loot rules), duels, Arena (seasons, rating limits), reports and blocking. |
| E1 | 3 | Professions | All ten tracks (gathering and crafting), node types and climates, daily slots, seasons and Tides, stations and quality odds, ranks, the two-craft limit, specialisations (Builder, Fortifier, Siegewright...), Stores, the Materials Bag. |
| E2 | 3 | Economy | Gold, Marks, Shards, Soul Cakes, Weir Keys and other currencies; Marks faucets and caps; the market (fees, limits, couriers, Tithe); court and guild writs; homes (prices, storage, entry). |
| W1 | 3 | The wider world | Elites, champions and their traits; spawned and Elite dungeons; danger tiers by dungeon type; world events and their clocks (raids, Dagon's Breach and portents, the sea serpent, Starfall and festivals, Motherlodes). |
| R1 | 3 | Revenants and companions | Re-verify `docs/31-companions.md` at 0df2d87eb, build-agnostic. |
| R2 | 3 | Player guilds and city control | Founding, ranks and powers, vaults, chapters; seats, influence, the Turning, upkeep, edicts, sieges, fortifications. Re-verify `docs/26-city-control.md`. |
| L1 | 3 | The late game | Elite Gates and Weir Keys, Elite Breach and Redoubts, Super Dungeons, the Open Zone, the Eltheric Ocean and the Veil, Arena seasons and the Royal Tourney, Legacy heirs. |
| X1 | 3 | Reference lists | Every key binding and chat command; every daily/weekly cap and timer (re-verify `docs/27-caps-and-timers.md`); a list of 80-150 glossary terms with one-line source-backed definitions. |
| X2 | 3 | What changed in this sync | Player-facing changes in `4bba28c6c..0df2d87eb` (95 commits): one bullet each, cited, grouped by topic. |

## Please don't

- Write anything outside `handbook\research\`.
- Touch the DFO clone's working tree, branches or stash, or run its build or server.
- Copy game text (books, dialogue, quest scripts) beyond a short phrase needed to name something.
- Include images, sprites, textures, sounds or map renders from the game.
- Use or mention the user's credentials, accounts or live server data.

## When you finish

Add a line per finished task to `handbook\research\DONE.md` (create it if missing): `<task-id> · <file> · <one-line
note>`. That file is the one shared file you may append to. Then tell the user, who will let Claude know.
