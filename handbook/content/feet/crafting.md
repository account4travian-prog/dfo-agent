---
title: Crafting
summary: Stations, recipes, quality odds and profession ranks.
stage: feet
order: 60
gate: registered
status: draft
verified: 0df2d87eb
tags: [crafting, recipes, materials, quality]
---

> [!tip] At a glance
> - Open **Professions** and choose a craft to see available work and recipes.
> - A recipe draws its inputs from **Stores** and the materials in your pack or Materials Bag.
> - Recipe tier and your craft rank affect the quality roll; specialisation choices can shift particular outcomes.
> - Craft disciplines can share a track. For example, Jewelcrafting raises Smithing, while Cooking raises Provisioning.

## Gather, then work

Crafting uses the five craft tracks: **Smithing**, **Building**, **Outfitting**, **Provisioning** and **Enchanting**. Some recipes belong to a discipline within one of these tracks. That discipline names the work, but its shared craft track is where rank and experience accrue.

Use **Stores** to review materials you have deposited, then choose a recipe or work action in the profession pages. Stations include the Forge, Workbench, Loom, mason's bench and jeweller's bench. Alchemy and Enchanting work is also available through the profession service. The page explains when a station is unavailable or lacks what the recipe needs.

The Materials Bag is a portable way to carry crafting materials. Stations can draw from it as well as from Stores and your carried pack items. Check the recipe's inputs before leaving town so you know what to gather or withdraw.

## Quality and rank

Crafted quality ranges from **Crude** through **Standard**, **Fine** and **Superior** to **Masterwork**. Your rank relative to the recipe's rank sets the starting odds; a wide rank advantage makes higher quality more likely. Recipe rules and some specialisations can further shift the result. The displayed result is a roll, so a suitable rank improves your chances without guaranteeing a specific quality.

Higher tiers open as your profession rank rises. You can learn how node availability supports those recipes in [Gathering](gathering.md). Above Journeyman, only a limited number of craft tracks can keep advancing; [Craft specialisations](../gear/craft-specialisations.md) explains the lasting choices.

## Next

- [Gathering](gathering.md)
- [Craft specialisations](../gear/craft-specialisations.md)

## Sources

- `src/net/professionLaw.js`: `DISCIPLINES`, `trackOf`, `TIER_RANKS`, rank and specialisation rules
- `src/net/recipeLaw.js`: `QUALITY_NAMES`, `QUALITY_ROWS`, `qualityOdds`, `craftQuality`
- `src/net/profBook.js`: `recipe` work inputs and material sources
- `src/ui/professions/profPages.js`: profession pages, stations, Stores and work availability
- `src/net/bagLaw.js`: Materials Bag capacity and behavior
- Research note: `handbook/research/E1.md`
