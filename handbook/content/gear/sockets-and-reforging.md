---
title: Sockets and reforging
summary: Gems, sockets and reforging gear.
stage: gear
order: 20
gate: level 4
tags: [sockets, gems, reforging, gear]
verified: 0df2d87eb
status: draft
---

> [!tip] At a glance
> - Identify a piece before socket work, honing or reforging it.
> - Sockets hold one gem. Setting or removing a gem is free, but removing it outside the Reforge destroys it.
> - Reforging rerolls one eligible affix; honing raises one affix within its existing band.
> - The Reforge is part of the Mages Guild's Identify service.

## Sockets and gems

Some rarity gear has empty sockets. A short blade can hold one socket, a one-handed weapon two, and a two-handed
weapon three. Armour and jewellery can hold one. Magic weapons are limited to one; Rare and Legendary weapons may use
their full size. Other gear, such as clothing and ammunition, has no socket capacity.

Eight gem kinds are available: Ruby, Emerald, Sapphire, Diamond, Jade, Turquoise, Malachite and Amber. Each can be
Chipped, Flawed, plain, Flawless or Perfect. A gem's card shows the effect it grants; the effect depends on the gem,
its grade and whether it is set in a weapon or another item.

You can set a gem from your pack or at the Reforge, whether or not you are wearing the item. Setting and ordinary
unsetting are free. An unset gem shatters. Use **Extract** at the Reforge when you want to keep it: extraction has a
gold cost based on gem grade.

## Reforge and Hone

The **Reforge** rerolls one eligible line on a known Magic or Rare item, or the extra line on an Exalted Legendary.
The item must be identified and not worn. The cost depends on the rarity. A plain Legendary cannot be reforged, and
after the first reforge you can reroll only that same line again.

**Hone** raises one eligible line within its own band; it never lowers it. Each additional hone on the same piece
doubles its base cost. A gem's effect cannot be reforged or honed because it was not rolled as an affix.

These are choices with different trade-offs: reforge changes the value of a line, while hone improves a line you
already want. Compare the price on the item before committing materials.

> [!warning] Check what you are spending
> Reforging, honing and gem extraction use Welkynd Shards and gold. Salvage is the source of shards from eligible
> found gear; see [Salvage and repair](salvage-and-repair.md).

## Common mistakes

- **Unsetting a gem when you mean to keep it.** Ordinary removal shatters the gem; Extract returns it whole for gold.
- **Trying to work on worn or unidentified gear.** Identify first and remove the piece before reforge or hone.
- **Expecting a Legendary item to reforge.** Only an Exalted Legendary's extra line is eligible.

## Next

- [Loot rarity](loot-rarity.md)
- [Salvage and repair](salvage-and-repair.md)

## Sources

- `src/systems/online/onlineLane.js`: forced online feature lane
- `src/systems/loot/lootRarity.js`: `WEAPON_SOCKETS`, `socketMax`, `GEM_IDS`, `GEM_GRADES`, gem socket operations,
  `reforgeableLines`, `honeableLines`
- `src/systems/gems.js`: `GEM_FIND`, `GEM_GRADE_BANDS`, `GEM_GRADE_PRICE`, `BOSS_GEMS`
- `src/systems/reforge.js`: `EXTRACT_PRICE`, `extractPrice`, `REFORGE_PRICE`, `reforgePrice`, `HONE_PRICE`,
  `honePrice`, `reforgeRefusal`, `honeRefusal`
- `src/scenes/worldModes.js`: Mages Guild Identify route and `openReforge`
- Research note: `handbook/research/P3.md`; online-lane check: `handbook/research/M.md`
