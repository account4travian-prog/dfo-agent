---
title: Levelling online
summary: How skills, levels, attribute points and the health floor work online.
stage: feet
order: 10
gate: none
tags: [levelling, skills, attributes, health]
verified: 0df2d87eb
status: draft
---

> [!tip] At a glance
> - Use your class skills: primary and major skills, plus your strongest minor, drive character levels.
> - Skill uses build toward a raise; they do not raise a skill with every action.
> - Each online level gives you **5 attribute points** to allocate.
> - Your maximum Health cannot fall below the online class-and-Endurance floor.

## How a skill becomes a level

The game tallies eligible skill use and periodically checks whether a skill can rise. The check runs after more than 360
minutes (six game hours) of game time. The number of uses needed depends on the skill, its current value, your class's advancement
multiplier, and your character level. Stronger custom classes need more uses; higher skills and character levels also
raise the cost. The Growth panel shows your skill and level progress.

Character level follows a weighted skill sum: all primary skills, all major skills except the lowest, and the highest
minor skill count. Every 15 points of eligible progress advances the calculated level. When a level is owed, open the
level-up screen to apply it; each visit applies one level.

> [!online] Online attribute points
> Online gives a fixed pool of 5 attribute points at every level. Offline Daggerfall Unity rolls 4–6. You choose where
> the online points go, so Endurance can affect both future health gains and the health floor described below.

## The health floor

Your online maximum Health is kept at or above the value your class would have at your current level using average
health rolls and your current permanent Endurance. A low roll can still affect the health added at a level, but it
cannot leave your maximum below that floor. Raising Endurance can lift the floor retroactively.

This is an online layer; it does not rewrite your saved offline health rolls. For the other effects of attributes and
the actions that train individual skills, see [Attributes and skills](../creation/attributes-and-skills.md).

## Common mistakes

- **Expecting every use to raise a skill.** Uses accumulate until the skill's check is ready; the ticker is not a
  per-action progress bar.
- **Treating character level and Renown as one ladder.** Character level comes from skill progress. [Renown](renown.md)
  is a separate online track.

## Next

- [Renown](renown.md)
- [The Firmament](the-firmament.md)

- [The progression map](progression-map.md)
## Sources

- `src/systems/online/onlineLane.js`: online lane policy; `ONLINE_WHOLE_MODS` (`oblivion-remaster-leveling` keeps
  `Enabled` player-owned, but online characters use the port's online levelling lane)
- `src/systems/oblivionLeveling.js`: `newCharacterLevelingSystem`
- `src/systems/advancement.js`: `SKILL_RAISE_CHECK_INTERVAL`, `skillUsesForAdvancement`, `calculatePlayerLevel`,
  `raiseSkills`, `checkForLevelUp`, `applyLevelUp`
- `src/systems/skills.js`: `levelUpSkillSum`, `tallySkill`
- `src/systems/levelEven.js`: `ONLINE_BONUS_POOL`, `evenHpFloor`
- Research note: `handbook/research/C3.md`; `handbook/research/M.md`
