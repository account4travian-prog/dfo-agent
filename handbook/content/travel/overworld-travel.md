---
title: Overworld travel
summary: Plot a walked route across the Iliac Bay, adjust its pace, and account for road, terrain and encounter settings.
stage: travel
order: 10
gate: none
tags: [travel, overworld, routes, pace]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Use the Overworld Travel View to plot a route over roads, tracks and open ground.
> - The route planner favors roads, then tracks, then open ground; a direct cross-country line may take longer.
> - Set a travel pace and a slower near-enemy pace. The default pace dial is ×60 and the default near-enemy pace is ×5; ground and Open Zone caps can lower the active pace.
> - Cautious travel is slower but can avoid an encounter; reckless travel uses the normal journey-time calculation.

## Plan a route

![Road, track, open-ground and carriage routes with pace caps](theme/art/diagram-travel-view.svg "Caption: Roads have the cheapest route cost, while terrain and Open Zone rules cap your chosen pace.")

Choose your destination in the Overworld Travel View ([the map and danger](the-map-and-danger.md)). The route planner weighs roads most cheaply, tracks more heavily and open ground most heavily. A longer road route can therefore be faster in the travel calculation than a short cross-country cut. Towns are crossed through their streets and gates rather than treated as open ground.

Walking costs no fare; the [hired carriages](hired-carriages.md) page covers the paid shortcut. Your displayed pace is separate from the classic travel-time calculation: the pace controls how quickly the character moves through the active route, while the route and transport determine how much game time the trip represents. A [horse](horses.md) changes your physical pace, not the route.

## Set your pace

The pace dial offers ×5, ×10, ×20, ×30, ×40, ×60 and ×100. Outside the Open Zone, roads and tracks allow ×100 and open ground caps the active pace at ×60. In the Open Zone, the caps are ×40 on roads or tracks and ×20 on open ground. Leaving a road or track caps the running pace without erasing your chosen dial, which returns when you reach one. The near-enemy dial controls your slowest pace when a threat is close.

In Travel Options, **Speed Penalty** defaults to 20%, and **Max Chance to Avoid Encounter** defaults to 95%. Cautious travel's avoidance roll uses Luck and Stealth up to that cap. Reckless travel does not reduce the calculated trip time or provide Cautious travel's encounter avoidance. Review the pace and caution choices before setting out.

The wilderness between towns is also where [spawned dungeons](../bay/spawned-and-elite-dungeons.md) appear, so a walked route can be an exploration trip rather than only a way to arrive.

> [!tip] Leaving town
> City gates stay open online. A walked route through town therefore does not stop at a night gate.

## Common mistakes

- **Taking the straight line because it looks shorter.** The planner prices roads cheapest, tracks next and open ground most, so a longer road route can be faster. Cost: travel time on every trip.
- **Leaving the pace dial at its fastest through bad ground.** Leaving a road or track caps the active pace (×60 outside the Open Zone) without changing your setting. Cost: a fast trip runs slower than you planned.
- **Using Cautious travel for every leg.** Cautious is slower and only adds its encounter-avoidance roll; using it on safe roads spends session time. Cost: fewer activities per hour.

## Next

- [The map and danger](the-map-and-danger.md)
- [Hired carriages](hired-carriages.md)

## Sources

- `src/systems/travel/travelRoute.js`: `ROUTE_COST`, route planning
- `src/systems/travel/travelPace.js`: `PACE_STEPS`, `TRAVEL_PACE_DEFAULT`, pace caps
- `src/systems/travel/travel.js`: `travelPixelMinutes`, `calculateTravelTime`
- `src/systems/travel/travelOptions.js`: `avoidEncounterChance`, `cautiousTravelMultiplier`
- `src/systems/online/onlineLane.js`: Travel Options online room settings
- `src/systems/modSettings.js`: Travel Options default caution penalty
- `src/scenes/world.js`: Open Zone pace caps
- Research: `handbook/research/V1.md` (walking and Overworld Travel View)
