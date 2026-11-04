---
title: Reading a town
summary: Use the town map and building signs to find services, then account for opening hours and the online rules at night.
stage: town
order: 10
gate: none
tags: [town, buildings, map, opening hours]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Open the town map to see discovered buildings and their doors; the map groups them into quarters.
> - Read the building name and type before entering. Shops, banks, guild halls, temples and taverns offer different services.
> - Online, shops, banks, libraries, palaces and guild halls stay available around the clock. City gates also stay open.
> - Houses, temples and taverns keep their own entry rules; “online” does not mean every door is open.

## Find a building

![Original handbook symbols for eight town services](theme/art/diagram-town-legend.svg "Caption: These handbook service cues help distinguish buildings and services without reproducing game map icons.")

Use the town map to orient yourself, then follow the marked doors in the street. A building's name identifies its kind of service: an Armorer repairs and sells armor ([shops and prices](shops-and-prices.md)), a Weapon Smith handles weapons, and a General Store carries general goods. A [Bank](banks.md) or [guild hall](npc-guilds.md) is a distinct service building, not a shop counter.

If you do not know where a service is, ask a towns-person with **Where is**. People may point you in a direction or mark a known building on your map. See [talking to people](talking-to-people.md).

## Hours and entry

In the classic schedule, shops and public buildings have different hours. DFO Online relieves shops, guild halls, banks, libraries and palaces of their classic closing hours. You can use those services at night without waiting for morning. Temples and [taverns](taverns-and-rooms.md) are open at all hours under their own schedule; houses are not public services, and faction houses may require membership.

Online city gates do not close at night. This removes the old need to wait outside a walled city until morning, but curfew laws can still matter in places where an edict is active. See [the law](the-law.md).

> [!tip] Locked door?
> Check whether it is a private house or a faction building before assuming the town is closed. Membership, ownership, a quest, or a lock can govern entry independently of the hour.

## Common mistakes

- **Waiting outside a city gate for morning.** Online city gates stay open, so a night spent waiting costs a game day of events, couriers and quest timers; walk in and use the relieved services.
- **Assuming every door follows the relieved hours.** Houses, faction houses and some temples keep their own entry rules; forcing the wrong door can bring the watch rather than a service ([the law](the-law.md)). Cost: time, or a crime.
- **Searching a large town by eye.** A towns-person's **Where is** answer can mark the building on your map ([talking to people](talking-to-people.md)); walking every quarter first can take the whole session.

## Next

- [Shops and prices](shops-and-prices.md)
- [Talking to people](talking-to-people.md)

## Sources

- `src/world/buildingNames.js`: `BUILDING_TYPES`, building labels
- `src/ui/town/townSheet.js`, `src/ui/town/townQuarters.js`: town map and quarters
- `src/systems/buildingLocks.js`: `buildingHoursState`, `onlineReliefBuilding`, `buildingIsUnlocked`
- `src/world/city/cityGate.js`: `updateCityGate`
- Research: `handbook/research/T1.md` (building kinds and hours)
