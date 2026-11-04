---
title: Archery and magic
summary: Draw a bow, lead your shots with movement, and manage spell points when casting.
stage: hold
order: 50
gate: none
tags: [archery, magic, spells, ranged combat]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - Bows use the Archery skill, and arrows travel as projectiles.
> - Draw time affects a bow shot: a quick release is less accurate and under-drawn shots deal less damage.
> - A normal spell cast costs at least **5** spell points; some effects can make a cast free.
> - A cast briefly occupies your hands, so leave room to move or choose a safe moment.

## Use a bow

Equip a bow and arrows, then draw and release to fire. A bow uses the Archery skill. Its arrow travels through the
space between you and the target, so moving out of an enemy archer's line can avoid a shot.

Give the shot time to draw. A release before **0.2 seconds** takes a penalty to hit; a draw that is too short also
reduces damage. Holding the draw too long lowers damage rather than improving it. You can recover some arrows from
foes or from where a shot struck the environment.

## Cast a spell

Casting uses spell points. The cost depends on the spell's effects, target and your skill in its school, with a floor of
5 points. Some effects can make a cast free. If your spell points are low, use a less costly spell or rest when it is
safe.

Starting a cast occupies your hands briefly, and a short recovery period follows. Avoid beginning a cast when an enemy
is already in striking range; move or create space first.

## Next

- [Loot and inventory](loot-and-inventory.md)
- [Health, fatigue and rest](health-fatigue-and-rest.md)

- [Spellmaking maths](../gear/spellmaking-math.md)
## Sources

- `src/combat/arrowFlight.js`: arrow flight, lodged arrows and recoverable stuck shafts
- `src/combat/pcaao.js`: `pcaaoAttackDamage` (bow damage online)
- `src/systems/roleplayRealism/rrRealism.js`: `rrAdjustWeaponHitChanceMod`, `rrAdjustWeaponAttackDamage`
- `src/systems/online/onlineLane.js`: PCAAO and Roleplay & Realism online rules
- `src/systems/spellcost.js`: `CAST_COST_FLOOR`, `calculateCastCost`
- `src/combat/fpsSpellCasting.js`: `CAST_RECOVER_S`
- Research note: `handbook/research/H2.md`
