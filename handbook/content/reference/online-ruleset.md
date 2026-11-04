---
title: Which rules apply online
summary: DFO Online folds in many mods; this page shows which are forced on for everyone, which are locked at their defaults, and which are yours to switch.
stage: reference
order: 20
gate: none
tags: [mods, online rules, settings, PCAAO, Roleplay & Realism, Unleveled Loot]
verified: 0df2d87eb
---

> [!tip] At a glance
> - DFO Online is Daggerfall Unity plus many mods, some built into the game and some you can toggle.
> - Online, every mod falls into one of three groups: **forced on for the shared world**, **balance mods locked at
>   their defaults**, or **yours to switch** (looks and sound only).
> - Combat, loot, enemies, travel, encumbrance, loans and repairs follow the locked mods' rules, not classic
>   Daggerfall's. Advice written for single-player Daggerfall or Daggerfall Unity is often wrong online.
> - Every rule in this handbook is checked against the version that actually runs online.

## Why this matters

Many of the game's formulas exist more than once in its code: the classic version, and a mod's replacement. Offline,
your mod switches decide which one runs. Online, DFO decides for everyone, so that two players in the same dungeon
fight by the same rules, see the same towns and roll loot from the same tables.

If you read a guide for classic Daggerfall or for Daggerfall Unity, check its numbers against this handbook. Hit
chances, damage, racial bonuses, loot materials, encumbrance and loan limits all differ online.

## The three groups

| Group | What it means | Examples |
|---|---|---|
| **Forced on for the shared world** | Switched on for every player, because the world must be the same for everyone: the ground, the towns, the sea, the raids | Basic Roads, World of Daggerfall, Beautiful Cities and Villages, Detailed Ships, World Events: Raiding Parties, Travel Options, Immersive Travel, Iliac Puddle No More |
| **Balance mods, locked whole** | Forced on, and every one of their settings held at its shipped default; you can't change their dials online | Physical Combat and Armor Overhaul, Meaner Monsters, Daggerfall Enemy Expansion, Unleveled Loot, Roleplay & Realism and its Items add-on |
| **Yours to switch** | Change only what your own screen shows or your speakers play; they never change a rule | Dynamic Skies, Seasons, Weapon Widget, Eye of the Beholder, Immersive Footsteps, ambience, foliage and weather effects |

The game's own enhancements follow the same idea: those that shape the shared world (Enhanced AI, Loot rarity,
weather, landforms, questlines, naval encounters) are on for everyone; visual quality settings are yours.

## Every mod and feature

This table is generated from the game's own online settings ledger each time the handbook is built, so it is always
current:

```table online.ruleset
```

## What the locked mods change

| System | The rule online | Not the rule online |
|---|---|---|
| Hitting and damage | Physical Combat and Armor Overhaul: your Agility, Speed and Luck against the target's; hit chance always 3% to 97%; racial weapon bonuses; attribute-based Expertise | Classic Daggerfall's hit and damage formulas |
| Enemy attacks | Enhanced AI: telegraphed attacks land when their wind-up completes; ordinary swings still follow the attack timer | Classic timing alone |
| Enemies | Meaner Monsters and Daggerfall Enemy Expansion: tougher foes and a wider roster, decided by the dungeon's host for everyone | The base enemy tables |
| Loot | Unleveled Loot and Loot rarity: materials come from luck, place and source, not your level; a shared container's contents are rolled by the shared rules | Classic level-scaled loot |
| Carrying | Roleplay & Realism: carrying more than 75% of your limit slows you and drains fatigue | Classic "no penalty until the limit" |
| Loans | Roleplay & Realism's loan table, divided by ten for the Empire's bank: 1,000 gold per level | Offline loan limits |
| Repairs and selling | Roleplay & Realism Items: an item's condition affects its sale price; magic items can always be repaired | Classic repair and price rules |
| Travel | Travel Options: journeys over land are walked or ridden in real time; the carriage driver is the paid land shortcut | Daggerfall's instant map travel |

## Settings that stay yours

A few rules still depend on a choice you make online. Pages that depend on one say so.

| Setting | Default | What it changes |
|---|---|---|
| Climates & Calories | Boons | How hunger, thirst and temperature affect you (Off, Boons, Casual or Hard) |
| Horse care and wagon upkeep | Boons | How much feeding and wear matter |
| Levelling style | Classic | Fixed at character creation; online characters use classic levelling |
| Shield Widget | on | How your own shield blocks are shown and resolved for you as the defender |

## Next

- [The creation screens](../creation/creation-screens.md)
- [Fighting](../hold/fighting.md)

- [Coming from Daggerfall or Daggerfall Unity](coming-from-daggerfall.md)
## Sources

- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS`, `ONLINE_WHOLE_MODS`, `ONLINE_PLAYERS_OWN_MODS`,
  `ONLINE_FORCED_PREFS`, `ONLINE_FORCED_SETTINGS`, `asTheRoom` (shared loot rolled under the shared rules)
- `src/systems/features.js`: the Features registry's `online` declarations
- `src/systems/modSettings.js`: `modSetting`, `onlineModSetting`
- `src/combat/pcaao.js`, `src/systems/roleplayRealism/rrRealism.js` (encumbrance effects), `src/systems/banking.js`
  (`EMPIRE_LOAN_DIVISOR`), `src/systems/unleveledLoot.js`, `src/systems/loot/lootRarity.js`
- `src/characters/enemy/enemyAttack.js` (`meleePass`, telegraphed blows)
- Research notes: `handbook/research/M.md` (ledger and overlap map), `T1.md`, `H3.md`, `P3.md`, `V1.md`
