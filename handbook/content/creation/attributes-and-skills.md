---
title: Attributes and skills
summary: What each of the eight attributes does online, how skills improve with use, and how your skills raise your level.
stage: creation
order: 50
gate: none
tags: [attributes, skills, strength, intelligence, endurance, speed, levelling]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Attributes run from 0 to 100. Each feeds specific formulas, such as carrying capacity, spell points, health per
>   level and hit chance.
> - Skills improve only by **using them**. There are 35, including nine languages.
> - Your **level** rises as your primary and major skills (and your best minor skill) rise: about every 15 points of
>   improvement in them.
> - Online, every level gives **5 attribute points** to spend, and a **health floor** keeps your maximum health from
>   falling behind an average roll.

## The eight attributes

| Attribute | What it does online |
|---|---|
| **Strength** | Damage with weapons and fists: +1 for every 10 points above 50 (−1 per 10 below); carrying capacity (1.5 kg per point); part of your fatigue pool |
| **Intelligence** | Spell points: Intelligence times your class's spell-point multiplier |
| **Willpower** | Resisting spells: every 10 points add 1 to your saving throw |
| **Agility** | Hitting what you swing at: +1 to hit for every 4 points you have above your target's Agility (and −1 per 4 below) |
| **Endurance** | Health gained each level: adds (Endurance ÷ 10) − 5 to each roll; part of your fatigue pool; health recovered while resting |
| **Personality** | How people react when you talk to them; part of shop prices, with Mercantile |
| **Speed** | How fast you move and how fast your weapon swings; also +1 to hit for every 8 points above your target's Speed |
| **Luck** | +1 to hit for every 10 points above your target's Luck; a target with high Luck is harder to hit; part of your critical-hit chance |

> [!online] Online rule: one combat ruleset
> Online combat always uses the Physical Combat and Armor Overhaul's formulas (a mod DFO forces on for every player),
> not classic Daggerfall's. Under it, your chance to hit compares your Agility, Speed and Luck with your target's,
> and the final chance is kept between {{fact pcaao.hitChanceMin}}% and {{fact pcaao.hitChanceMax}}%: no blow is ever certain to land or to miss.

Your fatigue pool is Strength plus Endurance; your carrying capacity is one and a half times your Strength in
kilograms. Your starting health is 25 plus your class's health per level.

> [!note] Live values
> Spells, potions, gear and curses can raise or lower an attribute for a while. Formulas use the live value, kept
> between 0 and 100 unless an effect lifts the ceiling.

## Skills

There are 35 skills. Every character has all of them; your class decides which start high (see
[The creation screens](creation-screens.md#skills-three-tiers)).

| Group | Skills |
|---|---|
| Weapons | Short Blade, Long Blade, Hand-to-Hand, Axe, Blunt Weapon, Archery, Critical Strike |
| Magic | Destruction, Restoration, Illusion, Alteration, Thaumaturgy, Mysticism |
| Stealth | Stealth, Backstabbing, Lockpicking, Pickpocket |
| Movement | Running, Jumping, Climbing, Swimming, Dodging |
| People | Etiquette, Streetwise, Mercantile, Medical |
| Languages | Orcish, Harpy, Giantish, Dragonish, Nymph, Daedric, Spriggan, Centaurian, Impish |

Skills improve by doing the thing: swinging a weapon, casting a spell of that school, sneaking, trading, talking,
running. Languages improve when you speak with creatures of that kind (or fight them).

### How quickly a skill improves

Each improvement needs a number of uses that grows with:

- the skill's current value (high skills need more uses);
- the skill's own rate (some skills are naturally slow: Running and the languages need many uses, Medical and
  Critical Strike quite a few);
- your class's advancement multiplier (see [Custom classes](custom-classes.md#the-difficulty-dagger));
- your character level (about 4% more per level).

Skills don't rise the moment you've done enough. They are checked when at least six game hours have passed since the
last check, typically when you rest or travel. The enhanced character sheet shows how close each skill is.

## Levelling up

Your level is worked out from a **skill sum**: your three primary skills, plus your major skills except the lowest,
plus your highest minor skill. Each time that sum rises about **15 points** above where you started, you gain a
level.

When you level up online:

- you get **5 attribute points** to place (offline Daggerfall Unity rolls 4 to 6);
- you gain health: a roll based on your class's health per level, plus your Endurance bonus, at least 1;
- the **health floor** applies: your maximum health is never lower than what an average roll at every level would have
  given, at your current permanent Endurance. Raising Endurance later lifts the floor for past levels too.

> [!tip] Spend points where they pay
> Points in Endurance raise health for every level you've had, through the floor. Points in the attributes your
> playstyle uses most (Strength and Agility for fighters, Intelligence and Willpower for casters, Agility and Speed for
> stealth) pay off in every fight.

## Next

- [Reflexes, biography and starting gear](creation-screens.md#reflexes)
- [Your first minutes in Privateer's Hold](../hold/first-minutes.md)

## Sources

- `src/systems/statMods.js`: `liveStat` (0-100 clamp, maximum modifiers), `maxFatigue` (`FATIGUE_MULTIPLIER`)
- `src/combat/formulas.js`: `maxEncumbrance` (Strength × 1.5), `spellPointsFor`, `magicResist` (Willpower ÷ 10)
- `src/combat/pcaao.js` (forced on online): `pcaaoDamageModifier` ((Strength − 50) ÷ 10), `pcaaoStatDiffsToHit`
  (Luck ÷ 10, Agility ÷ 4, Speed ÷ 8 differences; target Luck above 50), `PCAAO_HIT_CHANCE_MIN`/`MAX` (3-97)
- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS`, `ONLINE_WHOLE_MODS` (`pcaao` forced on, whole)
- `src/combat/combatStats.js`: `criticalModel` (Luck)
- `src/systems/chargen.js`: `rollMaxHealthLevel1` (25 + health per level), `hitPointsModifier`,
  `hitPointsPerLevelUp`, `SPELL_POINT_MULTIPLIERS`
- `src/systems/rest/rest.js`: `healthPerRestStep` (Endurance and Medical)
- `src/systems/talk/talkTopics.js`: reaction (Personality ÷ 5); `src/systems/shopStock.js`: `calculateTradePrice`
- `src/player/motor.js` and `src/combat/weapon/weaponRig.js`: Speed in movement and swing timing
- `src/systems/skills.js`: `SKILLS`, `tallySkill`, `levelUpSkillSum`
- `src/systems/advancement.js`: `SKILL_ADVANCEMENT_MULTIPLIER`, `skillUsesForAdvancement`, `SKILL_RAISE_CHECK_INTERVAL`
  (360 game minutes), `calculatePlayerLevel` (every 15 points), `bonusPoolFor`
- `src/systems/levelEven.js`: `ONLINE_BONUS_POOL` (5), `evenHpFloor`
- Research note: `handbook/research/C3.md`
