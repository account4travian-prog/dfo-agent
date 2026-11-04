# The character planner

`planner/` is a character planner for DFO Online. It follows the game's own creation steps, explains
what the rules will do with a build, and exports a custom class the game can import.

## Running it

From the `DFO` folder:

```bash
node planner/tools/extract-game-data.mjs
```

Run that once, and again after a DFO update. It reads the 18 classes and their biographies from your
ARENA2 folder (the Steam install by default) **through DFO's own file readers**.

```bash
node planner/tools/serve.mjs
```

Then open http://localhost:5178/. To run the tests:

```bash
node --test "planner/test/*.test.mjs"
```

## What successful planners do, and what this one takes from them

| Planner | What players value | Taken here as |
|---|---|---|
| **Path of Building** (Path of Exile) | Exact game maths; a **breakdown** of how every number is derived; **configuration toggles** for situations (buffs, enemy type); offline; **share codes** for builds | Every resistance opens into its steps (base 50, racial, class, Willpower, clamp). The situation bar switches online/offline and the two combat rule sets. Plans travel as share links. |
| **Grim Tools** (Grim Dawn) | Link-based sharing, so a guide can say "here is my build" | **Copy share link**: the whole plan lives in the link's `#fragment`, which never reaches a server. |
| Fallout / Morrowind / Oblivion planners | Following the game's own creation screens, and **level-by-level projection** (Oblivion's "efficient leveling" calculators) | The steps mirror DFO's wizard; health is projected to a planned level; a leveling table shows what each raise costs now and later. |
| UESP's Daggerfall custom-class pages | The class-maker rules and the cost of each advantage, written down | The custom builder enforces every refusal the game has, and its costs come from DFO's own table. |

Sources: [Path of Building on GitHub](https://github.com/PathOfBuildingCommunity/PathOfBuilding),
[Path of Building guide](https://poe-vault.com/guides/path-of-building),
[Grim Tools build calculator thread](https://forums.crateentertainment.com/t/grimtools-build-calculator/38040/1),
[UESP: Daggerfall character creation](https://content2.uesp.net/wiki/Daggerfall:Character_Creation).
I found no dedicated Daggerfall planner to compare against.

What this planner has that those don't:

- **Rule-interaction notes.** Every interaction the build touches is explained in words, labelled
  *exploit*, *trap*, *online* or *note*, with the DFO source file it comes from. This is how the High Elf
  case "plays out" in the planner: pick High Elf, then Critical Weakness to Paralysis, and a note
  explains that the immunity is gone and what the throw is now. The Resistances panel shows the same
  numbers step by step.
- **The game's refusals, live.** The planner lists each reason DFO would refuse a class (unbalanced
  attributes, difficulty out of range, conflicting picks, unspent points), using the same rules and wording.
- **Round trip with the game.** **Export class for DFO** writes DFO's own `daggerfall-enhanced/custom-class`
  file. The tests feed 300 generated classes through DFO's importer to prove it accepts them unchanged.
  **Open plan or class file** reads such a file back, including one exported from the game.

## How it stays true to the game

DFO changes daily, so the planner is built to notice when it falls behind:

1. **The rules are restated, with sources.** `planner/src/rules/` holds plain, readable copies of DFO's
   rules. Each names the DFO file it restates. The planner doesn't load DFO's own modules in the
   browser, because they pull in most of the game.
2. **Parity tests compare against DFO's real code.** `planner/test/parity.test.mjs` imports DFO's
   modules from `upstream/` and runs thousands of generated characters through both. It covers saving
   throws and immunity gates for every race; the advantage window's refusals; every bit of a custom
   class; difficulty and multipliers; both combat rule sets' racial and expertise bonuses; derived stats;
   leveling; and the class-file import. If DFO changes a rule, a test fails and names it.
3. **Class and biography data come from your files, through DFO's readers.** The planner sees what the
   game sees.
4. **Each test was checked by breaking the rule it pins.** For example, changing the Breton +30 to +25
   makes the parity test fail.

After pulling a new DFO version (`bash scripts/setup-upstream.sh`, then update the clone), run the tests.
Green means the planner still matches; red names the rule that moved.

## Files

| Path | What |
|---|---|
| `planner/index.html`, `planner/src/ui/` | The page (plain HTML, CSS and JavaScript modules; no build step, no dependencies) |
| `planner/src/rules/tables.js` | Skills, races, the advantage catalogue and costs, the career bit layouts |
| `planner/src/rules/career.js` | The custom-class builder's laws; reading a class's specials |
| `planner/src/rules/resist.js` | Saving throws, the dice, the immunity gates, the threat list |
| `planner/src/rules/derived.js` | Health, magicka, carrying, movement, weapon bonuses, leveling |
| `planner/src/rules/biography.js` | What each biography answer does |
| `planner/src/rules/notes.js` | The rule-interaction notes |
| `planner/src/rules/build.js` | A plan, and `compute()`, which turns it into the character sheet |
| `planner/src/rules/share.js` | Share links, and DFO's class-file format |
| `planner/tools/` | The data extractor and the local server |
| `planner/test/` | Parity and scenario tests |

## In the handbook

The handbook can publish the planner as a reference page and home-page button:

```bash
node handbook/tools/build.mjs --map --planner
```

This copies `planner/` (the app plus `data/game-data.json`) to `dist/planner/` and embeds it in
`reference/character-planner/`. Without `--planner`, no planner page or button is built. The page is a same-origin
iframe, so the planner keeps its own layout and its "open full window" link works.

The data file is extracted from the player's own Daggerfall files and stays out of git. A build machine needs
`planner/data/game-data.json` (run `node planner/tools/extract-game-data.mjs` once). Publishing that data is a launch
decision, like the class base-stats table: the class numbers are game facts, but the biography text is the game's
writing. The current Cloudflare staging site is behind Access.

## Not in the planner yet

- **Sharing the planner publicly.** It reads class and biography data from your own game files and keeps them out of
  git. The handbook build can include it behind Access; before a public launch, decide whether to ship the extracted
  data or let each visitor point the page at their own ARENA2 folder.
- Leveling past level 1 attribute by attribute, the Oblivion-like leveling system's purse, and Master
  Skills' climb past 100.
- Vampirism and lycanthropy, which replace the race's tolerances.
- Gear: armour values, materials, loot powers and sigil sets.
- Arcane Specialisations' paths.
