# Character creation in DFO Online

How DFO makes a character, step by step, with the numbers. Each rule names the file it lives in
(inside `upstream/daggerfall-js-source/`). The planner (`planner/`) restates these rules, and
`planner/test/parity.test.mjs` checks them against these files.

The steps run in DFU's wizard order (`src/ui/chargen.js` `STATES`):
**race → sex → class → biography → name → face → attributes → skills → reflexes → summary.**
Since DFO 2026-09-17, a new character is also asked which **leveling system** to use (classic or
Oblivion-like), and online, which **lineage model** (Enduring, Bloodline or none).

## 1. Race

A race changes **no attributes and no skills**. That's Daggerfall's rule, kept unchanged. What it does
change:

| Race | Tolerance (`src/systems/races.js`) | Weapon bonus, DFO default (overhaul) | Weapon bonus, DFU rules | Body warmth (Climates & Calories) |
|---|---|---|---|---|
| Breton | Resists Magic (+30 to the saving throw) | none | none | +5° |
| Redguard | - | long blades, blunt, axes, bows (by STR/AGI/SPD/LUC) | all but bows, +level/3 | -5° |
| Nord | Resists Frost (+30) | axes, blunt, bare-hand damage | none | +5° |
| Dark Elf | - | long and short blades | all weapons, +level/4 | -5° |
| High Elf | **Immune to Paralysis** (sets the throw to 100, and a hard immunity gate) | none | none | 0° |
| Wood Elf | - | short blades, bows | bows, +level/3 | 0° |
| Khajiit | - | short blades, bare hands | none | -5° |
| Argonian | - | short blades | none | -10° |

- The overhaul's bonuses are in `src/combat/pcaao.js` `pcaaoRacialModifiers`; DFU's are in
  `src/combat/formulas.js` `racialModifiers`.
- In Climates & Calories, race tolerances also resist the *weather*: a Nord's Frost resistance takes 25°
  off the cold (`src/systems/survival/temperature.js` `resistTemperature`).

Sex changes appearance and starting clothes only.

## 2. Class

Pick one of the 18 standard classes (`CLASS00..17.CFG` in ARENA2), answer the class questions, or build
a **custom class**. A class sets:

- base values for the eight attributes;
- 3 primary, 3 major and 6 minor skills;
- hit points per level;
- special advantages and disadvantages;
- an **advancement multiplier**. Every skill raise costs this many times the uses, so lower is faster.
  It runs from Barbarian x0.64 to Mage/Sorcerer x1.04.

### The custom-class builder (`src/systems/customClass.js`, `src/ui/chargen.js` `customExit`)

- Attributes start at 50 each. Each must stay between **10 and 75**, and the eight together must be
  exactly **400**.
- Hit points per level: **4 to 30**.
- **Difficulty points**: +1 per HP above 8 (−2 per HP below 8), plus every advantage's cost, minus every
  disadvantage's value. The class must land between **−12 and +40**.
- **Advancement multiplier** = 0.3 + 2.7 × (points + 12) / 52. That's x0.30 at −12 and x3.00 at +40.
- Up to **7 advantages and 7 disadvantages**. Only one of each of Increased Magery, Darkness-Powered
  and Light-Powered Magery.
- These pairs may not share an option, across both lists:
  - Bonus to Hit / Phobia;
  - Expertise / Forbidden Weaponry;
  - any two of Immunity, Resistance, Low Tolerance and Critical Weakness.
- The game refuses to continue until:
  - the class has a name;
  - all 12 skills are chosen;
  - the attributes total 400;
  - the difficulty is in range;
  - the five reputation sliders balance to exactly 0.
- **DFO adds Export and Import**: a class can be saved as a file (`daggerfall-enhanced/custom-class`,
  version 1) and loaded again. The planner writes this format, and its tests check that DFO's own
  importer accepts every exported class without changes.

Costs (`src/systems/specialAdvantages.js` `DIFFICULTY`):

| Advantage | Cost | Disadvantage | Value |
|---|---|---|---|
| Acute Hearing | +1 | Critical Weakness (any) | −14 |
| Adrenaline Rush | +4 | Damage from Holy Places / Sunlight | −6 / −10 |
| Athleticism | +4 | Darkness-Powered Magery: lower / unable | −7 / −10 |
| Bonus to Hit: Daedra / Animals, Humanoid, Undead | +3 / +6 | Forbidden Armor: Leather / Chain / Plate | −1 / −2 / −5 |
| Expertise (any) | +2 | Forbidden Material: Iron −1 … Steel −10 (Elven −9, Dwarven −7) | −1 to −10 |
| Immunity (any) | +10 | Forbidden Shield Types | −1 |
| Increased Magery 1x / 1.5x / 1.75x / 2x / 3x INT | +2 / +4 / +6 / +8 / +10 | Forbidden Weaponry | −2 |
| Rapid Healing: Light / Darkness / General | +2 / +3 / +4 | Inability to Regen Spell Points | −14 |
| Regenerate Health: Water / Light / Darkness / General | +2 / +6 / +10 / +14 | Light-Powered Magery: lower / unable | −10 / −14 |
| Resistance (any) | +5 | Low Tolerance (any) | −5 |
| Spell Absorption: Light / Darkness / General | +8 / +12 / +14 | Phobia (any) | −4 |

A custom class's base magicka multiplier is **x0.50 INT**. Increased Magery *replaces* it.

## 3. Biography

Each class has a 12-question questionnaire (`BIOGnnT0.TXT`). A custom class gets the questionnaire of the
standard class that shares the most of its 12 skills (`classAffinityIndex`).

Answers can grant:

- skill bonuses (shown during skill distribution, applied when the game starts);
- gold and items;
- social-group and faction reputation;
- six modifiers: resist magic / poison / disease, to-be-hit, fatigue and reaction.

Two quirks:

- **The modifiers are assigned, not added**: if two answers set one, only the later one counts
  (`src/systems/biography.js` `applyBiographyEffect`).
- **Choosing not to answer picks random answers** (DFU's `DaggerfallStartNewGameWizard`). It does not
  pick "nothing".

## 4. Attributes (`src/systems/chargen.js` `rollStats`)

- Each attribute = **class base + a roll of 0–10**.
- You also get a pool of **6–14 points** to place. Nothing may go above 100, and the game won't continue
  until every point is placed.
- You can **reroll** as often as you like.

What each attribute feeds (`src/combat/formulas.js` and the overhaul):

| Attribute | Feeds |
|---|---|
| Strength | Damage: DFU (STR−50)/5; **DFO default (STR−50)/10**. Carry weight STR × 1.5 kg. Overhaul weapon bonuses. |
| Intelligence | Magicka = floor(INT × class multiplier). |
| Willpower | +WIL/10 on every saving throw. Under the overhaul, also the size of "Bonus to Hit" (see doc 03). |
| Agility | DFU to-hit (AGI/10 − 5). Under the overhaul, (your AGI − the foe's)/4, and most weapon bonuses. |
| Endurance | Health per level: + (END/10 − 5). Healing rate. Fatigue = STR + END. |
| Personality | Prices, reactions, persuasion. |
| Speed | Walk and run speed. Overhaul to-hit (your SPD − the foe's)/8. |
| Luck | Overhaul to-hit and crits. |

## 5. Skills (`src/systems/chargen.js` `rollSkills`)

- **Primary** skills start at 28 + (0–3), **major** at 18 + (0–3), **minor** at 13 + (0–3). Every other
  skill rolls 3–6.
- Each group (primary, major, minor) gets **6 points** that only its own skills may take.
- Biography skill bonuses are added on top.

## 6. Reflexes

Five settings, Very High to Very Low. They change how quickly **enemies** swing at you: ±0.45 s per step
on each enemy's melee timer (`src/characters/enemyAttack.js`). Higher reflexes make the game *harder*;
they don't strengthen the character.

## 7. What happens when you press "done"

- **Health at level 1** = 25 + HP per level. Each level adds a roll from HP/2 to HP, + (END/10 − 5),
  never less than 1.
- **Starting gear and spells come from your skills**, because Roleplay & Realism: Items is on by
  default (`src/systems/rriKits.js`):
  - each primary and major skill hands out an item (a weapon for weapon skills, armour pieces, bandages
    for Medical, gold for Mercantile, a gem for Pickpocket...);
  - each primary or major magic school hands out spells;
  - the chance of steel/chain instead of iron/leather reads the **class's base Luck**, not your rolled
    Luck.
- The Healer gets a second heal, Balyna's Healing Touch, which can heal another player (DFO's own,
  HEAL1).
- The **level-up sum** is recorded *after* biography bonuses, so the biography gives no free level.

## 8. Leveling, briefly

**Classic system** (`src/systems/advancement.js`):

- The level-up sum = primary skills + major skills (minus the lowest) + the highest minor.
- Level = floor((gained + 28) / 15). The first level comes after just 2 points; then one every 15.
- A skill raise needs floor(value × skill multiplier × class multiplier × 1.04^level × 2/5) + 1 uses.
  - Skill multipliers: Running ×50, languages ×15, Medical ×12, Critical Strike ×8, most combat and
    magic ×1–2.
- Daggerfall's **95 lock** applies offline unless Master Skills is on: once a primary skill is
  mastered, no other skill at 95+ may rise.

**Oblivion-like system** (opt-in at creation, `src/systems/oblivionLeveling.js`): every skill raise fills
a 100-point bar, and each level-up hands you a purse of points to spend on attributes.

**Master Skills** (always on online, a choice offline) lets every skill reach 100, and five chosen skills
go on to 200:

- 2 primary, 2 major and 1 minor, chosen when each reaches 100. The choice is permanent.
- Points past 100 cost 4×/8×/16× the uses and count as a quarter of a point in formulas.
- There are milestone bonuses at 125, 150, 175 and 200.
- Past 100, a skill only learns from foes that are tough for it.

**Arcane Specialisations** (online): a mage who masters two schools picks one of 15 paths, which comes
with a signature spell and a passive (`bible/06-Systems/Arcane-Specialisations.md`).
