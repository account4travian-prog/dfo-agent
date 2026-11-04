---
title: Gathering
summary: Nodes, climates, daily slots, seasons and Tides.
stage: feet
order: 50
gate: registered
status: draft
verified: 0df2d87eb
tags: [gathering, materials, climates, seasons]
---

> [!tip] At a glance
> - Gather from world nodes with the matching profession: Mining, Logging, Herbalism, Hunting or Fishing.
> - Climate shapes which land nodes and herbs appear; the same map pixel shares its daily node layout.
> - The node calendar follows UTC days. Season and Tide effects can change what a harvest yields.
> - There is no general daily harvest-count cap in this source snapshot; availability, specific limits and service rules still apply.

## Find the right work

Mining, Logging and Herbalism use veins, trees and herb patches in the land. Their availability depends on the climate of the map pixel, and herb types vary by climate. The daily node layout is deterministic and shared, so other players encounter the same basic nodes there. If a patch is unfamiliar, the map's climate and your profession page help explain what you can work.

Fishing uses a net haul, while Hunting harvests witnessed creature remains. These are different actions from clicking a land node, but they use the same profession system and award materials and profession experience.

## Work the calendar

The gathering day follows UTC. Herb availability and yield may change with the season: some plants are seasonal, and winter can leave certain plants bare. A map pixel's herb patch is initially conservative about its tier until enough reports agree on its identity.

Weekly Tides can also affect yields. A Harvest Tide improves land-gathering yields, Blight reduces herb and wood yields, and Storm Season improves fishing haul yields. These are shared calendar conditions; check the current Tide before planning a long gathering run.

## Rank and limits

Your rank determines which tiers you can work. A clean harvest gives more profession experience. Working a node far below the highest tier your rank has opened awards less experience, so moving to appropriate-tier sources helps your profession advance.

The law has no general daily cap on harvest count in this snapshot. Specific limits still exist, including a daily limit on high-tier hides, while nodes can be exhausted for the UTC day and the account service limits operation rates. Do not treat the absence of a general cap as unlimited access to every material.

Collected materials can feed the [Crafting](crafting.md) stations or remain in **Stores** for future orders and [Court writs](money-and-markets.md).

## Next

- [Crafting](crafting.md)
- [Money and markets](money-and-markets.md)

## Sources

- `src/net/nodeLaw.js`: `NODE_COUNTS`, `nodeCount`, `HERB_TABLES`, `herbPatch`, `daySeason`, `herbSeasonMult`, dungeon veins
- `src/net/professionLaw.js`: `harvestXp`, `TIER_RANKS`, harvest limits and high-tier hides
- `src/net/tideLaw.js`: `TIDE_EFFECTS`, Tide calendar and `tideYield`
- `server-account/src/professions.js`: server-side harvest/material authority and operation limits
- `src/systems/online/onlineLane.js`: online rule scope
- Online-lane check: `handbook/research/M.md`
- Research note: `handbook/research/E1.md`
