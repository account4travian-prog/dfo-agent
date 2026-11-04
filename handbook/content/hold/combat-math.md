---
title: Combat maths
summary: The online hit, damage and armour formulas behind one swing, with a checklist for why blows miss.
stage: hold
order: 32
gate: none
tags: [combat, formulas, pcaao, hit chance, armour, tells]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - Online, the room forces **PCAAO** on, so the hit roll, damage, body parts and armour are PCAAO's, not the classic formulas.
> - A hit starts at **ceil(weapon skill × 1.5)**; the attacker's Dodging target subtracts **half** its skill, and the roll is clamped to **3–97**.
> - Armour does not make blows miss: it reduces the damage of a blow that lands, by a row chosen from the armour's material and the blow's kind.
> - The target's **Dodging**, your **material** and your **Strength** move the numbers; direction, Expertise and racial bonuses apply to player attackers only.
> - Telegraphed blows are positional: step out of the shape, then punish the **Open** foe for +30% damage.

## The maths that runs online

Read this first. `ONLINE_ROOM_MOD_KEYS` forces PCAAO on for every player in the room, and PCAAO's `pcaaoAttackDamage` is registered over the classic `calculateAttackDamage`. Everything below is the online rule; where the classic `formulas.js` core still differs, the difference is named. Enhanced AI is a forced online preference, so telegraphed blows are always on.

## The hit roll

| Step | What it does |
|---|---|
| Base | `ceil(weapon skill × 1.5)` for every attacker, player or foe (classic used the skill alone). |
| Material | The weapon's material modifier × 2 + 2: +0 to +14 across the ladder, not the classic × 10. |
| Target Dodging | Subtract `trunc(Dodging / 2)` (classic subtracted / 4). |
| Stat difference | `trunc((your Luck − target Luck)/10) + trunc((Agility difference)/4) + trunc((Speed difference)/8) − round_half_even((target Luck − 50)/10)`. |
| Adjustments | A player target subtracts its biography avoid-hit modifier; a monster target adds +50 and then every target takes −50 (a monster nets zero). |
| Clamp and roll | The total is clamped to **3–97**, then a d100 is rolled under it. |

A player attacker adds four more terms; a foe gets none of them: the swing's direction modifier, **Expertise**, the **racial** weapon bonus, and the **backstab** chance. That is why a foe's skill is its whole accuracy while yours is not.

Two skills then bend the roll. **Critical Strike**: luck term `floor((Luck − 50)/25)`; a d100 at or under `trunc(Critical Strike / (4 − luck term))` adds `trunc(Critical Strike / 4)` to hit and multiplies the blow's damage by `1 + trunc(Critical Strike / 5) × 0.05`. **Adrenaline Rush** (career ability): under `trunc(max Health / 6)`, +8 to hit, or +12 with Improved Adrenaline Rush; a rushing target subtracts the same.

## Body part, armour and shields

A landed blow rolls a body part from PCAAO's 20-entry table: Head 1/20, Right Arm 3, Left Arm 3, Chest 4, Hands 3, Legs 4, Feet 2.

Armour's part in the **hit roll** is small. A player target reads `100 − enchant armour modifier − armour points on the struck part`; a class-enemy target reads a flat 60; a monster keeps its own per-part armour value. Armour's real work happens after the hit:

`damage taken = round_half_even(damage × (min(base × condition factor, cap) − natural resistance))`

The `[base, cap]` row is chosen by the struck piece's material index (1–10) and the blow kind: unarmed, blunt or edged. Natural resistance is `(Endurance − 50) × 0.002 + (Strength − 50) × 0.001 + (Willpower − 50) × 0.001`. On a bare part it is the whole reduction: `damage × (1 − natural resistance)`.

Condition matters. A weapon at 41–60% condition deals ×0.85 (blunt ×0.9); at 6–15% it deals ×0.45 (blunt ×0.65); at 5% or under ×0.25 (blunt ×0.5). Worn armour worsens its reduction factor on the same ladder (×1.1 to ×1.5).

**Shields** are a defender-side block roll on every blow that lands, not a button. Base chance by kind, with a strong spot (a covered part) and a weak spot: Buckler 30/20, Round 35/10, Kite 45/5, Tower 55/−5, anything else in the hand 40/0, plus stat terms. A block counts only if the shield's average reduction beats the armour under it; then the blow runs through the shield's own, stronger row. The Shield Widget only draws the shield.

## Damage

Online damage spans come from Roleplay & Realism's `weaponBalance`, not the classic tables: Longsword 2–15, Claymore 2–19, Dai-Katana 1–18, Warhammer 4–18, Shortsword 2–8. Archery keeps the classic spans: Short Bow 4–16, Long Bow 4–18. Bare hands stay skill-based: min `floor(HandToHand / 10) + 1`, max `floor(HandToHand / 5) + 1`.

On top of the span:

- **Strength**: `floor((Strength − 50) / 10)` added once, doubled for a two-handed weapon that is not a bow (classic used / 5).
- **Material shortfall**: a weapon under the metal a foe needs is multiplied by `1 − min(shortfall × 0.2, 0.9)` — ×0.8, 0.6, 0.4, 0.2, then 0.1 — and the game says when a blow falls to 45% or less. The zero-damage refusal is the module-off path.
- **Silver**: doubles against the Skeletal Warrior and six careers (Werewolf, Ghost, Wraith, Vampire, Mummy, Wereboar); a non-edged weapon is halved against the Skeletal Warrior.
- **Expertise and race** add stat-based damage terms, for player attackers only.

Fatigue is part of the maths. A melee swing spends **8 fatigue** when it reaches its hit frame, hit or miss. Running out while enemies are near costs 10% of your health and warns you; a Restore Fatigue potion is the in-fight answer.

## Swing pace

A melee strike is five frames and damage lands on frame two. The frame time is `SWING_BASE_FRAME` × tempo × handling: base ≈0.199 s at Speed 50, tempo ×1.4 at Speed 0 and ×0.6 at Speed 100, handling 0.9 for daggers/bare hands, 1.0 long blades, up to 1.06 for a warhammer, ×1.06 for two-handed, ×0.9 for anything swinging with Short Blade.

Online, RRI's `weaponBalance` replaces the heft term for a held weapon: the Speed used is `live Speed − min(live Speed, 98) × ((150 − Strength)% × base weight × 3.4) / 90`, truncated. Heavier weapon, weaker arm, slower swing. Bare hands read live Speed plainly.

## Tells, Open and poise

Only tier foes telegraph: level 10 or higher, an elite, a champion or a revenant, and only kinds with shapes (class casters throw none). A missed shape leaves the foe **Open**: +30% damage taken for its shape's window (lunge 1.0 s, sweep 0.8, slam 1.2, ring 1.0, charge 1.4, leap 1.2), and a perfect dodge — inside the shape 0.25 s before landing, outside at the landing — lengthens that window 1.5×.

Hits during a wind-up fill poise instead of shoving. At full poise the wind-up breaks: the foe is helpless for 0.8–1.4 s by weight class and takes +25% damage, then cannot be staggered again for 3 s. Iron blows have no poise meter and cannot be broken.

## Why am I missing: a 60-second checklist

1. **Range and line**: is the foe's centre within 2.5 m of your eye, in view, with a clear line?
2. **Material**: is your weapon under the foe's required metal? Damage drops; against some foes it is the whole problem.
3. **Dodging**: a dodging target takes half its skill off your chance.
4. **Body part**: are your blows landing on a heavily armoured part?
5. **Material to-hit**: a low-metal weapon is missing accuracy as well as damage.
6. **Fatigue**: are you exhausted? The health loss and the miss look alike in a crowd.
7. **Swing mode**: is the attack bound, and is Click-or-Hold or Gesture the mode you think?
8. **The foe**: level 10+, elite or champion means tells and poise; if you are standing in the shape, you are choosing to be hit.

## Common mistakes

- **Expecting armour to make you hard to hit.** It reduces damage after the hit; Dodging moves the hit roll.
- **Reading classic tables.** Skill, material, Strength and Dodging all run on PCAAO's versions online.
- **Ignoring condition.** A worn weapon loses up to three quarters of its damage.
- **Treating the shield as passive armour.** It rolls a block; if it loses the comparison with your armour, it does nothing.
- **Standing in the shape to trade.** Step out, then hit the Open foe.

## Next

- [Fighting](fighting.md)
- [Weapon techniques](weapon-techniques.md)

## Sources

- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS`, `ONLINE_WHOLE_MODS` (PCAAO and Enhanced AI forced online)
- `src/combat/pcaao.js`: `pcaaoAttackDamage`, `pcaaoSuccessfulHit`, `pcaaoSkillsToHit`, `pcaaoStatDiffsToHit`, `pcaaoAdjustmentsToHit`, `pcaaoCriticalStrike`, `pcaaoAdrenalineRushToHit`, `pcaaoWeaponToHit`, `pcaaoDamageModifier`, `pcaaoPercentageReductionCalculationWithUnarmed`, `PCAAO_BODY_PARTS`, `PCAAO_REDUCTION_ROWS`, `pcaaoAlterDamageBasedOnWepCondition`, `pcaaoAlterArmorReducBasedOnItemCondition`, `pcaaoShieldBlockChanceCalculation`, `pcaaoCompareShieldToUnderArmor`, `pcaaoProficiencyModifiers`, `pcaaoRacialModifiers`
- `src/combat/formulas.js`: the classic core `calculateAttackDamage` and `backstabDamage`; `src/combat/pcaao.js`: `pcaaoBackstabDamage`
- `src/characters/weaponStates.js`: `MELEE_NUM_FRAMES`, `HIT_FRAME_MELEE`, `SWING_BASE_FRAME`, `swingTempo`, `SWING_HANDLING`, `SWING_TWO_HANDED`, `SWING_SHORT_BLADE`
- `src/systems/roleplayRealismItems/rriRealism.js`: `RRI_WEAPON_MIN_DAMAGE`, `RRI_WEAPON_MAX_DAMAGE`, `rriMeleeWeaponAnimTime`
- `src/ai/tells.js`, `src/ai/blowShapes.js`, `src/ai/foeBlows.js`: `TELL`, `BLOW`, `blowTier`, `inBlow`, `punishSeconds`, `staggerSeconds`, `poiseOf`
- `src/scenes/hostCombat.js`: `SWING_WEAPON_FATIGUE_LOSS`, `SWING_FATIGUE_COST`; `src/systems/statMods.js`: `FATIGUE_DRAIN_SCALE`
- `src/systems/online/onlineLane.js`: Enhanced AI online preference; `src/systems/features.js`: `enhancedAI`
- `docs/33-fighting.md` (the player-facing combat summary); research note `handbook/research/H2.md`
