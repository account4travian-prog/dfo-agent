---
title: The map and danger
summary: Use the world map to choose a destination and route, then treat terrain, location type and nearby threats as separate parts of risk.
stage: travel
order: 20
gate: none
tags: [map, regions, danger, dungeons, travel]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - The world map organizes the Iliac Bay into regions and map locations; use the place names and route overlay to orient yourself.
> - Road, track and open-ground routes have different travel costs, so the shortest line is not always the quickest trip.
> - A town, wilderness encounter and dungeon entrance are different kinds of risk; check what your destination is before entering.
> - The Overworld View draws nearby pursuit and encounters around your route. A chase is not the same as a destination marker.

## Read the map

Choose a named place on the world map to set a destination. The route overlay shows how the journey crosses roads, tracks and open ground. Region boundaries, climate and location types help you understand where you are headed ([danger and regions](danger-and-regions.md)); they do not by themselves tell you the strength of every opponent inside a location.

The map also distinguishes settlements from other destinations. A road journey can pass through a town, while a dungeon or other location begins a separate visit. Some places appear only after they are discovered or made available by the game's world systems.

## Think about danger

Treat travel risk in layers. The route exposes you to travel encounters and possible pursuit ([overworld travel](overworld-travel.md)); the destination determines the location you enter; and the enemies within it follow that place's own rules. Slow down near a chase, use Cautious travel if you want its encounter-avoidance roll, and check the destination before committing to a trip.

This page does not assign one fixed danger rating to every map pixel. Spawned sites and dungeon tiers can depend on world state and system rules. See the later [Spawned and Elite dungeons](../bay/spawned-and-elite-dungeons.md) guide for those destinations.

## Common mistakes

- **Choosing a dungeon by distance rather than type.** Danger comes from what kind of place you enter, not how far from town it is; a nearby crypt can be far worse than a distant mine ([danger and regions](danger-and-regions.md)). Cost: a death and one tenth of the carried purse.
- **Walking into the Wrothgarian Mountains as ordinary wilderness.** The Open Zone adds open PvP and much stronger foes; the map does not mark every risk at its edge ([the Open Zone](../late/open-zone.md)). Cost: carried items and cart contents.
- **Following a chase marker as if it were a destination.** The Overworld draws pursuit and encounters around your route; chasing one can pull you off the path into harder ground. Cost: time and a fight you chose by accident.

## Next

- [Hired carriages](hired-carriages.md)
- [Horses](horses.md)

## Sources

- `src/systems/travel/travelRoute.js`: route costs and route planning
- `src/systems/travel/regionChase.js`: `BAND_REACH_PX`, `REGION_BANDS_NEAR_PX`
- `src/systems/travel/travelThreat.js`: travel threat context
- `src/systems/travel/travelViewFilters.js`: Overworld map filters
- `src/formats/mapsFile.js`, `src/formats/mapsTables.js`: world map and location records
- Research: `handbook/research/V1.md` (walking, map and travel danger context)
