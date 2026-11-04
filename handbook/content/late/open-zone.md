---
title: The Open Zone
summary: Understand the Wrothgarian Mountains' shared PvP risk and what can be left behind when you die there.
stage: late
order: 40
gate: none
status: draft
tags: [open zone, wrothgarian mountains, pvp, death]
verified: 0df2d87eb
---

> [!tip] At a glance
> - The **Wrothgarian Mountains** are DFO's named Open Zone; treat the trip as PvP-risk travel.
> - A PvP death can leave eligible carried items and cart contents in shared remains.
> - Worn equipment and protected items are excluded by the drop rules.
> - Check your inventory and cart before entering, and collect remains promptly if you die.

## What “open” means

The Wrothgarian Mountains are a shared region where players can fight one another. The Open Zone uses its own death and remains laws, so do not apply ordinary wilderness assumptions to a PvP death.

When a player dies there, the remains service builds a public pile from eligible carried possessions. The law filters protected items and worn gear; eligible bag contents and cart contents can be exposed. Another player may take contents from the remains.

## Reduce what you risk

Before entering, decide what you are willing to carry into a PvP area. Bank valuables and avoid transporting items you cannot afford to lose. If you use a cart, remember it is included in the remains rules; do not assume it shields its contents.

If another player takes only part of a gold pile, the remains service keeps the unclaimed balance available in the shared remains.

## Common mistakes

- Treating the Open Zone like a protected town or ordinary dungeon overlooks its PvP death path.
- Assuming equipment worn at the time of death drops with ordinary bag loot contradicts the protected-worn-gear rule.
- Assuming a remains pile is private or permanent is not supported by the law; another player can interact with eligible contents.

## Next

- [The Eltheric Ocean](eltheric-ocean.md)
- [Abyss Dungeons](abyss-dungeons.md)

## Sources

- `src/net/wild/wildLaw.js`: Open Zone rules and PvP context
- `src/net/wild/wildDeath.js`: death handling and remains creation
- `src/net/wild/wildDropLaw.js`: eligible and protected carried items
- `src/net/wild/wildRemains.js`: shared remains and partial gold pile behavior
- Research note: `handbook/research/L1.md`; `handbook/research/X2.md`
