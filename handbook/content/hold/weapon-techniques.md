---
title: Weapon techniques
summary: Some weapon and gauntlet lines grant a special attack that uses its own key, fatigue cost, cooldown, and damage multiplier.
stage: hold
order: 40
gate: none
tags: [weapons, techniques, combat]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - A technique is a line that can appear on a weapon; a bare-handed technique uses your worn gauntlets.
> - Press the **Weapon Technique** key to use it. The default mouse binding is **Mouse3**, the back side button.
> - Techniques cost fatigue and have a cooldown.
> - Their damage modifies the normal attack formula; a technique can still miss.

## What a technique does

A weapon technique is a special attack attached to a technique line on eligible gear. The weapon in your hand provides
the technique; for bare-handed combat, worn gauntlets provide it. The line's printed value strengthens that technique's
own multiplier, which then modifies the normal weapon damage formula. It is not guaranteed damage: the attack still
uses its normal hit resolution.

Examples include **Volley** for bows, **Whirlwind** for long blades, and **Haymaker** for gauntlets. Other techniques
can lunge, leap, strike several nearby enemies or send a shot through a line of foes. Read the item's technique line
for the move it actually grants.

## Use the technique key

Press the **Weapon Technique** binding to activate the technique on the equipped weapon. Some techniques ask you to
aim before release; follow the targeting prompt on screen. The default keyboard/mouse action is bound to **Mouse3**,
the mouse's back side button; a touch layout provides a hold button labelled **Tech**.

Each technique has its own fatigue cost and cooldown. If you cannot use it, check that you have the required weapon or
gauntlets equipped, enough fatigue, and that its cooldown has ended.

## Find technique lines

Technique lines can be rolled on weapons and gauntlets by the loot system. Their chance and strength depend on the
item's rarity tier. You do not need to memorize every move now; compare a line's effect with how you prefer to fight.

## Next

- [Archery and magic](archery-and-magic.md)
- [Loot and inventory](loot-and-inventory.md)

## Sources

- `src/combat/technique/techniqueRoster.js`: `TECHNIQUE_FAMILIES`, `TECHNIQUE_BANDS`, `TECHNIQUE_PER_MILLE`,
  `TECHNIQUES`, `techniqueMult`
- `src/combat/techniques.js`: technique action and execution
- `src/systems/inputActions.js`: `WeaponTechnique` binding
- `src/systems/loot/lootRarity.js`: technique affix kind
- `src/systems/features.js`: Loot rarity feature and online declaration
- `src/systems/online/onlineLane.js`: online forced preference declarations
- Research note: `handbook/research/H2.md`
