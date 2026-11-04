---
title: Loot and inventory
summary: Check what you carry and how heavy it is before taking more gear from the Hold.
stage: hold
order: 60
gate: none
tags: [loot, inventory, weight, encumbrance]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Your carry allowance is based on Strength: `floor(Strength × 1.5)` kilograms.
> - Online, carrying more than **75%** of your allowance slows you and drains fatigue over time.
> - Item stacks add their weight together; loose gold also counts.
> - Some enchanted finds appear unidentified; the Identify spell or a Mages Guild service can reveal them.
> - Take what you can use, and check your carried weight before filling your pack.

## Check what you carry

Your inventory's carried weight is the sum of your items and loose gold. A stack counts as the item's weight multiplied
by the number in the stack. Your maximum encumbrance is based on live Strength, and an effect that increases carrying
allowance can raise it.

## Why weight matters online

Online, Roleplay & Realism's encumbrance effects run for everyone. Once your load passes 75% of your allowance, the
extra weight reduces your speed and drains fatigue. The effect grows with the load, up to the system's cap. Keeping
some room in your pack helps you move and fight without paying that cost.

> [!online] Online rule
> A base-game rule says exceeding the displayed allowance has no cost. That is not the effective online rule: the
> online lane forces Roleplay & Realism's encumbrance effects on.

## Choose what to take

Activate a container to inspect its contents, then take the items you want. Before you leave a room, compare what you
found with what you already carry. A heavier load can slow you and spend fatigue, so you do not need to take every
item. Keep track of your carried weight as you collect gear and gold.

## Unidentified finds

Some enchanted finds arrive unidentified. Their true name and bonus lines stay hidden until you identify them, though
the item's enchantment and rolled lines still work. Use the **Identify** spell or a Mages Guild service when one is
available. The service belongs to a later [town guild visit](../town/npc-guilds.md); for now, check the item's visible
details and carry it if you want to keep it.

## Next

- [Health, fatigue and rest](health-fatigue-and-rest.md)
- [Leaving the Hold](leaving-the-hold.md)

## Sources

- `src/combat/formulas.js`: `maxEncumbrance`, `entityMaxEncumbrance`
- `src/systems/inventory.js`: `itemWeight`, `carriedWeight`, `GOLD_PIECE_WEIGHT_KG`
- `src/systems/roleplayRealism/rrRealism.js`: `rrEncumbranceEffect`
- `src/systems/online/onlineLane.js`: `roleplay-realism` in `ONLINE_ROOM_MOD_KEYS`
- `src/systems/inputActions.js`: `ActivateCenterObject`, `QuickLootOpen` action labels
- `src/systems/loot/lootRarity.js`: `IsIdentified` law
- `src/scenes/worldModes.js`: Mages Guild Identify service route
- Research note: `handbook/research/P3.md`
- Research note: `handbook/research/H3.md`
