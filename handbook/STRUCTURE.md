# Structure: the handbook in play order

The handbook follows the order in which DFO Online introduces things to a new player. Each **stage** is a point in a
character's life; a page belongs to the first stage at which a player can meet its subject. Later topics are not
explained early. An early page may name them with a forward link, which renders as "later" and shows when the topic
unlocks.

**The game's own cadence.** DFO Online teaches its systems through *introduction questlines* that open at set
character levels, plus a few Renown gates (research G, `src/systems/questlines/qlLines.js` `QL_LINES`;
`src/systems/eliteFoes.js` `eliteRenownOpen`; `src/systems/revenant/revenant.js` `revenantHeld`). Stages 5-9 are built
on those lines, so the handbook explains a system when the game first hands it to the player:

| Level / gate | Introduction line (gate) | Teaches | Stage |
|---|---|---|---|
| 2 | The Court Crafter (registered, online) | gathering, crafting, Stores | `feet` |
| 2 | A Seat at the Table | tavern games (King's Gambit, when enabled) | `feet` |
| 3 | Written in the Stars (online) | Renown stars and the Firmament | `feet` |
| 3 | The Merchant's Road | wagons and hauling | `feet` |
| 4 | The Smith's Secrets (Loot rarity on) | rarity, sockets, reforging | `gear` |
| 5 | The Harbormaster's Word (Naval Combat on) | ships, cargo, naval combat | `gear` |
| Renown 5 | (no line) | elite foes in your own world | `bay` |
| 6 | The Herald's Call (online) | the Arena | `bay` |
| 6 | The Bay's Troubles (online) | town raids; its second step waits for Renown 10 | `bay` |
| 6 | The Thirteenth of Frostfall (registered, festival open) | Starfall and the seasonal festival | `bay` |
| 8 | The Old Coil (registered, online) | the sea serpent | `rivals` |
| Renown 10 | (Bay's Troubles: The Kneeling Dead) | revenants, then companions | `rivals` |
| Renown 10 | (no line) | founding a player guild (with gold) | `rivals` |
| 10 | The Burning Doors (registered, online) | Dagon's Breaches | `rivals` |
| after Burning Doors | The Covens' Hoard, then The Weir Road | Weir Keys, Elite Gates, the Elite Breach | `late` |
| 12 | The Hour That Was Not (registered, online) | Abyss Dungeons | `late` |

Every gate in this file is checked at the commit below. Research notes: [research/G.md](research/G.md) (gate map),
`C1`-`C3` (creation). One correction to G: NPC guild promotions do **not** wait 28 days online (`PROMO-NOW`,
`src/systems/guild/guilds.js` `updateRank`).

Source commit for this outline: DFO main `0df2d87eb` (synced 2026-10-21).

**Game-file data in the public build.** The Bay and town maps (drawn from data extracted from the player's own
Daggerfall files) are approved for publishing (user, 2026-10-22) and built with `--map`. The class base-stats table is
still undecided and stays local-only (`--game-data`). The quest guide is built from the committed, dialogue-free quest
index (`handbook/quests/quests.json`) and the pinned DFU quest pack; it does not need `--game-data` or `--map`.

## How a stage is defined

| Field | Meaning |
|---|---|
| id | folder name under `content/` and the key in `stages.json` |
| Gate | what puts a player here: a moment, a level, a Renown level, a registered account, or a quest |
| Promise | what the reader can do by the end of the stage |

A page's own gate can differ from its stage's (for example a registered-account page in `feet`). The page then shows
its gate as a badge.

---

## 0. Before you begin `begin`

Gate: none. Promise: you can get into the game, with an account that keeps your progress.

- What DFO Online is: Daggerfall Unity's world in a browser, online, with its own systems on top
- Playing in the browser: requirements, performance settings, the enhanced rendering lane
- Your account: guest or registered, what a guest can't do, recovery codes (written)
- Interface skins: Classic, Enhanced, Enhanced Plus, DFO Grimoire; where the menus live
- Controls and settings: movement, combat input (Click or Hold vs Gesture), the technique key, the hotbar, audio
- Online rules at a glance: what is always on (Roleplay & Realism, Enhanced AI, Unleveled Loot...), what differs from
  single-player Daggerfall Unity

## 1. Creating your character `creation`

Gate: a new character. Promise: you understand every creation choice and its long-term cost.

- The creation screens, step by step
- Races: the eight races, their attribute modifiers, specials and resistances
- Classes: the eighteen standard classes, what they are good at
- Custom classes: skill tiers, advantages and disadvantages, the difficulty dagger and levelling speed, special
  abilities, forbidden materials, armour and weapons
- Attributes: what each of the eight does online, bonus points
- Skills: every skill, its governing attribute, how it trains
- Reflexes, background questions and starting gear
- Appearance: Skins and Layered Gearing
- Choosing a playstyle: warrior, mage, thief and hybrid archetypes compared (no single recommended build)
- Choices that are hard to undo, and what can change later

## 2. Privateer's Hold `hold`

Gate: entering the world. Promise: you can fight, survive and leave the first dungeon.

- Your first minutes: the opening, the journal, the first objective
- Moving, looking, jumping, climbing, swimming
- Fighting: swings and directions, enemy tells, dodging, overreach and Open foes, poise and stagger, shields
- Weapon techniques: one key, one technique per weapon family; how technique lines roll on gear
- Archery and spellcasting basics (for classes that use them)
- Loot and inventory: containers, weight and encumbrance, identifying
- Health, fatigue and magicka; resting and its limits; exhaustion online; poison and disease
- Dying online: where you return, what you lose
- Leaving the dungeon: the LeFay Monument and the way out

## 3. Your first town `town`

Gate: reaching a settlement (Gothway Garden is beside the Hold). Promise: you can use a town's services, join a guild,
meet other players and stay on the right side of the law.

- Reading a town: the town map, building kinds, opening hours, gates at night
- Shops, prices and haggling; town Prosperity
- Banks: the Empire's single online account, letters of credit, loans
- Taverns, rooms and resting in town
- Talking to people: topics, directions, rumours, reputation with the People
- The NPC guilds: Fighters, Mages, temples, knightly orders; joining, ranks, services, training cap, promotion online
  (no wait); how the Thieves Guild and Dark Brotherhood find you
- The law: crimes, the watch, fines, courts, curfews, banishment
- Notice boards: bounties and the Work board
- Meeting other players: chat channels, `/lfg`, parties (size, shared kills, mentor mode), shared dungeons and loot,
  blocking and reporting
- Time, weather and seasons
- Courier letters: how questlines reach you (one per character hour, outdoors in town by day, building needs)

## 4. Getting around `travel`

Gate: leaving your first town. Promise: you can cross the Iliac Bay on foot, by horse, carriage or ship.

- Walking and the Overworld Travel View: routes, speed dial, forecasts, chases
- The map: regions, climates, danger by place (towns, wilds, dungeon types and tiers), spawned dungeons
- Hired carriages (written)
- Horses: stables, feeding, galloping
- Ship passage on a friendly vessel (owning one comes later, in `gear`)
- Portal Stones and Welkynd Shards
- Mages Guild teleport and Recall
- Party travel

## 5. Finding your feet `feet`

Gate: levels 2-3. Promise: you level well, earn Renown, spend your first stars and start a profession.

- Levelling online: skill uses, the skill ticker, five attribute points per level, the health floor
- Renown: online's own ladder (1-50), what earns Renown XP, the hourly cap, the party bonus
- Written in the Stars (level 3): the Firmament, starts and paths, Renown Stars and Craft points, caps, free refunds
  below Renown 10
- The Court Crafter (level 2, registered): the ten profession tracks, gathering nodes and climates, crafting stations
  and quality, ranks and tiers, Stores and the Materials Bag
- Money: Marks and other currencies, daily caps, the global market, court writs
- The Merchant's Road (level 3): wagons and carts, capacity, wear, parking rules, haulage jobs
- A Seat at the Table (level 2): tavern games
- The hero's threat: how the world scales with your level and Renown

## 6. Gear and the sea `gear`

Gate: levels 4-5. Promise: you understand loot rarity, sockets and reforging, and can take to the sea.

- The Smith's Secrets (level 4): rarity tiers and odds, materials and level ramps, item lines and sets, sockets and
  gems, reforging, salvage, repair and resale credit
- The two-craft limit past rank 50, profession specialisations
- The Harbormaster's Word (level 5): owning a ship, shipyards, hulls, crew, cargo, naval combat
- Owning a home

## 7. The wider Bay `bay`

Gate: level 6, Renown 5. Promise: you can join the Bay's shared fights.

- Elites and champions (Renown 5 for your own world)
- The Herald's Call (level 6): the Arena, bouts, rated play
- The Bay's Troubles (level 6): town raids
- World events and their clock: raids, Motherlodes, Starfall and seasonal festivals (The Thirteenth of Frostfall)
- Spawned and Elite dungeons
- Catching up: daily caps and the event clock for short sessions

## 8. Rivals and the Breach `rivals`

Gate: levels 8-10, Renown 10. Promise: you can face revenants, keep a companion, fight at Dagon's Breaches and take
part in guild politics.

- The Old Coil (level 8): the sea serpent
- Revenants (Renown 10): the Unquiet mark, ranks, escapes, wounds, trails and lairs; judgement
- Companions: what a sworn revenant does, loyalty, gear, stars, missions, the Dread
- The Burning Doors (level 10): Dagon's Breaches, portents and the Warden
- Player guilds: founding (Renown 10 and gold), ranks, vault, chapters
- City control: seats, influence and the weekly Turning, holding a seat, edicts, sieges and fortifications

## 9. The late game `late`

Gate: varies. Promise: you know the long-term goals and how to reach them.

- The Covens' Hoard and The Weir Road: Weir Keys, Elite Gates, the Elite Breach and Redoubts
- The Hour That Was Not (level 12): Abyss Dungeons
- Masteries at 100 and specialisation paths; skill swaps and path resets
- The Wrothgarian Mountains Open Zone
- The Eltheric Ocean beyond the Veil
- Arena seasons and the Royal Tourney
- Legacy: heirs and inheritance

## Reference `reference`

Always available; linked from every stage.

- Glossary
- Caps, timers and resets
- The questline ladder (every line, its gate and what it teaches)
- What changed (one entry per sync, from the facts diff and the merged-PR list)
- Questions new players ask
- Keys and commands
