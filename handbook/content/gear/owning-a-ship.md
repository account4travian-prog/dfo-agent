---
title: Owning a ship
summary: Shipyards, hulls, crew, cargo and naval combat, introduced by The Harbormaster's Word.
stage: gear
order: 50
gate: level 5
status: draft
verified: e4f093166
tags: [ships, sailing, crew, cargo, naval combat]
---

> [!tip] At a glance
> - **The Harbormaster's Word** introduces ship ownership at character level 5.
> - Buy a hull at a port's Shipyard; the Rowboat comes as packable parts, while larger ships enter your Fleet as deeds.
> - Hire named crew at the port's Crew Hall and manage your ship from the shipmaster's services.
> - Naval Combat is enabled online, while some encounter and handling preferences remain your own settings.
> - At sea, another captain can wreck and board your ship; a boarded wreck gives up part of its hold as a prize, but a wreck is not a death.

## Start at a port

The shipyard is the place to buy or sell a hull and arrange work on a ship. It offers the Rowboat, Large Boat, Small Ship, Carrack and Large Galley. The Rowboat is sold as parts that stay in your pack until launched in water. The other hulls are sold as deeds and recorded in your Fleet, with a port berth.

Use the shipyard to arrange refits and shipwright work. The Crew Hall is where you recruit named crew for your deck. Review the shipmaster's listed crew and costs before signing on; the source does not define one fixed fee for every recruit.

## Cargo and a working crew

Your ship's hold gives you a place to carry goods at sea. Manage the hold, rigging, hull, guns, provisions and crew as part of your vessel's upkeep. Larger hulls have different crew and equipment needs, so compare the shipyard's specifications with the kind of voyage you plan.

The Harbormaster's Word is the level-5 introduction to the sea and ship ownership. Its quests ask you to sail, load a hold and strike your colors. For paid travel aboard another captain's vessel, see [Ships and passage](../travel/ships-and-passage.md).

## Fighting other captains

Naval Combat is forced on for shared rooms, so the sea you stand is the room's sea. At the helm, look to one side and hold
Attack to aim a broadside, then release to fire. Another captain can do the same to you.

A ship reduced to a wreck is **not** a death: its captain keeps the hull's hold through the wreck. A wreck that the
other captain boards gives up a **prize** — about one third of the hold's worth, at most eight of its most valuable
pieces, held by the account service for the boarder to collect. Piracy is a crime, and pirates can board your ship and
fight you on deck.

## Online rules

Naval Combat is a DFO feature enabled for online play. Its encounter-density, boarding and prize choices are separately declared as player settings. Detailed Ships is forced on for shared rooms, so players there share the same ship decks. Ownership of personal ships comes through Come Sail Away, whose possession setting is player-owned online.

## Next

- [Ships and passage](../travel/ships-and-passage.md)
- [Craft specialisations](craft-specialisations.md)

## Sources

- `src/systems/questlines/qlLines.js`: `introSea`, The Harbormaster's Word gate and steps
- `src/systems/shipyards.js`: `SHIPYARD_HULLS`, `PARTS_HULLS`, shipyard services and crew hall
- `src/systems/comeSailAway/comeSailAwayHulls.js`: `HULL_NAMES`, `HULL_PRICES`
- `src/systems/online/onlineLane.js`: Detailed Ships room rule and Come Sail Away setting scope
- `src/systems/features.js`: Naval Combat online declaration and player-owned parts
- `src/scenes/naval/navalPvp.js`: `SHIP-PVP` broadsides, wreck and board seams, `SEA_CAPTAIN_NEAR_M`
- `src/net/sea/seaPrizeLaw.js`: `SEA_PRIZE_SHARE` (one third), `SEA_PRIZE_PIECES_MAX` (8), `SEA_PRIZE_HOLD_S` (three days)
- `src/scenes/seaWreckHost.js`, `src/systems/naval/seaHoldGuard.js`: wrecked hold and boarding
- `src/systems/features.js`: Naval Combat's online switch and player-owned encounter settings
- Research note: `handbook/research/V1.md`
