---
title: Choices that are hard to undo
summary: Separate decisions saved at creation from later systems that can change a limited part of your character.
stage: creation
order: 90
gate: none
status: draft
tags: [creation, permanent choices, respec, class skills]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Review your name, face, attributes, skills and reflexes on the creation summary before entering the world; check race, class and biography on their own screens.
> - A custom class's skill tiers, health per level and restrictions shape how that character advances and equips gear.
> - A later, paid skill swap can change one class skill at a time, but nothing makes every creation decision freely editable.
> - If a choice is central to how you want to play, check the linked creation page before confirming.

## Review the saved character

The creation wizard takes you through race, gender, class, biography, name, face, attributes, skills and reflexes, then shows a summary before it finishes. The summary shows your name, face, attributes, skills and reflexes, and you can still adjust them there; the Enhanced review also names your race and class. Your biography answers are not shown on it, so check them as you answer.

Race determines morphology and racial effects; class supplies the character's career structure and class skills; biography answers can modify starting details. These are different inputs, so changing a later setting or interface skin should not be mistaken for changing the saved creation choice.

## Choices with lasting consequences

For a custom class, review the primary, major and minor tiers, health per level, attribute allocation, and every advantage and disadvantage. Those choices set its advancement difficulty and the constraints it carries into play. A forbidden weapon, armour type or material can rule out equipment you later find.

For any class, put the skills you expect to use into tiers that reflect your play. Your early skill choices affect starting values and advancement. Later, a paid skill swap can trade one class skill you have not mastered for a skill outside your class, in the same tier; it sits beside [Masteries and specialisations](../late/masteries-and-specialisations.md).

The source identifies the wizard's final summary and later skill-swap system, but it does not establish a general undo button for race, biography, face or the rest of the original creation record. Treat those as decisions to verify before confirming rather than assuming they can be reset later.

## Before you confirm

1. Read the summary from top to bottom.
2. Check the class skill tiers against the way you expect to play.
3. Recheck any custom-class disadvantage that restricts equipment or spell use.
4. Confirm the name, attributes, face and reflex setting you intended, and that the race and class shown are the ones you chose.

## Common mistakes

- Treating all creation choices as a single “build” obscures which screen supplies each part of the character.
- Assuming a later skill swap can change race or the whole class overlooks its narrower scope.
- Taking a disadvantage for its difficulty points without accounting for its actual gameplay cost can create a restriction you notice often.

## Next

- [Choosing a playstyle](playstyles.md)
- [Custom classes](custom-classes.md)

## Sources

- `src/ui/chargen.js`: `STATES` (wizard order), `_enterSummary`, `confirmSummary`
- `src/ui/chargenArt.js`: `drawSummary` (classic summary: stats, skills, face, reflexes, name)
- `src/ui/enhanced/enhancedChargen.js`: `summaryStage` (Enhanced review: adds race and class)
- `src/systems/chargenSession.js`: creation choices and saved answers
- `src/systems/races.js`: race identity and morphology
- `src/systems/customClass.js`, `src/systems/specialAdvantages.js`: custom-class constraints
- `src/systems/skillSwap.js`: `SKILL_SWAP_GOLD`, `skillSwapRefusal`, `swappedCareer` (one unmastered class skill, same tier, for gold)
- Research notes: `handbook/research/C1.md`; `handbook/research/C2.md`; `handbook/research/P1.md`
