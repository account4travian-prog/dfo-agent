---
title: "The hero's threat"
summary: How the world grows tougher as your level and Renown rise.
stage: feet
order: 100
gate: none
tags: [threat, enemies, character level, renown]
verified: 0df2d87eb
status: draft
---

> [!tip] At a glance
> - Foes gain health and deal more damage as your character level rises above 10.
> - Renown adds a second, compounding increase above Renown 15.
> - The character-level steps are larger than the Renown steps.
> - The scaling stops counting character levels above 30 and Renown above 50.

## Two tracks shape the threat

The hero's threat system gives newly built foes more health and stronger blows as your character level and Renown
rise. Online, its Loot Rarity feature gate is forced on. It uses both tracks
independently, then multiplies their effects together. Below character level 10 and Renown
15, neither track adds threat.

| Track | First level that adds threat | Each step adds to foe health | Each step adds to foe damage | Last level counted |
|---|---:|---:|---:|---:|
| Character level | 11 | 4% | 7% | 30 |
| Renown | 16 | 0.5% | 1% | 50 |

The increases compound. For example, the next character level multiplies the current threat again; it does not add a
fixed number of Health points. Levels beyond each track's last counted level add no more from that track.

This scaling is checked when a foe is built. A shared foe keeps its owner's health result; a visitor's own level does
not rebuild that foe's Health. The visitor's damage scaling still applies to blows dealt by the shared foe.

## What this means for you

Growing stronger also changes the fights the world gives you. A higher level can make an old kind of foe tougher, and
Renown contributes even when your character level has stopped rising. This does not mean every foe is individually
matched to you: the threat factor scales a foe's health and damage, while other systems decide which foes appear and
their base level.

See [Levelling online](levelling-online.md) for character levels and [Renown](renown.md) for its separate track.

## Common mistakes

- **Expecting threat to stop at character level 10.** That is where level scaling begins.
- **Expecting Renown to replace character level.** Its increase is separate and compounds with the level-based one.
- **Assuming your level changes a shared foe's Health.** The source makes its Health owner-authoritative in shared
  play; the visiting player's threat affects its damage only.

## Next

- [Renown](renown.md)
- [Elites and champions](../bay/elites-and-champions.md)

## Sources

- `src/systems/heroThreat.js`: `HERO_THREAT`, `stepsOf`, `heroThreat`, `heroThreatOf`
- `src/systems/loot/lootRarity.js`: `lootRarityOn` (the feature gate used by threat scaling)
- `src/systems/features.js`: online declaration for Loot Rarity
- `src/systems/online/onlineLane.js`: online forced preference policy
- Online-lane check: `handbook/research/M.md`
- Research note: `handbook/research/P2.md`
