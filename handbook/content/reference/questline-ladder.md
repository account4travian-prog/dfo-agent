---
title: The questline ladder
summary: Every questline, its gate, giver, and the system or story it introduces.
stage: reference
order: 40
gate: none
tags: [questlines, gates, introductions, reference]
verified: 0df2d87eb
status: draft
---

> [!tip] At a glance
> - Questlines group related quests in the journal and show what each line is waiting for.
> - The ladder below lists all 14 lines in the source registry.
> - Some steps wait on a feature, a Renown threshold or a seasonal event even after the line itself opens.
> - Introduction lines point to the handbook page for the system they introduce.
> - The [quest guide](../../quests/) has every questline step's objectives, outcomes and recovery advice.

## Questlines

| Questline | Gate | Giver | What it teaches or covers | Stage page |
|---|---|---|---|---|
| The Burning Doors | Character level 10; online; registered account | Ysolde Marnhel, Master Conjurer of the Mages Guild of Wayrest | Dagon's Breaches and the investigation behind them | [Dagon's Breach](../rivals/dagons-breach.md) |
| The Covens' Hoard | After The Burning Doors; online; registered account | Ysolde Marnhel, Master Conjurer of the Mages Guild of Wayrest | Elite dungeon champions and the Weir Key | [Spawned and elite dungeons](../bay/spawned-and-elite-dungeons.md) |
| The Weir Road | After The Covens' Hoard; online; registered account | Corvane Tull, Battlemage of the Spire's last class | The Elite Breach and the road through its Redoubts | [Elite Gates](../late/elite-gates.md) |
| The Hour That Was Not | Character level 12; online; registered account | Prior Anselm Vey of the Order of the Hour | Abyss Dungeons and the Brass Remnant | [Abyss dungeons](../late/abyss-dungeons.md) |
| The Old Coil | Character level 8; online; registered account | Hamid al-Rasheen, a packet captain of Sentinel | The Sea Serpent | [Sea serpent](../rivals/sea-serpent.md) |
| The Thirteenth of Frostfall | Character level 6; online; registered account; Witches' Festival (Starfall) staged | Morwen, a Wyrd Sister of Glenmoril | The seasonal Starfall and fallen stars; star-dependent steps wait for the Festival | [Festivals and Starfall](../bay/festivals-and-starfall.md) |
| The Court Crafter | Character level 2; online; registered account | A court crafter | Gathering, professions, crafting and Stores | [Crafting](../feet/crafting.md) |
| The Smith's Secrets | Character level 4; Loot Rarity on for its steps | An armorer | Rarity gear, sockets and the Reforge | [Loot rarity](../gear/loot-rarity.md) |
| The Harbormaster's Word | Character level 5; Naval Combat on for its steps | A harbormaster | Ships, cargo and naval combat | [Owning a ship](../gear/owning-a-ship.md) |
| The Merchant's Road | Character level 3 | A stable master | Wagons, hauling and delivery work | [Wagons and hauling](../feet/wagons-and-hauling.md) |
| A Seat at the Table | Character level 2; The King's Gambit on for its second step | A tavern regular | Tavern games, including The King's Gambit when enabled | [Tavern games](../feet/tavern-games.md) |
| The Herald's Call | Character level 6; online | The Arena's Herald | The Arena and its first bouts | [The Arena](../bay/the-arena.md) |
| The Bay's Troubles | Character level 6; online; second step waits until Renown 10 | A captain of the watch | Town raids, then the revenants called the Kneeling Dead | [Town raids](../bay/town-raids.md) |
| Written in the Stars | Character level 3; online | An astrologer | Renown Stars and the Firmament | [The Firmament](../feet/the-firmament.md) |

“Registered account” means a guest account cannot open the line: the service records no guest's receipts, so its witnessed steps could not be done. The level and sequence gates come
from the line registry. Where a feature or event is named, it can hold a step even after the line is listed; the journal
shows the current wait. The source does not provide a fixed per-step building list for these lines.

## Finding your place

The Quests tab shows each line's completed, current and upcoming steps, along with what a line is waiting for. A seasonal line you have not begun is shown only while its event runs. The
introduction lines are short invitations to their related systems; the longer story lines are available later in the
ladder. A questline step that is held by a feature or seasonal gate waits rather than starting and failing.

## Common mistakes

- **Reading the character-level gate as the only condition.** Account registration, online play, feature switches,
  earlier lines and event timing can also matter.
- **Assuming every giver is in a fixed building.** The registry names the giver role or person, but the source does not
  define a fixed building for each step.
- **Confusing a line's introduction with its whole system.** Use the linked stage page for the system's full rules.

## Next

- [Questions new players ask](questions.md)
- [Caps and timers](caps-and-timers.md)

## Sources

- `src/systems/questlines/qlLines.js`: `QL_LINES`, every line's `title`, `giver`, `opens`, and step `needs`; `lineOpens`,
  `opensWords`, `eventHolds`; the `LineOpens` notes on `account` and `event`
- `src/systems/questlines/qlLineRunner.js`: line progression and held-step behaviour
- `src/net/questlineClaims.js`: witnessed lines and registered-account service requirements
- `src/systems/revenant/revenant.js`: `REVENANT_MIN_RENOWN` (The Bay's Troubles second-step gate)
- `src/ui/questlines/qlJournal.js`: Quests tab presentation
- Research note: `handbook/research/Q1.md`; gate outline: `handbook/STRUCTURE.md`
