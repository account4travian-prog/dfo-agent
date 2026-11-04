---
title: Choosing a race
summary: Race sets your look, gives three races a resistance or immunity, and online gives six races bonuses with particular weapons.
stage: creation
order: 20
gate: none
tags: [races, resistances, immunity, appearance]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Race sets your **look**, a **defence** for three races, and, online, **weapon bonuses** for six races.
> - Defences: **Breton** (resistance to magic), **Nord** (resistance to frost), **High Elf** (immunity to paralysis).
> - Weapon bonuses: Redguard, Nord, Dark Elf, Wood Elf, Khajiit and Argonian each hit harder and more accurately with
>   certain weapons. Khajiit and Nords also fight better bare-handed.
> - Race does not change your attributes or skills; your **class** sets those. See [Classes](classes.md).

## What race decides

Race sets your character's appearance: portrait, face set and body shape. It sets one defensive trait for three races,
and online it adds combat bonuses with certain weapons for six. It does **not** add to attributes at creation (they
come from your class plus a roll), and it does not raise skills.

## The eight races

| Race | Body | Defence | Weapon bonuses (online) |
|---|---|---|---|
| Breton | Human | **Resistance to Magic** | None |
| Redguard | Human | None | Long Blade, Blunt Weapon, Axe, Archery |
| Nord | Human | **Resistance to Frost** | Axe, Blunt Weapon, bare hands (damage only) |
| Dark Elf | Elf | None | Long Blade, Short Blade |
| High Elf | Elf | **Immunity to Paralysis** | None |
| Wood Elf | Elf | None | Short Blade, Archery |
| Khajiit | Khajiit | None | Short Blade, bare hands |
| Argonian | Argonian | None | Short Blade |

No playable race carries a weakness: none has low tolerance or critical weakness to anything.

## Racial weapon bonuses

> [!online] Online rule
> These bonuses come from the Physical Combat and Armor Overhaul, which DFO forces on for every online player. Each
> bonus is worked out from your attributes, so it grows as they rise.

The table shows each bonus for a character with **50 in every attribute**, as an example. Higher attributes raise
them.

| Race and weapon | Damage | To hit | Driven mostly by |
|---|---|---|---|
| Redguard, Long Blade | +2 | +9 | Agility |
| Redguard, Blunt Weapon | +2 | +5 | Strength |
| Redguard, Axe | +4 | +3 | Strength |
| Redguard, Archery | +2 | +4 | Agility |
| Nord, Axe | +4 | +3 | Strength |
| Nord, Blunt Weapon | +4 | +4 | Strength, Endurance |
| Nord, bare hands | +2 | +0 | Strength, Endurance |
| Dark Elf, Long Blade | +4 | +4 | Agility, Strength |
| Dark Elf, Short Blade | +2 | +3 | Agility, Speed |
| Wood Elf, Short Blade | +2 | +4 | Agility |
| Wood Elf, Archery | +4 | +9 | Agility, Strength |
| Khajiit, Short Blade | +2 | +4 | Agility |
| Khajiit, bare hands | +4 | +6 | Strength, Endurance, Agility |
| Argonian, Short Blade | +2 | +5 | Agility |

A matching race and class weapon add up: a Wood Elf archer gets the racial archery bonus *and* any bonus their class
gives for archery.

## How much the racial effects matter

When a hostile spell or effect reaches you, you get a **saving throw**: a chance to shrug it off, starting at 50%.
Racial effects change that chance:

| Racial effect | Effect on your saving chance |
|---|---|
| Resistance (Breton: magic; Nord: frost) | +30 points (50% becomes 80%) |
| Immunity (High Elf: paralysis) | Set to 100%: the effect never lands |

- **Immunity to Paralysis (High Elf)** is the strongest of the three. Paralysis stops you acting entirely. A class
  can undo it, though: a custom class with low tolerance or critical weakness to paralysis cancels the racial
  immunity (see [Custom classes](custom-classes.md)).
- **Resistance to Magic (Breton)** applies to spells that carry the magic flag, which covers a wide range of hostile
  magic.
- **Resistance to Frost (Nord)** applies to frost spells and effects.

Class traits add on top. A custom class can buy a resistance (+25 points) or an immunity (+50 points), and these add to
the racial bonus, so a Breton with a class resistance to magic saves at 50 + 30 + 25. The chance always stays between
5% and 95% unless something grants full immunity.

> [!note] Looks and armour
> Race also picks the body used to show your worn armour (Layered Gearing). See
> [Appearance](appearance.md).

## Next

- [Classes](classes.md)
- [Custom classes](custom-classes.md)

## Sources

- `src/systems/races.js`: `RACES` (ids 1-8), `RACE_TEMPLATES`, `MORPHOLOGY_OF`, `RACE_EFFECT_FLAGS`, `build`
  (Breton magic resistance, Nord frost resistance, High Elf paralysis immunity; no other flags, no weaknesses)
- `src/systems/chargen.js`: `rollStats` (attributes from the career, not the race), `applyCharacter`
- `src/combat/pcaao.js`: `pcaaoRacialModifiers` (per race, per weapon skill, stat-driven; bare hands for Khajiit and
  Nord); used by `src/combat/combatStats.js` when the overhaul core is active
- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS` / `ONLINE_WHOLE_MODS` (`pcaao` forced on, whole)
- `src/systems/effects.js`: `isEntityImmuneToParalysis` (racial immunity unless the career has low tolerance or
  critical weakness)
- `src/systems/spellcast.js`: `savingChance` (base 50; racial resistance +30, racial immunity 100; career resistant
  +25, immune +50, low tolerance -25, critical weakness -50; clamped 5-95 unless immune)
- Research note: `handbook/research/C1.md`
