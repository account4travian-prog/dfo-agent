---
title: Professions
summary: The ten gathering and crafting tracks, introduced by The Court Crafter.
stage: feet
order: 40
gate: registered
status: draft
verified: 0df2d87eb
tags: [professions, gathering, crafting, ranks]
---

> [!tip] At a glance
> - A registered account can begin **The Court Crafter** at character level 2.
> - Five gathering tracks and five craft tracks cover collecting materials and making goods.
> - You may raise every gathering track, but only {{fact crafts.aboveJourneyman}} craft tracks may rise above Journeyman (rank {{fact crafts.journeymanRank}}).
> - Use **Professions** to review progress and **Stores** to manage materials for later work.

## The tracks

The gathering tracks are **Mining**, **Logging**, **Herbalism**, **Hunting** and **Fishing**. Craft tracks are **Smithing**, **Building**, **Outfitting**, **Provisioning** and **Enchanting**. A recipe may name a discipline within a craft: Jewelcrafting work, for example, raises Smithing; Cooking and Alchemy work raise Provisioning. This distinction matters when you choose specialisations later.

Each track advances from Novice through Apprentice, Journeyman and Expert to Master. Higher ranks open more material and recipe tiers. Gathering and crafting use separate tracks from your character's ordinary skills.

## Begin the introduction

At level 2, look for **The Court Crafter**, offered online by a court crafter. Its introduction asks you to find materials and make something. Profession work is an online account service, so a guest account cannot take the line or use the profession book; access also depends on the service being open.

Open **Professions** from the pause menu's Stats rail to see the gathering and craft tracks. **Stores** shows stored materials and the work actions available to you. Crafting can draw from Stores and from materials you carry in your pack or Materials Bag.

> [!online] Online rule
> Professions and Stores are DFO Online systems. Daggerfall Unity alone does not have these profession tracks. The account service is authoritative for profession operations and material changes.

## Plan for later

Gathering has its own nodes, climates and daily availability; see [Gathering](gathering.md). Crafting turns materials into goods at workstations; see [Crafting](crafting.md). At Journeyman, consider which crafts you want to keep advancing before committing to ranks above it. The rank-50 and rank-100 choices are covered in [Craft specialisations](../gear/craft-specialisations.md).

## Next

- [Gathering](gathering.md)
- [Crafting](crafting.md)

- [The progression map](progression-map.md)
## Sources

- `src/net/professionLaw.js`: `PROFESSIONS`, `DISCIPLINES`, `trackOf`, `RANK_NAMES`, `TIER_RANKS`, `CRAFTS_ABOVE_JOURNEYMAN`, `JOURNEYMAN_RANK`
- `src/systems/questlines/qlLines.js`: `introCrafts` / The Court Crafter gate
- `server-account/src/professions.js`: `profOpenFor`, `asks` (registered-account and service availability)
- `src/ui/professions/profPages.js`: Professions and Stores pages
- `src/net/profBook.js`: available work and material sources
- `src/systems/online/onlineLane.js`: online account-service and mod scope
- Online-lane check: `handbook/research/M.md`
- Research note: `handbook/research/E1.md`
