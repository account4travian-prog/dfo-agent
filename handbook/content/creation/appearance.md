---
title: Appearance and Layered Gearing
summary: Race, gender and face choices set your character's starting appearance; Layered Gearing displays worn armour online.
stage: creation
order: 70
gate: none
status: draft
tags: [appearance, race, face, layered gearing]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Race determines the character's body morphology and race-specific art; gender and face are separate creation choices.
> - You select a face during character creation; the source provides ten face indices for each race and gender set.
> - The profile's **Look** choice switches between **Skins** and **Layered Gearing (WIP)**.
> - Choose for the look you want: appearance does not replace your class, attributes or skills.

## Choices during creation

Character creation asks for race and gender before the face selection later in the wizard. The race table maps the human races to a human body, the three elf races to an elf body, and Khajiit and Argonian to their own morphologies. Your selected race also chooses its portrait and face set.

The face picker offers ten indices within each race-and-gender set. This controls the appearance chosen at creation; the source does not establish that changing a later interface skin changes your character's race or saved face choice.

For the gameplay effects of race, see [Choosing a race](races.md). Race does not supply the chargen attribute roll: each attribute is your class's base value plus a random 0 to 10, and you then spend a separate bonus pool.

## Skins and Layered Gearing

The **Look** control on your player profile separates **Skins** from **Layered Gearing (WIP)**. Skins lets you choose the on-foot and mounted appearance sets. Layered Gearing draws the on-foot body in the helmet, chest and leg armour it wears; you can choose a female or male body, or use your character's own body. The default is Layered Gearing with your own body. A rider has no layered gear art, so the mounted appearance remains its own choice.

This is visual presentation. It does not change what the character can equip or how armour protects them. The race table describes race morphology and race-specific creation art; the Layered Gearing choice is a separate profile appearance setting.

Your interface skin is a separate preference. You can change UI Overhaul through **Overhauls** without treating that as a new character-creation choice.

## Common mistakes

- Assuming race changes your attribute roll mixes appearance and race effects with class-based creation.
- Treating the face picker as a gameplay specialization adds a rule the chargen source does not define.
- Treating Layered Gearing as an armour rule: it presents worn pieces; your class and item rules decide what you can equip.

## Next

- [Choosing a race](races.md)
- [Choosing a playstyle](playstyles.md)

## Sources

- `src/systems/races.js`: `MORPHOLOGY_OF`, `RACE_TEMPLATES`, `FACES_PER_RACE`
- `src/ui/chargen.js`: chargen state order and face selection
- `src/systems/chargen.js`: `rollStats` (career base plus 0-10 per attribute, and the bonus pool)
- `src/player/eyeOfTheBeholder/layeredArmor.js`: Layered Gearing armour presentation
- `src/ui/skinCard.js`: profile Look picker and default presentation
- `src/systems/modSettings.js`: Eye Of The Beholder `Graphics.LayeredGear` (default 3, your own body)
- `src/systems/online/onlineLane.js`: `ONLINE_PLAYERS_OWN_MODS` (Eye Of The Beholder is each player's own online)
- `src/systems/uiSkin.js`, `src/systems/overhauls.js`: UI skin and Overhauls choices
- Research note: `handbook/research/C1.md`
