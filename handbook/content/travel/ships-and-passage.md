---
title: Ships and passage
summary: Book passage aboard a friendly ship at a port, follow its sailed route, and stay aboard until the voyage ends.
stage: travel
order: 50
gate: none
tags: [ships, passage, ports, sailing]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - At a port, activate a friendly ship and ask its master where the vessel will sail.
> - Passage is available on a Large Boat, Small Ship or Carrack, not a Rowboat or Large Galley.
> - The destination must be a known port beyond the local landfall range.
> - The fare follows the map distance, and you pay it even if you own a ship. Hulls cost from 4,000 to 200,000 gold.
> - Passage is a sailed journey. Stay aboard; stepping off ends the passage.

## Book passage

Find a friendly vessel moored at a port berth and activate it. If the hull carries passengers, its master offers the ports you know that are beyond the berth's immediate landfall range. The offer is ordered by distance. You cannot book a destination you have not discovered.

Only a Large Boat, Small Ship or Carrack carries a passenger. A Rowboat is too small, and a Large Galley does not moor for passage. The game quotes the fare before you accept. Its price is based on the voyage's map distance and is charged even if you own a ship.

## During the voyage

The ship sails the route; it does not teleport you. Stay aboard until the journey ends. If you step ashore, go over the side or enter another place, the passage ends and your goods come ashore with you. If a fight interrupts the voyage while you remain aboard, the captain resumes sailing after a pause.

Passage serves travel within the Bay. Ships beyond the Veil sail the Eltheric Ocean and cannot carry you back to Bay ports by this service. Owning and outfitting a ship opens later; see [The Harbormaster's Word](../gear/owning-a-ship.md).

## Fares and prices

A port passage's fare is **25 gold plus 25 more for each full 24 map pixels** of the voyage's longest map distance. Short hops are cheap; a long crossing climbs in 25-gold steps. The fare is the same whether or not you already own a ship.

Hulls are sold at a port's **Shipyard**, cheapest first:

| Hull | Price | Sold as |
|---|---:|---|
| Rowboat | 4,000 gold | Parts for your pack; launch it at any water |
| Large Boat | 8,000 gold | A deed in your Fleet |
| Small Ship | 100,000 gold | A deed in your Fleet |
| Carrack | 150,000 gold | A deed in your Fleet |
| Large Galley | 200,000 gold | A deed in your Fleet |

The shipyard also buys hulls back and handles refits, and its Crew Hall hires named hands. See [Owning a ship](../gear/owning-a-ship.md) for the Fleet, the hold and upkeep.

Travelling on the map under Immersive Travel, which is on for shared rooms online, adds its own daily rates. A carriage trip pays **{{fact travel.carriageDailyFee}} gold for each whole day on land** plus one more day's fee. A ship trip adds **15 gold for each sea day** when you do not own the ship, plus **10 gold for each sea day** for the captain and crew, which you pay even when the ship is yours. Sea days are counted as full 24 map pixels plus one.

> [!online] Online rule
> The port passage and its fare are the port's own service. The daily carriage and ship rates above belong to Immersive Travel, whose fare rules the room forces at their shipped values online. Only the map's cosmetic dots and roads stay your own setting.

## Common mistakes

- **Expecting passage to be free because you own a ship.** The port fare is charged regardless; only the map's 15-gold daily rental disappears.
- **Trying to book a landlocked destination.** Passage reaches ports; inland places need another route.
- **Ignoring the daily rates.** A ship trip on the map is not one flat fare; the captain's 10 gold is charged for every sea day.
- **Confusing a crowded quay with a berth.** Activate a moored ship, not the dock around it.

## Next

- [Portal Stones](portal-stones.md)
- [Mages Guild teleport](mages-guild-teleport.md)

## Sources

- `src/systems/naval/passage.js`: `PASSAGE_HULLS`, `passagePixels`, `passageFare`, `passageDestinations`, `PASSAGE_LEAVE_M`, passage lifecycle
- `src/systems/travel/travel.js`: `calculateTripCost` (the ship fare: 25 per 24 ocean pixels plus 25)
- `src/systems/comeSailAway/comeSailAwayHulls.js`: `HULL_NAMES`, `HULL_PRICES`
- `src/systems/shipyards.js`: `SHIPYARD_HULLS`, `PARTS_HULLS`, `REFIT_RESALE`, `SALE_FLOOR`
- `src/systems/immersiveTravel.js`: `carriageTripCost` (daily carriage, ship and captain rates)
- `src/systems/modSettings.js`: `General.DailyCarriageFee`, `ShipTravel.DailyShipCost`, `ShipTravel.DailyCaptainFee`
- `src/systems/online/onlineLane.js`: `immersive-travel` whole-mod online rules
- `src/systems/travel/travelRoute.js`: `VOYAGE_LANDFALL_PX`
- `src/scenes/naval/passageHost.js`, `src/scenes/world.js`: passage lifecycle and online travel boundaries
- Research: `handbook/research/V1.md` (ships and passage)
