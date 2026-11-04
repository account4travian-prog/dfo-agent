---
title: Beginner online builds
summary: Three safe starting archetypes and the decisions that matter under online combat and levelling.
stage: creation
order: 85
gate: none
status: draft
tags: [builds, archetypes, online, combat, leveling]
verified: e4f093166
---

> [!tip] At a glance
> - Online play forces **PCAAO**'s combat formulas: hit chance stays between {{fact pcaao.hitChanceMin}}% and {{fact pcaao.hitChanceMax}}%, and Strength adds damage at one point per ten past 50.
> - Each online level pays a fixed pool of five attribute points, with no roll, and maximum Health has a floor tied to Endurance.
> - Build around one damage skill and one defence plan, not a spread of six.
> - A custom class's forbidden materials and skill tiers cannot be undone, so check them before you confirm.
> - Masteries are permanent and you have two primary, two major and one minor slot; plan them before investing.

## What is different online

Online combat is not classic Daggerfall's formulas. The room forces PCAAO for everyone (`onlineLane.js` `ONLINE_ROOM_MOD_KEYS.pcaao`), and PCAAO changes the parts a build leans on:

- **To-hit is bounded.** A roll lands between {{fact pcaao.hitChanceMin}}% and {{fact pcaao.hitChanceMax}}%, so no build becomes unhittable or unable to miss. Weapon skill, enemy armour and fatigue decide where in that band you sit.
- **Strength adds flat damage.** PCAAO's damage modifier is one point per ten Strength above 50, doubled for two-handed weapons. That makes Strength a real damage stat without making it the whole build.
- **Low health is a bonus, not a plan.** Adrenaline Rush gives +8 to hit (+12 improved) while you are below one sixth of maximum health. It rewards a losing fight; do not build around staying there.
- **Armour reads in pieces.** A blocking shield is checked first, then the struck body part's armour, then natural resistance, and blunt and edged attacks read different reduction rows. Wearing a full suit matters more than one heavy piece.
- **Online levels are fixed.** Online uses the classic leveling system only, and each level gives a fixed pool of attribute points (`levelEven.js` `ONLINE_BONUS_POOL`) with a Health floor tied to Endurance. A low Health roll cannot leave you below that floor, so Endurance is never wasted. See [Levelling online](../feet/levelling-online.md).

Two more systems shape the build from above:

- **Firmament caps.** One weapon-family damage channel is capped together at +30%, and the whole blow is capped at +50%. A build that feeds one channel reaches the cap; a build that spreads across three reaches none of them. See [The Firmament](../feet/the-firmament.md).
- **Threat grows.** After character level 10 and Renown 15, foes gain health and damage, so a build is never finished at creation; gear and stars have to keep up. See [The hero's threat](../feet/heros-threat.md).

## Three beginner-safe archetypes

These are starting shapes, not a ranking. Each has a clear resource loop and a clear weakness.

### The weapon-and-shield fighter

A weapon skill in your primary or major tier, the heaviest armour your class allows, and a shield. Its loop is Health and fatigue: you close, trade blows, block the telegraphed ones and rest. It teaches the combat system without a second resource bar.

- **Safe because:** every ready-made class can fight from level 1 ([Classes](classes.md)), and gear upgrades improve it directly.
- **Weakness:** no ranged answer and no built-in heal unless you take Restoration, potions or a temple service. Archers and casters can kite it.
- **Decisions that matter:** which weapon family (one, not three), whether to raise Endurance early for the Health floor, and whether your class forbids the metal you want to wear.

### The destruction caster

Destruction in a primary or major tier, Willpower and Intelligence for spell points and casting, and a backup weapon for the moments magic runs dry. Its loop is magicka: range, burst, then recover.

- **Safe because:** range avoids the melee damage race, and Destruction is a straightforward damage skill.
- **Weakness:** magicka is a second resource to manage, and a silenced or drained caster is a common death. A caster needs a fallback attack and a way to restore spell points.
- **Decisions that matter:** one spell school rather than several, a weapon skill you will actually train as backup, and enough Endurance that a missed fight does not end the character.

### The stealth archer or thief

Archery, Stealth and Lockpicking, light armour and a short blade for when the fight closes. Its loop is positioning: hit from range or from stealth, avoid the fight, and use doors and distance.

- **Safe because:** you choose most fights, and Lockpicking and Stealth pay outside combat as well.
- **Weakness:** dungeons force close fights, and a missed opening shot leaves a lightly armoured character in melee. It rewards patience more than reflexes.
- **Decisions that matter:** Archery as the damage channel, one melee fallback, and whether to spend a major tier on Stealth or Lockpicking.

## Decision rules

1. **Pick a damage skill your class trains from level 1.** Every ready-made class was revised online so it can fight from the first level; a custom class should keep at least one weapon or Destruction skill in a primary or major slot.
2. **Choose one defence and commit.** Armour and a shield, range and avoidance, or a heal source — a little of each is worse than one done properly.
3. **Decide your healing before level 5.** Restoration, Alchemy and potions, or paid temple services. A build with no heal spends its gold on cures instead.
4. **Read the fatigue cost of your plan.** Techniques and heavy swings cost fatigue, and an exhausted character cannot land blows; a build that needs two techniques back to back needs the fatigue to pay for them.
5. **Check custom-class restrictions first.** A forbidden weapon, armour type or material can rule out the loot you will actually find, and there is no general undo. See [Choices that are hard to undo](hard-to-undo.md).
6. **Plan the mastery slots.** You can master two primary, two major and one minor skill, permanently. A build that needs three primary masteries does not fit.
7. **Do not rely on Adrenaline Rush.** It is a bonus below one sixth Health; a build that needs it is a build that is dying.

> [!warning] Build-agnostic means trade-offs
> No archetype is better in every fight. A fighter is easier to start, a caster controls range, and a stealth character chooses its fights. Pick the loop you enjoy repeating, then let gear and stars solve its weakness.

## Common mistakes

- **Spreading damage across weapon families.** The Firmament caps one channel, so a second family adds little until the first is full.
- **Taking a custom-class disadvantage for the points and meeting it every fight.** A forbidden material is not a difficulty setting; it is a loot filter.
- **Dumping every point into one attribute.** Attributes feed different formulas; check [Attributes and skills](attributes-and-skills.md) before committing the pool.
- **Ignoring the Health floor.** Endurance raises the floor retroactively, so early Endurance is not wasted even if your Health roll was good.
- **Planning past the online caps.** The build stops at the channel caps, not at the last star in the tree.

## Next

- [Build plans](../late/build-plans.md)
- [Choosing a playstyle](playstyles.md)

## Sources

- `src/combat/pcaao.js`: `PCAAO_HIT_CHANCE_MIN`, `PCAAO_HIT_CHANCE_MAX`, `pcaaoDamageModifier`, `pcaaoAdrenalineRushToHit`, `pcaaoArmorDamageReductionWithWeapon`, `pcaaoArmorDamageReductionWithUnarmed`, `pcaaoPercentageReductionCalculationWithWeapon`
- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS.pcaao` (forced online)
- `src/systems/levelEven.js`: `ONLINE_BONUS_POOL`, `evenHpFloor`; `src/systems/chargenSession.js`: online classic leveling
- `src/net/firmament/firmamentLaw.js`: `STAT_DEFS`, `BLOW_CAP`, `BLOW_TOTAL_CAP`
- `src/systems/heroThreat.js`: `HERO_THREAT`
- `src/systems/masterSkills.js`: mastery slots and permanence; `src/net/professionLaw.js`: `PROF_RANK_MAX`
- `src/systems/customClass.js`, `src/systems/specialAdvantages.js`: forbidden materials and advantages
- Handbook: [Classes](classes.md), [Custom classes](custom-classes.md), [Hard to undo](hard-to-undo.md), [Fighting](../hold/fighting.md), [Weapon techniques](../hold/weapon-techniques.md)
- Design records: `docs/23-playing-online.md` "How power works online"; `docs/29-build-systems.md`
- Research: `handbook/research/C1.md`, `handbook/research/P1.md`
