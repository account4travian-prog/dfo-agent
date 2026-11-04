---
title: Spellmaking maths
summary: How a made spell is priced, cast and why it fails, with worked examples and the online skill rule.
stage: gear
order: 27
gate: none
tags: [spellmaking, magic, spell points, formulas, mages guild]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - A made spell holds up to **three effects**; each is priced from its duration, chance and magnitude components, then the whole sum is multiplied by the target type.
> - Your school skill lowers the spell-point cost; online above 100 the cost keeps falling by `100 / skill` and never reaches zero.
> - Every cast costs at least **5 spell points**, and a spell flagged minimum-cost costs exactly 5 however expensive its effects are.
> - The maker charges gold to buy the spell and shows the spell points to cast it; the editor's per-effect label shows neither the target multiplier nor the floor.
> - Range is CasterOnly, ByTouch (3.0 m), single target, area around caster or area at range (4.0 m explosion); a ranged missile flies at 25 units/s for up to 8 s.

## The two prices

A made spell has two different prices, and mixing them up is the usual mistake.

- **Gold** is what the maker charges to inscribe the spell. It is the same component sum as the cast price, before the school-skill term.
- **Spell points** are what a cast costs. They are the per-effect gold priced again through your magic-school skill, summed, multiplied by the target type, then floored.

The spell-point pool itself is `floor(Intelligence × your class's spell-point multiplier)`. The multiplier is a creation choice (Increased Magery raises it); Intelligence raises the pool but does not directly cheapen a spell.

## One effect's cost

For each supported component of an effect:

`component gold = trunc(offset + A × starting + B × trunc(increase / perLevel))`

The coefficients `A`, `B` and `offset`, and which of duration, chance and magnitude an effect supports, come from the effect's row in `EFFECT_COST_TABLE`. Some examples:

| Effect | Components | Cost row (A, B) |
|---|---|---|
| Damage Health | magnitude | 20, 28 |
| Heal Health | magnitude | 20, 28 |
| Heal Fatigue | magnitude | 8, 28 |
| Continuous Damage Health | duration, magnitude | 28,8 and 40,28 |
| Paralyze | duration, chance | 28,100 each |
| Soul Trap | duration, chance | 60,68 and 40,68 |
| Shield | duration, magnitude | 28,8 and 80,60 |
| Teleport, Morph Self | none — the fudge `60, 100, offset 160` | |

Magnitude uses the **averaged** spinner pair: `base = trunc((baseMin + baseMax) / 2)` and `plus = trunc((plusMin + plusMax) / 2)`. The per-level spinner divides the "increase" part, so level scaling is charged in steps rather than smoothly.

Then the effect's spell points are `trunc(gold × (110 − school skill) / 400)`. **Online**, once the school is past 100, the term becomes `trunc(gold × 10 × 100 / (skill × 400))` — at 200 the spell costs half its at-100 price, never nothing. Offline and to 100, the classic term stands.

The maker's spinner ranges: duration base and modifier 1–60, per level 1–20; chance base and modifier 1–100, per level 1–20; magnitude base low/high 1–100 and level bases 1–100, per level 1–20. A fresh effect starts every spinner at 1.

## Target, area and range

| Target type | Multiplier | What it means |
|---|---:|---|
| CasterOnly | ×1.0 | The caster |
| ByTouch | ×1.0 | A target within 3.0 m |
| SingleTargetAtRange | ×1.5 | One target at range |
| AreaAroundCaster | ×2.0 | A 4.0 m explosion centred on you |
| AreaAtRange | ×2.5 | A 4.0 m explosion at the target |

Sum the effects, multiply both the gold and the spell-point totals by the target multiplier, truncate each. Then apply the floor: no cast under **5** spell points. A spell record flagged `minimumCastingCost` (vampire clan spells, the lycanthrope morph) costs exactly 5, even if its effects price higher.

Only target and element combinations that every effect allows are offered: targets are intersected and elements are unioned, and Magic is always allowed. An effect that can only target the self forces the self target.

## What a cast does

The spell leaves your hands 0.2 s after the cast starts and the next cast waits 0.7 s from that start; both scale with cast rate. Cast rate is 1 at Speed 50, +25% at Speed 100, −25% at Speed 0, plus cast-speed gear, clamped 0.5–2.

A ranged spell's missile flies at 25 units/s and lives at most 8 s, so movement can make it miss. Whether an effect lands is a saving throw weighing the target's resistances, tolerances and `floor(Willpower / 10)` magic resist. Magnitude is `base + plus × floor(caster level / perLevel)`.

## Worked examples

**A ranged fire bolt.** Damage Health, magnitude base 10 (low and high both 10), level part 1, target SingleTargetAtRange. Component = `20 × 10 + 28 × 1 = 228` gold. At Destruction 50 the effect's spell points are `trunc(228 × 60 / 400) = 34`; ×1.5 = **51 spell points**, gold 342. At Destruction 100: `trunc(228 × 10 / 400) = 5`; ×1.5 = 7 → **7 spell points**. At Destruction 150 online: `trunc(228 × 10 × 100 / (150 × 400)) = 3`; ×1.5 = 4 → floored to **5**.

**A cheap self heal.** Heal Fatigue, magnitude 20, target CasterOnly. Component = `8 × 20 + 28 × 1 = 188` gold. At Restoration 50: `trunc(188 × 60 / 400) = 28` → **28 spell points**; at Restoration 100: `trunc(188 × 10 / 400) = 4` → floored to **5**.

These are illustrative builds using the source's rows, not fixed recipes.

## Where the maker is, and the purchase ladder

Making spells is a guild service: Mages Guild members can open **Make Spells**, and the service tables gate it by membership. Carrying a **spellbook** item is the first check. The purchase ladder then runs in this order: a spellbook is held, at least one effect is chosen, the gold (coins plus letters of credit) covers the price, and a name is entered. The name is checked last, so an unnamed spell with no gold complains about gold first.

A bought spell is pushed straight onto the spellbook and the maker resets for the next one. The maker's live totals call the same `calculateCastCost` as the cast, so the gold and spell-point figures it shows are the real ones — except the per-effect editor label, which deliberately omits the target multiplier and the five-point floor.

## Failure modes

- **No spellbook.** Refused before anything else (record 1703).
- **No effect.** Refused; an empty spell is never bought.
- **No gold.** Checked before the item's limits; the maker tells you it is gold, not capacity.
- **No name.** Checked last.
- **Too many effects.** The record holds three; a fourth is not carried into the built spell.
- **A target no effect allows.** The maker restricts the buttons rather than letting you buy an impossible spell.
- **Spell Absorption over 50.** A made Spell Absorption effect is capped at a 50% base chance.
- **Expecting the editor label to match the bill.** The single-effect label has no target multiplier and no floor.
- **A spell you cannot cast.** The floor is 5, but a costly spell can still exceed your pool; the spell points shown are the real cast price.

## Item maker versus spell maker

The **spell maker** creates spells: gold to inscribe, spell points to cast. The **item maker** spends an item's enchantment points and charges gold per power point; it does not use your school skills or spell points. See [Magic item economy](magic-item-economy.md) and the overview of both services in [Enchanting, spellmaking and potions](enchanting-spellmaking-potions.md).

## Common mistakes

- **Pricing an area spell as a single-target one.** The multiplier applies to the whole sum, both gold and spell points.
- **Buying a spell your pool cannot cast.** The purchase does not check your maximum spell points.
- **Assuming skill 110 makes spells free.** Online, past 100 the price falls but never below the 5-point floor.
- **Ignoring cast rate.** Speed and cast-speed gear change how often the spell leaves your hands, not its price.
- **Forgetting the spellbook.** The maker will not open the purchase without it.

## Next

- [Archery and magic](../hold/archery-and-magic.md)
- [Magic item economy](magic-item-economy.md)

## Sources

- `src/systems/spellcost.js`: `EFFECT_COST_TABLE`, `effectCost`, `component`, `skillScaledCost`, `CAST_COST_FLOOR`, `TARGET_COST_MULT`, `calculateCastCost`, `SPELL_COST_SKILL_REFERENCE`
- `src/systems/spell/spellMaker.js`: `MAX_EFFECTS_PER_SPELL`, `SPINNER_RANGES`, `blankEffectSettings`, `spellMakerCost`, `validateSpellPurchase`, `purchaseSpell`, `hasSpellbook`, `TARGET_FLAGS`, `ELEMENT_FLAGS`, `SPELL_ABSORPTION_CHANCE_BASE_MAX`
- `src/systems/spellcast.js`: `TARGET_TYPES`, `TOUCH_RANGE`, `EXPLOSION_RADIUS`, `MISSILE_SPEED`, `MISSILE_LIFESPAN_S`, `savingChance`, `rollMagnitude`
- `src/combat/fpsSpellCasting.js`: `RELEASE_FRAME`, `CAST_FRAME_PERIOD`, `CAST_RECOVER_S`; `src/systems/castSpeed.js`: `castRate`
- `src/combat/formulas.js`: `spellPointsFor`; `src/systems/chargen.js`: `SPELL_POINT_MULTIPLIERS`
- `src/systems/guild/guildServices.js`: `MakeSpells` access; `src/systems/enchanting.js` and `src/systems/enchantmentCatalogue.js`: item-maker costs
- Research note `handbook/research/H2.md`; overview page `handbook/content/gear/enchanting-spellmaking-potions.md`
