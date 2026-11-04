# Rule interactions: classic Daggerfall tricks, and how DFO treats them

Every number on this page was produced by **DFO Online's own code**. The scenarios are pinned in
`planner/test/scenarios.test.mjs`, and the planner shows each one as you build. Unless a line says
otherwise, the examples use Willpower 50.

## How a saving throw works

Most of these interactions come down to one function, `savingChance` in `src/systems/spellcast.js`
(DFU's `FormulaHelper.SavingThrow`). In order:

1. Start at **50**.
2. **The race** (player only):
   - a racial *resistance* adds +30;
   - a racial *immunity* **sets the throw to 100**;
   - a racial low tolerance −25, a critical weakness −50.
3. **The class**: its tolerances for the spell's flags go into a *set*, then:
   - Immune +50, Critical Weakness −50, Low Tolerance −25, Resistant +25.
   - Each kind counts once, however many flags carry it.
4. **The biography's** resist magic / poison / disease modifier, where it applies.
5. **If the total is 100 or more, the throw always succeeds.** This is checked *before* Willpower and
   before the 95% cap.
6. Otherwise add **Willpower / 10**, then clamp to **5–95**.

Then the dice (`savingThrow`):

- a d100 roll **20 or more below** the chance is a full save;
- a roll at or under the chance but within 20 of it is a **partial** save, so 100 − 5 × (chance − roll)
  per cent still lands;
- any higher roll: the effect lands in full.

That matters because **paralysis, poison and disease only stop on a full save**. Your real chance to
avoid them is about **20 points lower** than the "saving throw" figure. A damage spell is scaled by
the result instead.

On top of the throw, two **hard immunity gates** run *before* it: paralysis and disease
(`isEntityImmuneToParalysis` / `isEntityImmuneToDisease` in `src/systems/effects.js`). Each gate
passes for:

- a class Immunity;
- a racial immunity, **unless the class has Low Tolerance or Critical Weakness to the same thing**.

Poison has a gate too, but only the class's Immunity opens it (`src/systems/poisons.js`).

## The High Elf question

> *High Elves are immune to paralysis. In classic Daggerfall you could give the class Critical Weakness
> to Paralysis, collect its difficulty points, and the racial immunity still won. Does that still work?*

**No. DFO doesn't take the immunity over the weakness: the weakness switches the immunity off.**
Daggerfall Unity closed this deliberately; its source says "Player entity is hard immune from racial
template unless they have an overriding career weakness". DFO ports that line exactly.

The weakness doesn't leave you *worse* than average, though, because the racial immunity still sets
the throw to 100 before the class's penalty comes off:

| High Elf with... | Difficulty | Hard immune? | Saving throw | Stops paralysis | An ordinary race with the same pick |
|---|---|---|---|---|---|
| nothing | 0 | **yes** | - | **100%** | 35% (throw 55) |
| Low Tolerance to Paralysis | **−5** | no | 80 | 60% | 10% (throw 30) |
| Critical Weakness to Paralysis | **−14** | no | 55 | 35% | 0% (throw 5) |
| Resistance to Paralysis | +5 | yes | - | 100% | 60% (throw 80) |

So in DFO:

- **Critical Weakness to Paralysis on a High Elf is −14 difficulty for free *relative to an average
  race*.** You end up exactly as resistant as a Redguard with no flags (stops 35%), and your skills rise
  faster. You give up the immunity, which is the whole High Elf trait, so it's a trade, not an
  exploit. It's still the best value of any disadvantage for that race.
- **Low Tolerance** costs the immunity for only −5 points. It's the worse deal of the two.
- **Resistance or Immunity to Paralysis on a High Elf buys nothing**: it costs difficulty (slower
  skills) and changes no number.

The planner shows this as you pick, and its Resistances panel shows each step of the throw.

## Interactions the code reveals (not in classic lore)

### Breton + Resistance to Magic = immune to every paralysis spell (and every Magic-element spell)

Every classic paralysis spell (Paralysis, Spider Touch, Medusa's Gaze, Wizard Rend, Force Bolt) is
**Magic-element**, and its throw is read with the Paralysis *and* Magic flags. A Breton's +30 counts
against it. Add a class Resistance to Magic or to Paralysis (+25):

- 50 + 30 + 25 = **105**, which is at least 100, so the throw always succeeds.
- That covers every Magic-element spell's throw too, so Magic-element damage spells land nothing.
- It costs **5 points** where an Immunity costs 10, and one Resistance covers paralysis *and* magic.

This needs no immunity flag anywhere. It's DFU's arithmetic, kept unchanged.

### Nord + Resistance to Frost = immune to frost spells

The same arithmetic: 50 + 30 + 25 = 105.

### Two class tolerances on one spell count once

Resistance to Paralysis and Resistance to Magic both match a paralysis spell, but the class fold is a
*set*: you get +25 once, not +50. Buying both for paralysis is wasted points.

### Biography resist modifiers overwrite each other

Two answers that both give "resist magic" don't add up: the later question's value replaces the
earlier one.

### Inability to Regenerate Spell Points is nearly free online

Offline it's Daggerfall's full penalty: no magicka back from rest. **Online, DFO lets rest restore
magicka for every class** (REST-MANA1, `src/systems/rest.js` `restIgnoresNoRegen`). The disadvantage
still pays its full **−14** difficulty.

### Spell Absorption is weaker than it reads

- Only **Destruction** spells are absorbed.
- Only when your magicka has **room** for the spell's cost: at full magicka nothing is absorbed.
- DFO **halves** the magicka returned (ABSORB-NERF, 2026-09-30).

The class version still absorbs every time it applies (`src/systems/absorption.js`).

### "Bonus to Hit" adds damage, and the overhaul ties it to Willpower

- **Under DFU rules**: +your level in **damage** against that enemy group; Phobia takes off your level.
- **Under DFO's default combat overhaul**: each blow adds a random 0 to (10 + (WIL−50)/5 − half the
  foe's level). Phobia subtracts (half the foe's level − (WIL−50)/5).

A high-Willpower character gets much more from the advantage (`src/combat/pcaao.js`
`pcaaoBonusOrPenaltyByEnemyType`).

### Expertise is attribute-based, not level-based, under the overhaul

| | Long Blade expertise (example) |
|---|---|
| DFU | +level to hit, +(level/3 + 1) damage |
| Overhaul (default) | AGI/8 + SPD/20 + LUC/20 to hit; AGI/20 + STR/33 + 1 damage |

The overhaul is stronger early and doesn't grow with level. DFU also applies Hand-to-Hand expertise,
which classic did not; DFO keeps that.

### Racial weapon bonuses were rewritten by the overhaul

- **Dark Elves** used to get +level/4 with *every* weapon. Under the overhaul they get bonuses only with
  long and short blades.
- **Redguards** lose the bonus with short blades.
- **Bretons and High Elves** have none either way.
- **Khajiit and Nords** get bare-hand bonuses.

See the table in [02-character-creation.md](02-character-creation.md).

### Your starting kit's quality reads the class's Luck, not yours, and has a cliff at 56

Roleplay & Realism's skill-based kit upgrades iron/leather to steel/chain with a chance read from the
**class's base Luck**, not your rolled Luck:

- below 56 the chance is *half* the Luck;
- from 56 up it's the *whole* Luck.

Every standard class has base Luck 44–51, so every standard class gets a 22–25% chance. A custom class
gets 27% at Luck 55 and **56% at Luck 56**. One attribute point in the builder doubles the chance of a
steel-and-chain start.

### Level 1 is safe from poison and disease

Both `inflictPoison` and `inflictDisease` refuse a level-1 target, a quirk kept from Daggerfall.

### The first level-up comes after two skill points

Level = floor((gained + 28) / 15). Two points in the leveling skills give level 2; after that, one level
every 15. Biography bonuses are counted into the starting sum, so they don't give a free level.

## Things this page has *not* verified

- Vampirism and lycanthropy change the race template (`GetLiveRaceTemplate`). Their immunities are
  outside the planner for now.
- Spell-effect resistances (a cast Resist Fire), enchanted resistances and sigil-set powers all add to
  the throw in play. The planner shows a fresh character, without them.
- DFO changes quickly. Re-run `node --test "planner/test/*.test.mjs"` after pulling DFO: if one of these
  answers changes, a test will fail and name it.
