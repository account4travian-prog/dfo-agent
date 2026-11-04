# What DFO Online is

*Studied at DFO Online commit `bc80d4ee` (2026-10-13) and Daggerfall Unity commit `2343305d` (2026-09-14).
Paths like `src/systems/races.js` are inside `upstream/daggerfall-js-source/`.*

## The short version

**DFO Online** is a browser remake of *The Elder Scrolls II: Daggerfall*. You play it with your own
copy of the game files (ARENA2). Your fork `account4travian-prog/daggerfall-js-source` is a copy of
`Lattymoy/daggerfall-js-source`. The project has gone by several names, in this order: Daggerfall
JavaScript, Daggerfall Enhanced, Daggerfall Online, then DFO Online (2026-10-11). In the code it is
still `project-dagger`. You can play it at https://daggerfalljs.dev/, and a desktop app (Electron)
is released from every push to `main`.

DFO did not reverse-engineer Daggerfall itself. It **translates Daggerfall Unity (DFU)**, the
open-source C# recreation in your other fork, into JavaScript, line by line. The rendering is
rebuilt by hand on WebGL2.

## Three layers

To answer "is this still like Daggerfall?", ask which layer a rule belongs to:

| Layer | What it is | How "Daggerfall" it is |
|---|---|---|
| **1. The port** | DFU's game logic, translated as literally as possible: formulas, character creation, magic, quests, items, guilds, crime, banking. The project's constitution (`bible/01-Overview/Port-Doctrine.md`) says: "translate logic verbatim... keep original constants and table values byte-exact." | DFU's rules. Where DFU fixed or changed classic Daggerfall, DFO inherits the change (the High Elf case is one). |
| **2. Bundled mods, on by default** | About 50 DFU and Morrowind mods, ported "1:1": Physical Combat And Armor Overhaul, Roleplay & Realism (and its Items half), Meaner Monsters, Unleveled Loot, Climates & Calories, Travel Options, Dynamic Skies, Oblivion Remaster-like Leveling and many more. The list and licences are in `bible/01-Overview/Mod-Registry.md`. **"Every mod on by default"** (MO1, 2026-09-12). | Changes a lot. Combat in particular runs on the overhaul's formulas, not DFU's. |
| **3. DFO's own systems** | Things neither Daggerfall nor DFU have: online play (shared world, parties, guilds, trading, world bosses), Master Skills past 100, Renown, Arcane Specialisations, loot rarity and powers, gem sockets, sigil armour sets, professions and crafting, horses and wagons, ships, a Living World for NPCs, legacy/heirs, an anti-cheat "Realm". | New. Mostly online-only, and the code says so. |

## Online and offline

Every character is created for one of two "lanes", and the rules differ between them:

- **Offline**: your save is the authority. Mods can be switched off. Daggerfall's rules apply wherever a
  mod or DFO system doesn't override them.
- **Online**: the server is the authority (`bible/06-Systems/Realm-Arc.md`). Every bundled mod is
  **forced on** (`src/systems/onlineLane.js`), and DFO's balance changes apply. Some examples:
  - **Master Skills** is always on: five skills may go past 100, up to 200 (`src/systems/masterSkills.js`).
  - **Renown** adds +3 health and +2 magicka per Renown level on top of the character's own
    (`src/net/renown.js`, `src/systems/renownLayer.js`). Offline it doesn't exist.
  - **Resting takes no time**, and it restores magicka even for classes with "Inability to Regenerate
    Spell Points" (`src/systems/rest.js`).
  - **Fast travel is gone**, replaced by a Portal Stone and other travel options
    (`bible/06-Systems/Portal-Stone.md`).
  - The Balance arc (`bible/05-Combat/Balance-Arc.md`, BAL1-BAL9) retuned combat, the curses and
    loot, and gave Destruction "spell power".
  - Offline characters can't bring wealth into the online world freely (the Realm's "customs").

## Why it is hard to keep track of

The project is very new and moves very fast:

- The first commit was on **2026-07-02**. By 2026-10-13 there were **8,525 commits**, about 3,150 of
  them in October alone.
- It has about **1,900 source files** (~730,000 lines of JavaScript) and about **3,200 test files**.
- It is developed mostly with AI agents: branch names like `claude/festive-heisenberg-...`, PR
  descriptions written by the agent, and a "bible" of 432 documents. Most of those documents are
  audits, bug-report write-ups and design records. The owner is "Mac" (GitHub `Lattymoy`); players
  report bugs on a Discord, which the bible quotes.
- Many rules carry a **date and a quote** of the owner's request (e.g. `ABSORB-NERF (2026-09-30,
  Discord: "Nerf spell absorption, it breaks the game")`). That's useful: the code itself records
  *why* a number is what it is.

## How to read the project

- **Start at `bible/Home.md`**. It holds the project's process rules, which every change must follow.
- **`bible/01-Overview/Port-Ledger.md`** is the record of differences from DFU:
  - section A: approved departures from DFU;
  - section B: DFU quirks kept on purpose;
  - section C: DFU features not yet ported.
- **`bible/01-Overview/Active-Arcs.md`** lists every feature arc, newest first.
- **The code comments are the best documentation.** Nearly every rule names the DFU C# file and line
  it came from, and every deliberate change is labelled with a slice code (`BAL9`, `REST-MANA1`, ...)
  that you can search the bible for.
- The tests (`test/`) pin DFU's numbers. The project's rule "A PIN MUST FAIL" requires every test to
  break if the law it pins is changed by a single character.

## Where to look for a given topic

| Topic | Code | Bible |
|---|---|---|
| Character creation | `src/systems/chargen.js`, `chargenSession.js`, `customClass.js`, `specialAdvantages.js`, `biography.js`; UI `src/ui/chargen.js` | `04-Characters/Characters-Arc.md` |
| Races | `src/systems/races.js` | - |
| Saving throws, resistances | `src/systems/spellcast.js` (`savingChance`), `src/systems/effects.js` | `05-Combat/Combat.md` |
| Combat formulas | `src/combat/formulas.js` (DFU), `src/combat/pcaao.js` (the overhaul, default) | `05-Combat/Physical-Combat-Overhaul.md`, `Balance-Arc.md` |
| Leveling | `src/systems/advancement.js`, `oblivionLeveling.js`, `skillSoftcap.js`, `masterSkills.js` | `06-Systems/Oblivion-Remaster-Leveling.md` |
| Magic schools past 100 | `src/systems/spellPower.js`, `arcanePaths.js`, `arcanePowers.js` | `06-Systems/Arcane-Specialisations.md` |
| Loot | `src/systems/lootRarity.js`, `lootPowers.js`, `unleveledLoot.js` | `06-Systems/Loot-*.md` |
| NPCs | `src/characters/`, `src/ai/` | `06-Systems/Living-World*.md`, `12-Enhanced-AI/`, `04-Characters/Morrowind-NPCs.md` |

## A note on the game files

ARENA2 is freeware but not redistributable. DFO never commits it, and that rule extends to *renders*
of the game's art. This workspace follows the same rule: `planner/data/game-data.json`, which is
extracted from your copy, is gitignored.
