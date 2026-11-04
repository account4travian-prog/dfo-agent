---
title: Danger and regions
summary: How a place's kind sets its danger, the Bay's regions compared, and how to open and read both maps.
stage: travel
order: 15
gate: none
tags: [danger, regions, dungeons, open zone, day and night, map]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Danger comes from the **kind of place**, not the distance you have travelled.
> - Towns, mines and natural caves are gentlest; a crypt, vampire haunt or dragon's den is several grades up.
> - Online the sky runs a day every real hour, so the wilds are safer by day than at night.
> - The Wrothgarian Mountains are the **Open Zone**: PvP, ×4 foes, and a death that can strip your pack.

## Danger comes from the place, not the distance

Distance does not make foes stronger; the kind of place does. Every dungeon kind has a fixed grade, and the grade drives the foes and the loot: a crypt near home is as dangerous as one across the Bay. Online, Loot Rarity is forced on and the grade comes from that ladder; [The map and danger](the-map-and-danger.md) covers routes.

## The danger grades

| Grade | Places | Foe health | Foe damage |
|---|---|---:|---:|
| 4 (base) | Towns, mines, natural caves | ×1 | ×1 |
| 5 | Prisons, spider and scorpion nests, **the wilds by day** | ×1.07 | ×1.02 |
| 7 | Harpy nests, **the wilds at night** | ×1.21 | ×1.05 |
| 9 | Crypts, orc strongholds | ×1.36 | ×1.09 |
| 11 | Barbarian strongholds | ×1.50 | ×1.13 |
| 14 | Vampire haunts | ×1.71 | ×1.18 |
| 15 | Desecrated temples | ×1.79 | ×1.20 |
| 18 | Dragon's dens, volcanic caves | ×2.00 | ×1.25 |

Other kinds sit between: cemetery 3, human stronghold or ruined castle 6, giant stronghold 8, laboratory 10, coven 13; a town's ground is base grade. The place multiplies a foe that is already a threat — a rat in a vampire haunt stays a rat, while a class foe built at your level takes the full step — and from level 10 and Renown 15 a second layer answers you too ([The hero's threat](../feet/heros-threat.md)). The same grade also sets rare loot odds.

## Day and night

Online the sky runs a day every real hour, midnight on the hour. The wilds read grade 5 by day and 7 at night.

## The Open Zone

The **Wrothgarian Mountains** are the one region with open player-versus-player combat. Every foe there stands at ×4 health and blows; the inner rings multiply that and the loot, ×1.25 in **The Foothills** to ×2 in **The Heart**, so ×5–×8. A death there drops eligible bag and cart pieces and half your carried gold, and a player who kills you may take one worn piece; consumables and the wallet stay. See [The Open Zone](../late/open-zone.md).

## The regions and what they offer

Region names are geographic, not a difficulty switch; the danger follows the places you enter.

| Area | What it offers | Early caution |
|---|---|---|
| **Daggerfall**, **Wayrest** and the crown cities | Town services, guilds, banks; the Arena; the LeFay Monument | Safest ground; the routes out begin the wilds |
| High Rock interior and forests (Dwynnen, Northmoor, Menevia, Ravennian, Malekna) | Settled country, roads, dungeons, woodland logging and herbs | Stay on the roads and travel by day |
| Hammerfell crown, **Alik'r Desert**, **Dragontail Mountains**, **Dak'fron** | Sentinel, a port and early destination; ore and herbs | Long land distances; desert pixels have no trees |
| The Marches: **Betony**, **Anticlere**, **Lainlyn** | Every gathering node pays **+25%** | Contested: the bonus comes with danger |
| **Jungle of Bantha** (Lainlyn, Satakalaam, Mournoth) | The southern logging destination | A far southern trip; prepare first |
| **Wrothgarian Mountains**, **Orsinium Area**, **Devilrock** | Mountain country and Orichalcum; the Open Zone | Stay out of the Open Zone while you are new |

## Where to go first

- **Renown and gear:** towns, your quests' private instances and a town-raid party ([Spawned and Elite dungeons](../bay/spawned-and-elite-dungeons.md)); then the Arena, town defence and the later group content.
- **Materials and money:** nearby confirmed pixels (timber and herbs in woodland, ore in mountains and deserts), sold where town prices are good, then banked.

## Open and read the map

One map window has three sheets: automap, town and world; which a place offers follows where you stand.

| Key | Default action | What you get |
|---|---|---|
| **M** | **AutoMap** | The map where you stand: explored dungeon or building plan, town map, or world sheet in the wilds |
| **V** | **TravelMap** | The same window opened with the world sheet chosen, where it is available |

Inside a dungeon or building only the automap; in a town the town and world sheets; in the wilderness only the world, with tabs that do not apply dimmed. **V** picks a destination; the Overworld Travel View is a separate route plotter, unbound by default ([Overworld travel](overworld-travel.md)).

The world map lists only discovered places, so an unvisited dungeon is not on it; spawned dungeons are found by leaving the road. The entry plaque names the place and, online, its room tier (**Regular Dungeon**, **Elite Dungeon** or **Abyss Dungeon**) — not the base kind: a Regular Dungeon can be a crypt.

## Common mistakes

- **Avoiding a far mine while entering the crypt next door.** The crypt is harder.
- **Reading the online tier as the base kind.** Elite and Abyss are room tiers.
- **Expecting the map to mark every dungeon.** It shows discovered places only.

## Next

- [The map and danger](the-map-and-danger.md)
- [Overworld travel](overworld-travel.md)

## Sources

- `docs/23-playing-online.md` (danger table, day and night, Open Zone), `docs/25-world-regions.md` (regions and first trips)
- `src/systems/loot/lootRarity.js`: `DUNGEON_RARITY_TIER` (lines 174–195), `dungeonRarityTier`
- `src/systems/skillSoftcap.js`: `PLACE_THREAT`, `placeVeteran`, `wildernessThreat`, `progressionScaling`
- `src/systems/heroThreat.js`: `HERO_THREAT`, `heroThreat`; `src/systems/online/onlineLane.js`: `unleveledLoot`
- `src/net/skyLaw.js`: `SKY_SEGMENTS` (a day every real hour)
- `src/systems/wild/wildZone.js`: `WILD_FOE_HEALTH_MULT`, `WILD_FOE_DAMAGE_MULT`, `WILD_RING_LOOT`, `applyWildFoe`; `src/systems/wild/wildDropLaw.js`: `takeWildDrop`, `wornOffer`, `WILD_GOLD_LOSS`
- `src/world/spawnedDungeons.js`: `SPAWN_CHANCE`, `ELITE_CHANCE`; `src/net/kingdomLaw.js`: `KINGDOMS`, `MARCHES`, `FREE_LANDS`; `src/net/nodeLaw.js`: `MARCH_MULT`
- `src/systems/inputActions.js`: `DEFAULT_BINDINGS`; `src/systems/map/mapTabs.js`: `sheetsFor`; `src/ui/travel/travelMapWindow.js`: `checkLocationDiscovered`; `src/systems/dungeon/dungeonTier.js`: `DUNGEON_TIER_TEXT`
