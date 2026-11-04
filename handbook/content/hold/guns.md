---
title: Guns and paired weapons
summary: Understand the Dwarven Pistolet, its ammunition, paired guns and the trade-off of carrying a blade beside one.
stage: hold
order: 45
gate: none
status: draft
verified: e4f093166
tags: [guns, pistolet, archery, dual wield]
---

> [!tip] At a glance
> - The **Dwarven Pistolet** is a one-handed weapon using Archery.
> - Its base damage is 4–15 and its template value is 260 gold.
> - Both guns consume **Dwemer Pellets**, not arrows.
> - You can pair two Pistolets or carry one beside a one-handed melee weapon.
> - Neither gun drops in the checked version; ammunition still drops and appears in shops.

## Recognize what you have found

You can encounter Dwemer Pellets before you own a gun. They are ammunition for the Dwarven Pistolet and the **Dwarven Thunderlock**. A pellet stack is not a broken weapon, a crafting requirement for assembling a pistol, or evidence that a gun must be nearby.

The Pistolet is the one-handed firearm. Its base damage span is 4–15, and its template value is 260 gold. That value is the item's underlying price field; it is not a promise that a shop or another player will sell one to you for that amount. Your actual combat results depend on the weapon and the wider combat rules, rather than the base span alone.

You use Archery when firing it. Equipping a gun does not turn its shots into melee attacks because the weapon fits in one hand. If you are learning ranged combat, read [Archery and magic](archery-and-magic.md) for the surrounding skill and resource concepts, while remembering that a gun fires by trigger rather than a bow's draw-and-release action.

## Carry one gun or a pair

You can equip a Pistolet in either hand. With a second Pistolet equipped, you have a gun pair. Each pistol has its own firing and reload state. When the next hand cannot fire because it is reloading, the attack can fall to the loaded pistol.

Use **H** to choose the lead hand. The pair still uses the ordinary attack control; you do not need a separate trigger button for each pistol. Keep enough ammunition for the shots you intend to make. Sharing an ammunition type means both guns draw on your pellets, rather than giving each hand an independent supply of free shots.

The Thunderlock is a different weapon. Do not treat every firearm as eligible for the Pistolet's pair rules: the code specifically admits Pistolets as the guns of a pair. Seeing a player carry two pistols does not mean you can equip two Thunderlocks in the same way.

## Pair a blade with a Pistolet

Equip an eligible one-handed melee weapon beside the Pistolet to make a mixed pair. Your hands take turns: a blade swing and a gunshot do not land as simultaneous actions from the same attack press. While the gun reloads, an attack that would use it falls to the blade. If you run out of pellets, the blade can still fight.

The cost is reload time. A lone Pistolet or a gun pair uses a 1.4-second reload. Beside a blade, the Pistolet reloads at twice that duration: **2.8 seconds**. The source's `MIXED.RELOAD = 2` is a multiplier, not a two-second timer. This gives you something to do during the reload, with a longer wait between available shots.

Your technique belongs to the lead weapon and does not automatically fall back to the blade. A technique attempted with a reloading lead gun can be refused. Check your lead hand before using [Weapon techniques](weapon-techniques.md), and use [Fighting](fighting.md) for the underlying melee decisions.

## Understand current availability

The **GUNS-UNFOUND** change dated 23 October 2026 stops both guns from dropping. Existing owners retain their weapons and can still use them. Older descriptions of finding a gun describe an earlier version; they are not a route for a new character in this snapshot.

The former gun find now produces pellets alone. Weapon-selling shops also stock pellets, while their shelves do not sell the guns. You may therefore first meet this system through ammunition in loot, ammunition on a shop counter, or a firearm another player already owns. The checked sources do not set a new-player gun acquisition quest or a guaranteed replacement source.

## Common mistakes

- Farming a former gun drop: the current find produces ammunition without either weapon.
- Buying arrows for a firearm: both guns require Dwemer Pellets.
- Expecting a mixed pair to double your attacks: its hands take turns and the gun reloads more slowly.

## Next

- [Weapon techniques](weapon-techniques.md)
- [Loot rarity](../gear/loot-rarity.md)

## Sources

All game paths below refer to snapshot `e4f093166`.

- `bible/05-Combat/Dwarven-Pistolet.md`: “The item” and GUNS-UNFOUND availability correction.
- `bible/05-Combat/Dwarven-Thunderlock.md`: ammunition, custom-template registration and GUNS-UNFOUND.
- `bible/05-Combat/Two-Hands.md`: “A pair of guns” and “A blade and a gun”.
- `src/characters/itemTemplates.json`: classic table; firearm rows are registered separately.
- `src/systems/pistolet.js`: `PISTOLET_TEMPLATES` (260 gold), one-handed Archery registration.
- `src/characters/thunderlockIds.js`: `PISTOLET_SPAN` (4–15), `ammoTemplateFor`.
- `src/combat/twoHands/handsLaw.js`: `handsModeOf`, `DUAL_GUN_TYPES`, `gunHandOf`, `MIXED.RELOAD`, `mixedStrike`.
- `src/combat/playerWeapon.js`: `_pistolsFor` multiplies reload by `MIXED.RELOAD`; `_mixedAttack` and lead-technique rules.
- `src/combat/gun/gunFeel.js`: `PISTOLET_FEEL.reloadMs` (1400); mixed reload derives as 1400 × 2 milliseconds.
- `src/systems/thunderlock.js`: GUNS-UNFOUND `registerUniqueFind` mint returns only `createPellets`.
- `src/systems/shopStock.js`: `shopPelletStack`, weapon-shop pellet stock.
