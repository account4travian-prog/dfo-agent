---
title: The creation screens
summary: Character creation is a short wizard, from race to a final summary; this page walks through each screen and what it decides.
stage: creation
order: 10
gate: none
tags: [character creation, wizard, race, class, biography, reflexes]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Creation runs in a fixed order: **race, gender, class, biography, name, face, attributes, skills, reflexes**, then a
>   summary.
> - Your **class** decides most of your character: its attributes, skills, health per level and how fast you level.
> - **Race** decides your look and, for three races, a resistance or immunity. It does not change your attributes.
> - New online characters always use the classic levelling system.

## The order of the screens

![Twelve creation screens from race to summary](theme/art/diagram-creation-flow.svg "Caption: The creation overview runs from race to summary, followed by the online levelling question.")

| Step | Screen | What you decide |
|---|---|---|
| 1 | Race | One of eight races. See [Choosing a race](races.md). |
| 2 | Gender | Your character's body and portrait set. |
| 3 | Class method | Answer questions to be given a class, pick one from the list, or build a custom class. |
| 4 | Class | One of the eighteen classes, or the **Custom** row. See [Classes](classes.md) and [Custom classes](custom-classes.md). |
| 5 | Biography method | Answer background questions, or skip them. |
| 6 | Biography | Questions about your past; some answers adjust your starting details. |
| 7 | Name | Your character's name. |
| 8 | Face | One of ten faces for your race and gender. |
| 9 | Attributes | Your eight attributes, with bonus points to place. See [Attributes and skills](attributes-and-skills.md). |
| 10 | Skills | Your starting skill values, with points to place in each skill tier. |
| 11 | Reflexes | How quickly enemies react to you, from Very High to Very Low. |
| 12 | Summary | Check everything, then enter the world. |

The interface skin changes how these screens look, not what they ask. Classic and Enhanced skins run the same steps.

## Three ways to choose a class

- **Questions:** answer a short set of situational questions and the game proposes the class that fits your answers.
- **List:** pick any of the eighteen classes directly. Each has fixed attributes, skills and special abilities.
- **Custom:** design your own class: choose its skills, health per level, advantages and disadvantages. The game
  measures how strong the result is and makes a stronger class level more slowly.

If you already know the playstyle you want, the list or custom route gives you the most control.

## Attributes: rolled, then placed

Each attribute starts from your class's base value plus a random 0 to 10. You then get a pool of 6 to 14 bonus points
to place, one at a time, within the screen's limits. Reroll until you like the starting spread, then place the pool on
the attributes your playstyle relies on.

> [!online] Online rule
> New online characters always use **classic levelling**. Single-player Daggerfall Unity also offers an
> Oblivion-style levelling option; it is not available online.

## Skills: three tiers

Your class sorts skills into three tiers. Each tier starts higher than the one below, and each tier gives you 6 points
to place on the skills in it:

| Tier | Skills | Starting value |
|---|---|---|
| Primary | 3 | 28 to 31 |
| Major | 3 | 18 to 21 |
| Minor | 6 | 13 to 16 |
| Everything else | the rest | 3 to 6 |

Your tiered skills also drive your character level: you level up when they have risen far enough. See
[Attributes and skills](attributes-and-skills.md).

## Reflexes

Reflexes are a difficulty setting for combat. There are five settings, from **Very High** to **Very Low**; the default
is **Average**. Higher reflexes make fights harder:

| Reflexes | Time between an enemy's melee attacks | Chance a monster lands each of its extra attacks |
|---|---|---|
| Very High | 0.9 seconds shorter than Average | 70% |
| High | 0.45 seconds shorter | 60% |
| Average | the base timing | 50% |
| Low | 0.45 seconds longer | 40% |
| Very Low | 0.9 seconds longer | 30% |

Online, enemies also **telegraph** many of their attacks (a glint and a marked shape on the ground; see
[Fighting](../hold/fighting.md)). A telegraphed attack lands when its wind-up completes, not on the timer above, so
reflexes mostly change the pace of an enemy's ordinary swings and how many of a monster's extra attacks connect.

The setting is fixed at creation. If you are new to Daggerfall-style combat, Average or Low is a comfortable start.

## Next

- [Choosing a race](races.md)
- [Classes](classes.md)

## Sources

- `src/ui/chargen.js`: `ChargenFlow`, `STATES` (screen order), face index, Average reflex default
- `src/ui/chargenArt.js`: `PLAYER_REFLEXES`, `REFLEX_COUNT`
- `src/characters/enemy/enemyAttack.js`: `MELEE_TIMER_REFLEX_MS` (450 ms per step), `resetMeleeTimer`
- `src/combat/formulas.js`: `calculateAttackDamage` monster attack gate `50 - 10 × (reflexes - 2)`; the same gate
  in the online combat core, `src/combat/pcaao.js` (PCAAO, forced on online)
- `src/characters/enemy/enemyAttack.js` TACT4/TELL2 notes: a telegraphed blow lands "whatever the clock"
- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS` (`pcaao` forced on)
- `src/characters/playerEntity.js`: `reflexes` (0 Very High to 4 Very Low, 2 Average)
- `src/systems/chargen.js`: `rollStats` (base + 0-10, pool 6-14), `rollSkills` (tier baselines and 6-point pools)
- `src/systems/chargenSession.js`: `loadCareers`, `applyCreationExtras`, online classic levelling
  (`applyHeadlessChargen` notes)
- `src/systems/races.js`: `FACES_PER_RACE`
- Research note: `handbook/research/C1.md`
