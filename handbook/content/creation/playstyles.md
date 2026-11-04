---
title: Choosing a playstyle
summary: Compare warrior, mage, thief and hybrid playstyles, then place the skills and resources each uses into creation.
stage: creation
order: 80
gate: none
status: draft
tags: [playstyle, warrior, mage, thief, hybrid, creation]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Put frequently used skills in your class tiers so the raises normal play earns also count toward your character level.
> - A warrior needs dependable weapon skills and enough survival capacity to stay in a fight.
> - A mage needs the magic schools it will cast and a plan for spell points.
> - A thief needs the movement, stealth and access skills it expects to use; a hybrid must budget for both sides.

## Compare what each style asks of creation

These are planning lenses, not exclusive classes or a recommended build. The eighteen standard classes and the custom builder give different ways to cover the same needs. Online combat uses the port's active combat layer, so do not build around offline formula claims.

| Playstyle | Creation needs to consider | Trade-off to think through |
|---|---|---|
| Warrior | Place the weapon skill you expect to use, plus practical support such as Dodging, in a high class tier. Consider attributes and starting health that support staying engaged. | More room for combat skills means fewer high-tier slots for magic or social and utility skills. |
| Mage | Place the schools you plan to cast in high tiers. Check the class's spell-point basis and starting spell set before relying on a broad school list. | Spell points support spell use, but you still need a way to handle situations when a spell is unavailable or ineffective. |
| Thief | Prioritize the skills used for stealth, locks, movement and social access in the class tiers that match how often you will use them. | Skill breadth competes for the limited primary and major slots; a narrow focus leaves some situations to other tools. |
| Hybrid | Pick a main weapon or magic approach, then reserve high tiers for the second role's most-used skill rather than trying to cover every skill equally. | You gain flexibility but split class advancement focus and may need to manage more equipment or resources. |

## Make your class tiers do useful work

Your class has three primary, three major and six minor skills. Every skill improves with use, but only class skills move your character level: under the classic levelling every new online character uses, the level counts all three primaries, your two best majors and your best minor. A skill outside the class still rises; it just does not level you. Each tier also starts at a different value at creation, primaries highest and minors lowest, for stock and custom classes alike.

For magic, check whether a custom class places a school in primary or major: with at least one magic school there, it starts with the Spellsword's spell set, and with none it starts with no spells. A class's spell-point multiplier and your Intelligence set its base spell-point pool. For physical combat, choose a weapon family you are willing to keep using and consider the skill's class tier alongside the character's attributes.

## Check the trade-offs before you commit

Creation asks you to choose a race, gender, class, biography, name, face, attributes, skills and reflexes. A custom class also sets health per level, skill tiers and special advantages or disadvantages. Think about how the disadvantages will matter in ordinary play; a restriction on gear you expect to use is a recurring cost.

No archetype needs one fixed stat spread or class. Use [Classes](classes.md), [Custom classes](custom-classes.md), and [Attributes and skills](attributes-and-skills.md) to check the exact mechanics for the class you choose.

## Common mistakes

- Choosing skills for a theme alone can leave the abilities you use most in low tiers.
- Giving a hybrid every appealing skill can dilute its advancement focus.
- Assuming a mage's school list automatically provides every starting spell overlooks the class's starting-spell rules.
- Copying offline combat numbers into an online plan can misstate hit and damage formulas.

## Next

- [Classes](classes.md)
- [Choices that are hard to undo](hard-to-undo.md)

- [Beginner online builds](online-builds.md)
## Sources

- `src/systems/stockClasses.js`: online stock-class skill revisions
- `src/systems/customClass.js`: tier assignment and `customSpellSetIndex` (starting spells)
- `src/systems/chargen.js`: `rollSkills` (tier starting values), `STARTING_SPELL_SETS`, `spellPointMultiplier`
- `src/systems/advancement.js`: `skillUsesForAdvancement`, `raiseSkills`, `calculatePlayerLevel`
- `src/systems/skills.js`: `levelUpSkillSum` (primaries, two best majors, best minor)
- `src/systems/oblivionLeveling.js`: `newCharacterLevelingSystem` (classic levelling for new online characters)
- `src/combat/pcaao.js`, `src/systems/online/onlineLane.js`: online combat override and its activation
- Research notes: `handbook/research/C1.md`; `handbook/research/C2.md`
