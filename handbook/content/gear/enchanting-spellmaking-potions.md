---
title: Enchanting, spellmaking and potions
summary: Turn gold, equipment and ingredients into custom magic, and distinguish guild makers from profession brewing.
stage: gear
order: 25
gate: none
status: draft
verified: e4f093166
tags: [enchanting, spellmaking, potions, soul gems, crafting]
---

> [!tip] At a glance
> - Item making fits powers within an item's point budget; drawbacks make room without lowering the gold bill.
> - Spell making prices your chosen effects and separately shows the spell points needed to cast.
> - Profession brewing uses recipes, ingredients and rank, with ordinary and Potent results.
> - Guild halls and selected temples offer makers; profession Alchemy uses its own station route.

## Item making / enchanting

Open **Make Magic Items** at Mages Guild or Julianos rank 5. Select equipment, powers and side effects. Enchanted items are excluded except crafted jewellery, whose existing enchantments occupy points. Aetheric and Gilded pieces are refused.

Capacity is `base + floor(base * material multiplier)`. Weapon/armor multipliers depend on metal; crafted jewellery can carry recipe-derived points.

Add chosen power costs and negative side-effect costs to find points used. Forced effects attached by a soul are excluded from this point sum. Gold is a different sum: **power points * 10**, including forced powers, excluding drawbacks. Online Enchanting discounts gold by 10% at Journeyman and 20% at Master; Efficient adds 5 percentage points. Discounts round the final charge up.

The 24 types comprise 15 powers and nine drawbacks:

| Powers | Drawbacks |
|---|---|
| Absorbs Spells; Cast When Held; Cast When Strikes; Cast When Used; Enhances Skill; Extra Spell Pts; Feather Weight; Good Rep With; Improves Talents; Increased Weight Allowance; Potent Vs; Regens Health; Repairs Objects; Strengthens Armor; Vampiric Effect | Bad Reactions From; Bad Rep With; Extra Weight; Health Leech; Item Deteriorates; Low Damage Vs; Soul Bound; User Takes Damage; Weakens Armor |

**Cast When Used** activates a spell; **Cast When Held** applies worn magic with durability costs. Skill enhancement is a constant modifier. Strikes and damage-versus effects require weapons. Conflicting settings and duplicate drawbacks are excluded. Plan within ten rows, including forced effects; application has an eleven-row truncation quirk.

> [!example] Example: capacity and price
> Feather Weight costs 100 points. Extra Spell Pts during Winter costs 500. Together they use 600 points and cost 6,000 gold before discounts. Adding Item Deteriorates in holy places contributes -500, reducing used capacity to 100 while leaving the bill at 6,000. You accept the deterioration.

## Spell making

Open **Make Spells** as a Mages Guild member or at Kynareth rank 6. Carry a spellbook, choose effects, name the spell and pay. Three slots offer duration, chance or magnitude where supported. Targets must suit every effect.

For each supported component, gold is `trunc(offset + A * base + B * trunc(increase / per-level))`, with coefficients from that effect's cost table. Magnitude uses averaged minimum/maximum settings. Through skill 100, each effect's spell points are `trunc(effect gold * (110 - school skill) / 400)`. Online above 100, use `trunc(effect gold * 10 * 100 / (skill * 400))`.

Sum effects, multiply both totals by target cost, then truncate: self/touch x1, single ranged x1.5, area around caster x2, area ranged x2.5. Normal casting has a five-point floor; player cost modifiers and free-cast effects can change the result. Chapter pricing also changes the purchase bill online. Check final totals, maximum magicka, target and scaling. The effect editor omits target multipliers and the floor. See [Archery and magic](../hold/archery-and-magic.md).

## Potion making

There are 20 recipes. Guild **Make Potions** uses carried ingredients, including wagon and Materials Bag supplies, and makes one potion per successful mix. Its Recipes picker uses carried recipe items. Unmatched mixtures consume ingredients without producing anything.

Find this service at the Brotherhood or temples of Arkay, Akatosh, Dibella, Mara, Stendarr and Zenithar. Profession **Alchemy** instead uses Stores at an open alchemist's shop or licensed home/hall station.

Profession brewing charges 25 gold per brew plus ingredients. Below Journeyman and at Journeyman a mix yields two potions (the Brewer specialisation makes it three at Journeyman); Master yields three. A potion made entirely from counter-only goods yields one regardless of rank. Potent normally adds 25% magnitude, or duration where magnitude does not apply; Master Alchemist raises that to 40%. Base Potent odds: Expert 10%, Master 20%, plus ingredient, specialization and town bonuses. Cure Disease and Cure Poison cannot become Potent. Consult [Crafting](../feet/crafting.md) and [Professions](../feet/professions.md).

## Soul gems

Soul Trap rolls capture when an affected creature dies; carry an empty trap. Filling prefers Azura's Star. Binding uses a carried soul, consuming an ordinary gem or emptying the reusable Star. Some souls force powers and drawbacks. See [Mages Guild services](../town/mages-guild-services.md).

## Common mistakes

- Spending capacity on one effect before comparing alternatives.
- Ignoring a drawback because its point value is negative.
- Mixing without a recipe or expecting guild mixing to earn profession brewing rewards.

## Next

- [Mages Guild services](../town/mages-guild-services.md)
- [Crafting](../feet/crafting.md)
- [Archery and magic](../hold/archery-and-magic.md)

- [Spellmaking maths](spellmaking-math.md)
- [Magic item economy](magic-item-economy.md)
## Sources

Paths are relative to `upstream/snapshot-e4f093166/`.

- `src/systems/enchanting.js`: `itemEnchantmentPower`, cost sums, `enchantDecision`, `MAX_ENCHANTMENTS`, `applyEnchantments`; `src/ui/item/itemMakerWindow.js`: `itemMakerFilter`.
- `src/systems/enchantmentCatalogue.js`: `ENCHANTMENT_COSTS`, flags, exclusions, picker functions; `src/systems/enchantments.js`: held bundles and constant effects.
- `src/systems/spell/spellMaker.js`: slot limit, target rules, purchase validation; `src/systems/spellcost.js`: `component`, `effectCost`, `skillScaledCost`, `TARGET_COST_MULT`, `calculateCastCost`; `src/ui/spell/spellMakerWindow.js`: `_updateSpellCosts`.
- `src/systems/potionRecipes.js`: `POTION_RECIPES`; `src/systems/potions.js`: mixing and known recipes; `src/ui/potionMakerWindow.js`: `_mix`, `_recipes`.
- `src/net/alchemyLaw.js`: `brewCount`, `POTENT`, `potentEffect`, `potentAble`, enchantment discounts; `src/net/professionLaw.js`: `ALCHEMY_FEE`, rank constants, station rules.
- `src/systems/guild/guildServices.js`: maker access; `guildVariants.js`: `TEMPLE_DATA`; `src/scenes/worldModes.js`: maker doors, chapter pricing and bag inputs.
- `src/systems/mysticism.js`: `attemptSoulTrap`, `fillEmptyTrap`, `enumerateFilledTraps`, `removeFilledTrap`.



