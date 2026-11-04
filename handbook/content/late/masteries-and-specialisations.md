---
title: Masteries and specialisations
summary: Mastering skills at 100, the climb to 200, and the thirty specialisation paths.
stage: late
order: 30
gate: other "A skill at 100"
tags: [mastery, skills, specialisation, late game]
verified: e4f093166
status: draft
---

> [!tip] At a glance
> - At skill 100 you may master an eligible class skill if its group has a free slot: 2 primary, 2 major and 1 minor, five in all. A mastery is permanent.
> - A mastered skill can reach 200, at 4×, 8× and 16× the uses a point, worth a quarter point each, with milestone bonuses at 125, 150, 175 and 200.
> - Past 100 a skill learns only from foes tough for it; weak enemies and repetition teach nothing.
> - Two mastered schools or two mastered weapon skills open a specialisation path: one arcane and one martial may be held together. A path reset costs 200,000 gold per family; a class skill swap costs 100,000 gold.

## Mastering a skill

Online, **Master Skills** is always active. When a primary, major or minor skill reaches 100, the game offers to master it; you can also choose later from the skill screen. Slots are separate by career group: two primary, two major and one minor. Miscellaneous skills can never be mastered and stop at 100.

The choice is permanent: you cannot unmaster a skill, move its slot or refund it. Mastering also lifts Daggerfall's old rule that holds other skills at 95 once a primary skill is mastered, so every skill can reach 100. Only a mastered skill passes it.

## Progress above 100

A mastered skill grows to a hard cap of **200**. The climb is slow: 4× the uses a point from 100 to 125, 8× from 125 to 150 and 16× from 150 to 200. Points above 100 count a quarter each in every formula, and milestones add effective points on top: **125 Expert +2**, **150 Master +3**, **175 Grandmaster +4**, **200 Legend +6**.

That is 25 points from the climb plus 15 from the milestones, so a sheet showing 200 reads as 140 to the formulas.

Past 100, a use counts only when the foe is tough for that skill. The foe's tier is **5 × its level + 30**, measured against the skill's value: below three quarters of the skill nothing counts, from there to the skill's value the weight ramps in, and above it up to one and a half times. At 100 a foe of about level 9 starts to teach and level 14 teaches fully; at 150 those are about level 17 and 24; at 200 about 24 and 34. Running, jumping, swimming and climbing instead count ground actually covered, and repeated use is damped, so nothing trains a mastery AFK.

## Specialisation paths

Mastering two of the six spell schools opens the **arcane** paths: fifteen, one for each pair of schools. Mastering two of the six weapon skills opens the **martial** paths: also fifteen, one for each pair. A character may hold **one arcane and one martial path** at the same time.

Each path gives a passive effect and a signature: an arcane path a signature spell, a martial path a weapon technique that answers on the technique key when the weapon in hand is one of its pair's. You choose once two of its skills are mastered, from the **Specialisations** guide on the **Growth** tab, which shows which paths are ready. Like a mastery, the choice is permanent unless you pay for a reset. The design records are `bible/06-Systems/Arcane-Specialisations.md` and `bible/05-Combat/Martial-Specialisations.md`.

## The skill swap: 100,000 gold

A class's skill lists are fixed at creation, so a class holding one weapon skill could never master the two a martial path needs. **Skill swap** gives up one class skill you have **not** mastered and takes one skill from outside your class in its place. Primary goes to primary, major to major, minor to minor, so the 2/2/1 slots and every mastery already spent stand.

The swap costs **100,000 gold** a time. Skill values and your character level do not move: a swap that lowers the class's skill sum leaves the level where it stands, and the class's skills make up the ground before the next level. Online the gold comes from coins, letters of credit and then the Empire's account. The swap is repeatable — the skill you give up is then outside the class — so another paid swap can bring it back.

## The path reset: 200,000 gold per family

A chosen path can be given up for **200,000 gold**, once for the arcane family and once for the martial. The reset clears only that path. Your masteries stay, so the guide offers every path those masteries open.

The signature spell stays in your book. Without its path it is the plain spell the spell maker could have made: its path pricing and rider no longer apply. The reset marks that family's choice as asked, so the game does not prompt you to choose back the path you paid to remove.

## What is and is not reversible

| Change | Cost | Reversible? |
|---|---|---|
| Master a skill | Free at 100, one group slot | No |
| Climb past 100 | Uses | Not undone; the points stay |
| Choose a path | Free | Yes, 200,000 gold per family |
| Swap a class skill | 100,000 gold | Yes, by another swap |
| Signature spell after a reset | — | Kept, without path powers |

## Common mistakes

- **Expecting a skill at 100 to rise automatically.** It must be mastered, with a slot free in its group.
- **Spending a slot without checking the paths you want.** Masteries cannot be refunded or moved.
- **Training past 100 on weak foes.** Below the foe tier nothing counts, however long you repeat it.
- **Expecting a 200 to act like a 200.** Formulas read 140, and the last 50 points cost 16× each.
- **Confusing a reset with a mastery refund.** A reset clears only the chosen path.
- **Swapping a mastered skill.** The swap only accepts a class skill you have not mastered.

## Next

- [The hero's threat](../feet/heros-threat.md)
- [The Firmament](../feet/the-firmament.md)

## Sources

- `src/systems/masterSkills.js`: `MASTERY_SLOTS`, `masterSkillsActive`, `masteryRefusal`, `masterSkill`, `skillCanPassCap`
- `src/systems/skillSoftcap.js`: `SKILL_HARD_CAP`, `OVERCAP_POINT_WEIGHT`, `SOFTCAP_TIERS`, `SKILL_MILESTONES`, `effectiveSkill`, `challengeTier`, `challengeQuality`, `overcapTallyWeight`, `movementTallyWeight`, `combatEdge`
- `src/systems/arcanePaths.js`: `PATHS`, `SPEC_RESET_GOLD`, `pathChoices`, `pathRefusal`, `pathPossible`
- `src/systems/martialPaths.js`: `MARTIAL_SKILLS`, `MARTIAL_PATHS`, `martialChoices`
- `src/systems/specReset.js`: `specResetRefusal`, `resetSpec`
- `src/systems/skillSwap.js`: `SKILL_SWAP_GOLD`, `swapOutChoices`, `swapInChoices`, `skillSwapRefusal`, `swapSkill`, `swapShortfall`
- `src/ui/growth/specGuide.js`: `drawSpecGuide`
- `bible/06-Systems/Arcane-Specialisations.md`, `bible/05-Combat/Martial-Specialisations.md`: design records
