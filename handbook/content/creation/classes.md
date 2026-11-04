---
title: Classes
summary: The eighteen ready-made classes, grouped into casters, rogues and fighters, with the skills each one starts strong in.
stage: creation
order: 30
gate: none
tags: [classes, skills, careers, mage, warrior, thief]
verified: 0df2d87eb
---

> [!tip] At a glance
> - A class gives you your **attributes**, your **skill tiers**, your **health per level**, how fast you **level**, and
>   any built-in **advantages and disadvantages**.
> - DFO Online revised every ready-made class's skill lists so each one **can fight from level one** and no skill
>   slot is wasted on a language.
> - Casters, rogues and fighters each have six classes. Pick by how you want to play, not by name.
> - Want something else? Build a [custom class](custom-classes.md).

## How the classes changed online

Single-player Daggerfall's ready-made classes spent some skill slots badly (a Barbarian whose major skills were
Jumping, Running and Swimming; casters with two languages as minor skills). DFO Online re-chose every class's skill
lists by four rules:

1. Every class can fight from the first level: a primary or major skill in a weapon it may use, or in Destruction.
2. Movement skills (Jumping, Running, Swimming, Climbing) take a primary or major slot only where the movement is the
   class's identity: the Acrobat's Jumping and Running, the Burglar's Climbing, the Monk's and Barbarian's Running.
3. No language takes a skill slot. Languages are still learnt, as miscellaneous skills.
4. A pure fighter's primaries are two weapons and Critical Strike, which helps whichever weapon it carries.

Everything else about each class (attributes, health per level, levelling speed, spell points, advantages and
disadvantages) is unchanged from the class files. One equipment fix: the Burglar is now forbidden chain and plate
armour, instead of leather and chain.

## Casters

| Class | Primary | Major | Minor |
|---|---|---|---|
| Mage | Destruction, Alteration, Mysticism | Illusion, Thaumaturgy, Restoration | Medical, Short Blade, Blunt Weapon, Dodging, Etiquette, Mercantile |
| Spellsword | Long Blade, Restoration, Alteration | Axe, Blunt Weapon, Destruction | Illusion, Thaumaturgy, Mysticism, Short Blade, Dodging, Archery |
| Battlemage | Destruction, Long Blade, Axe | Thaumaturgy, Alteration, Restoration | Illusion, Mysticism, Dodging, Archery, Short Blade, Blunt Weapon |
| Sorcerer | Destruction, Mysticism, Alteration | Thaumaturgy, Illusion, Blunt Weapon | Restoration, Short Blade, Dodging, Medical, Mercantile, Streetwise |
| Healer | Restoration, Medical, Dodging | Blunt Weapon, Alteration, Mysticism | Thaumaturgy, Destruction, Illusion, Etiquette, Streetwise, Short Blade |
| Nightblade | Illusion, Stealth, Short Blade | Destruction, Backstabbing, Dodging | Alteration, Thaumaturgy, Critical Strike, Lockpicking, Restoration, Mysticism |

## Rogues

| Class | Primary | Major | Minor |
|---|---|---|---|
| Bard | Etiquette, Streetwise, Short Blade | Illusion, Mercantile, Stealth | Pickpocket, Lockpicking, Alteration, Restoration, Destruction, Archery |
| Burglar | Lockpicking, Stealth, Short Blade | Climbing, Backstabbing, Dodging | Critical Strike, Pickpocket, Mercantile, Streetwise, Archery, Running |
| Rogue | Long Blade, Stealth, Dodging | Pickpocket, Backstabbing, Streetwise | Critical Strike, Short Blade, Lockpicking, Archery, Blunt Weapon, Running |
| Acrobat | Dodging, Jumping, Short Blade | Running, Archery, Stealth | Climbing, Hand-to-Hand, Critical Strike, Backstabbing, Pickpocket, Swimming |
| Thief | Pickpocket, Stealth, Short Blade | Backstabbing, Lockpicking, Dodging | Critical Strike, Climbing, Running, Streetwise, Mercantile, Archery |
| Assassin | Short Blade, Critical Strike, Stealth | Backstabbing, Long Blade, Archery | Dodging, Lockpicking, Climbing, Pickpocket, Streetwise, Blunt Weapon |

## Fighters

| Class | Primary | Major | Minor |
|---|---|---|---|
| Monk | Hand-to-Hand, Critical Strike, Dodging | Medical, Blunt Weapon, Running | Archery, Short Blade, Stealth, Jumping, Climbing, Swimming |
| Archer | Archery, Dodging, Critical Strike | Short Blade, Long Blade, Stealth | Axe, Blunt Weapon, Hand-to-Hand, Running, Climbing, Swimming |
| Ranger | Archery, Long Blade, Stealth | Axe, Critical Strike, Dodging | Climbing, Swimming, Running, Medical, Short Blade, Blunt Weapon |
| Barbarian | Axe, Blunt Weapon, Critical Strike | Long Blade, Dodging, Running | Medical, Climbing, Jumping, Swimming, Archery, Hand-to-Hand |
| Warrior | Long Blade, Axe, Critical Strike | Blunt Weapon, Archery, Dodging | Short Blade, Hand-to-Hand, Medical, Climbing, Running, Swimming |
| Knight | Long Blade, Blunt Weapon, Etiquette | Axe, Critical Strike, Medical | Archery, Short Blade, Dodging, Mercantile, Running, Swimming |

## Attributes, health and levelling speed

Each class also has its own base attributes, health gained per level, levelling speed and spell-point multiplier.
These come from the game's class files:

```table classes.base
```

A class's **advancement multiplier** sets how many uses each skill needs to improve: a higher number means slower
skills and slower levels, in exchange for a stronger class. See [Attributes and skills](attributes-and-skills.md).

## Choosing

- **Want to cast spells?** Look at the casters, or the Nightblade and Bard for magic with stealth. Spell points come
  from Intelligence times the class multiplier.
- **Want to fight up close?** Warrior, Barbarian, Knight, or the Monk for bare hands.
- **Want range?** Archer or Ranger.
- **Want stealth?** Thief, Burglar, Assassin or Nightblade.
- **Want to talk and trade?** Bard and Knight carry the social skills (Etiquette, Streetwise, Mercantile).

Your skill tiers matter beyond the start: your character level rises as your primary, major and best minor skills
rise, so a class whose tiered skills match how you actually play levels faster.

## Next

- [Custom classes](custom-classes.md)
- [Attributes and skills](attributes-and-skills.md)

## Sources

- `src/systems/stockClasses.js`: `STOCK_CLASS_REVISIONS` (the revised skill lists, the four rules, the Burglar's
  armour), `reviseStockCareer`
- `bible/04-Characters/Stock-Classes.md` (CLASS-USE, 2026-10-21)
- `src/systems/chargenSession.js`: `loadCareers` (revisions applied when careers load)
- `src/ui/chargen.js`: `CLASS_NAMES`
- `src/systems/skills.js`: `levelUpSkillSum` (primary + major - lowest major + highest minor)
- Base attributes, health per level, advancement multiplier and magery: the game's `CLASS00.CFG`-`CLASS17.CFG`,
  read by `src/formats/classFile.js`
