---
title: Custom classes
summary: Design your own class from skills, health, attributes, advantages and disadvantages; the stronger it is, the more slowly it levels.
stage: creation
order: 40
gate: none
tags: [custom class, advantages, disadvantages, difficulty dagger, advancement]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Pick **3 primary, 3 major and 6 minor** skills, your **health per level** (4 to 30), and your attributes.
> - Add up to **seven advantages and seven disadvantages**. Advantages make the class stronger; disadvantages make
>   it weaker.
> - The **difficulty dagger** shows the total. A stronger class needs more skill uses per improvement, so it levels
>   more slowly. The game refuses a class outside its difficulty limits.
> - Disadvantages you will never notice (a forbidden material you'd never wear, say) are free strength. Ones you will
>   notice every day are real costs.

## The parts of a custom class

| Part | Choice |
|---|---|
| Skills | 3 primary, 3 major, 6 minor; a skill can sit in only one tier |
| Health per level | 4 to 30, default 8 |
| Attributes | each starts at 50; move points between them, each staying within 10 to 75 |
| Advantages | up to seven |
| Disadvantages | up to seven |
| Name | your choice |

Attributes on the custom screen are a zero-sum budget: raising one lowers the pool, and the pool must balance before
you continue.

## The difficulty dagger

Every choice adds or subtracts **difficulty points**:

- Health per level: **+1** for each point above 8, **−2** for each point below 8.
- Each advantage adds its cost; each disadvantage subtracts its cost (tables below).

The total must be between **−12** and **+40**. It sets your **advancement multiplier**:

> advancement multiplier = 0.3 + 2.7 × (difficulty points + 12) ÷ 52

So a class at −12 has a multiplier of 0.3 (fast levelling), a class at the default 0 has about 0.92, and a class at +40
has 3.0 (slow levelling). Every skill improvement needs a number of uses proportional to this multiplier.

> [!example] Example
> Health 12 per level (+4), Resistance to Fire (+5), Forbidden Material: Steel (−10): 4 + 5 − 10 = −1 point, a
> multiplier of about 0.87. The class is a little sturdier and still levels slightly faster than the default, at the
> price of never using steel.

## Advantages

| Advantage | Choice | Cost |
|---|---|---|
| Acute Hearing | | +1 |
| Adrenaline Rush | | +4 |
| Athleticism | | +4 |
| Bonus to Hit | Animals / Daedra / Humanoids / Undead | +6 / +3 / +6 / +6 |
| Expertise In | a weapon group | +2 |
| Immunity | Disease, Fire, Frost, Magic, Paralysis, Poison or Shock | +10 |
| Increased Magery | spell points of 1×, 1.5×, 1.75×, 2× or 3× Intelligence | +2 / +4 / +6 / +8 / +10 |
| Rapid Healing | General / in darkness / in light | +4 / +3 / +2 |
| Regenerate Health | General / in darkness / in light / while immersed | +14 / +10 / +6 / +2 |
| Resistance | Disease, Fire, Frost, Magic, Paralysis, Poison or Shock | +5 |
| Spell Absorption | General / in darkness / in light | +14 / +12 / +8 |

What some of them do:

- **Acute Hearing**: you hear enemies from farther away (1.25 times the distance).
- **Adrenaline Rush**: +{{fact pcaao.adrenalineRushBonus}} to hit while your health is below one part in {{fact pcaao.adrenalineRushThresholdDivisor}} of your maximum (and enemies with it are harder to hit then).
- **Athleticism**: jump speed +10%.
- **Expertise In**: bonus damage and accuracy with that weapon group, worked out from your attributes. With 50 in
  every attribute it is about +4 to +5 damage and +10 to +11 to hit, depending on the weapon. It works for
  Hand-to-Hand too.

> [!online] Online rule
> Online, Adrenaline Rush and Expertise In use the Physical Combat and Armor Overhaul's versions, which DFO forces on.
> Single-player Daggerfall Unity's versions differ (Expertise there grows with your level instead of your attributes).
- **Resistance / Immunity**: see the saving-throw table in [Choosing a race](races.md#how-much-the-racial-effects-matter).
  A class immunity adds 50 points to the save; a class resistance adds 25.
- **Increased Magery**: raises your spell points above the custom default of half your Intelligence. Only one magery
  choice is allowed.

## Disadvantages

| Disadvantage | Choice | Cost |
|---|---|---|
| Critical Weakness | an effect | −14 |
| Damage | from holy places / from sunlight | −6 / −10 |
| Darkness-Powered Magery | lower magic in daylight / no magic in daylight | −7 / −10 |
| Forbidden Armour Type | leather / chain / plate | −1 / −2 / −5 |
| Forbidden Material | Iron −1, Daedric −2, Orcish −3, Adamantium −5, Ebony −5, Mithril −6, Silver −6, Dwarven −7, Elven −9, Steel −10 | as listed |
| Forbidden Shield Types | shield types | −1 |
| Forbidden Weaponry | a weapon group | −2 |
| Inability to Regen Spell Points | | −14 |
| Light-Powered Magery | lower magic in darkness / no magic in darkness | −10 / −14 |
| Low Tolerance | an effect | −5 |
| Phobia | Animals, Daedra, Humanoids or Undead | −4 |

> [!online] Online rule: Inability to Regen Spell Points
> Offline, this stops resting from restoring spell points. **Online, resting restores spell points for every class,
> including this one**, so for an online character it is worth −14 points with a much smaller drawback than its name
> suggests.

Some picks block each other: you can't take the same choice twice, Bonus to Hit and Phobia against the same enemy
group, Expertise In and Forbidden Weaponry for the same weapon, or an immunity and a resistance to the same effect.

## Spells for custom classes

A custom class starts with spell points equal to **half its Intelligence**, raised by Increased Magery. If any magic
school is among its primary or major skills, it starts with the Spellsword's starting spells; otherwise it starts with
none.

## Designing well

- **Take disadvantages you won't feel.** A fighter who will wear leather and steel loses nothing by forbidding
  Daedric weapons it may never find; forbidding Steel, the most common good metal, is a real cost early on.
- **Check late consequences.** Forbidden materials also rule out reward gear made of them later, such as seasonal
  event sets. Read a reward's material before you buy it.
- **Don't max difficulty for its own sake.** A very strong class that levels at 3× takes far longer to reach the
  levels where the game's introduction questlines open.
- **Match your tiers to how you'll play.** Your level rises from your primary and major skills (and your best minor),
  so put the skills you'll use constantly there.

## Next

- [Attributes and skills](attributes-and-skills.md)
- [Classes](classes.md)

## Sources

- `src/systems/customClass.js`: `HP_MIN`, `HP_MAX`, `HP_DEFAULT`, `DIFFICULTY_MIN`, `DIFFICULTY_MAX`,
  `difficultyPoints`, `advancementMultiplier`, `FREE_EDIT_MIN`, `FREE_EDIT_MAX`, `STAT_DEFAULT`, `buildCustomCareer`,
  `customSpellSetIndex`
- `src/systems/specialAdvantages.js`: `DIFFICULTY` (every cost), `advDisAdjustment`, `ONLY_ONE_KEYS`, `MAX_ITEMS`,
  `cannotAdd`, `DEFAULT_MAGERY_BITS`
- `src/ui/chargen.js`: `_advList` and `advAdd` (seven per list), `customDifficulty`, the −12..40 gate, the zero-sum
  attribute pool (`customSpendStat`)
- `src/combat/pcaao.js` (forced on online): `pcaaoAdrenalineRushToHit` (below a sixth, +8 / +12 improved),
  `pcaaoProficiencyModifiers` (stat-driven expertise per weapon skill); offline equivalents in `src/combat/formulas.js`
- `src/characters/enemy/enemySounds.js`: `acuteHearingMultiplier`;
  `src/systems/skills.js`: `jumpSpeedMultiplier`
- `src/systems/rest/rest.js`: `spellPointRecoveryRate` (online rest restores spell points for every career)
- `src/systems/spellcast.js`: `savingChance`
- Research note: `handbook/research/C2.md`
