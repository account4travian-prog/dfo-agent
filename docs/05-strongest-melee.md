# The strongest melee character in DFO Online

*Worked out 2026-10-14 against DFO commit `bc80d4ee`. Every damage figure comes from DFO's own combat model
(`src/combat/combatStats.js` `computeCombatStats`, the maths behind the in-game stats card) and its own swing
clock (`src/systems/rriRealism.js` `rriMeleeWeaponAnimTime`). Re-run with `node planner/tools/melee-sim.mjs`.*

## The answer: a Khajiit hand-to-hand fighter

**Tiger Fist**, ready to import from the workspace's class presets (the file `tiger-fist.dfo-class.json`)
(in DFO's custom-class builder, choose **Import**). To open it in the planner, use
[`tiger-fist.dfo-plan.json`](../planner/presets/tiger-fist.dfo-plan.json).

| | |
|---|---|
| Race | **Khajiit** |
| Hit points per level | **30** (the maximum) |
| Primary skills | Hand-to-Hand, Critical Strike, Dodging |
| Major skills | Medical, Running, Stealth |
| Minor skills | Jumping, Climbing, Swimming, Backstabbing, Streetwise, Etiquette |
| Attributes (class base) | STR 75, AGI 75, SPD 75, LUC 75, END 70, INT 10, WIL 10, PER 10 |
| Advantages | Expertise in Hand-to-Hand (+2), Immunity to Paralysis (+10), Immunity to Disease (+10), Athleticism (+4), Adrenaline Rush (+4) |
| Disadvantages | Darkness-Powered Magery: unable in daylight (−10); Light-Powered Magery: unable in darkness (−14); Inability to Regen Spell Points (−14); Forbidden Material: Steel (−10), Elven (−9), Dwarven (−7) |
| Difficulty | **−12**, the floor: x0.30, the fastest skill growth the game allows |
| Biography | The class answers the **Acrobat** questionnaire. Pick "Hand-to-hand combat" (Q1), "Critical-Striking" (Q2), "a better brawler" (Q7), "Dodging" (Q9) and "Scrapper" (Q10): **+18 Hand-to-Hand**, +6 Critical Strike, +6 Dodging. |
| Stat priorities (dice pool, level-ups) | Speed and Strength first, then Luck and Agility, then Endurance |

With typical dice it starts at **55 health** (+17–32 per level), Hand-to-Hand **54**, and a **75%** chance of
steel and chain starting gear.

## Why: what the code says

### 1. Fists out-damage every weapon at every level

Damage per second against a monster of the player's level, best swing, both characters at the same
attributes (82) and skills, both expert in their weapon:

| Level | Khajiit fists | Dark Elf two-handed Dai-Katana (best weapon) |
|---|---|---|
| 1 (fists 54 from the biography, blade 36) | **38.1** | 28.1 (steel) |
| 5 | **45.6** | 37.8 (steel) |
| 10 | **52.4** | 45.6 (dwarven) |
| 20 | **62.8** | 52.8 (ebony) |
| End-game (all attributes and skills 100, level 30) | **119.2** | 95.5 (daedric) |

Why bare hands win:

- **They swing fastest.** Bare hands are the quickest weapon type (×0.9 handling) and carry no weight.
- **They grow with skill.** Hand-to-Hand damage rises with the skill (up to 11–21 per blow at 100), while a
  weapon's dice are fixed.
- **They stack bonuses.** The Khajiit racial bonus under DFO's combat overhaul is the largest of any
  race-weapon pair (up to +10 damage), and Expertise adds up to +9.
- **No material requirements.** Weapons below a monster's required metal take up to −90% damage; fists are
  never checked (`src/combat/pcaao.js`). That's why the gap is +50% against armoured monsters at level 1.
- **No repairs, no breakage.**

Bare hands also get **techniques** (DFO's special moves) while you wear **Gauntlets**:

- **Haymaker**: ×1.8, the strongest single-target multiplier in the roster.
- **Flying Kick**: hits every foe around the landing spot.
- The **Gauntlets of the Rose** make every bare-handed hit strike again for half its damage
  (`bible/05-Combat/Weapon-Techniques.md`, `bible/06-Systems/Loot-Arc.md`).

### 2. The attributes that matter, measured

Losing 50 points of an attribute costs this much damage per second:

| | Speed | Strength | Luck | Agility | Endurance |
|---|---|---|---|---|---|
| Khajiit fists, end-game | −43% | −18% | −17% | −5% | −7% |
| Two-handed blade, end-game | −35% | −35% | −17% | −11% | - |
| Any build at level 1 | −33 to −43% | −28 to −48% | −11 to −13% | −18 to −32% | ~−12% |

- **Speed is king**: it sets swing time.
- **Strength** adds damage, counted twice for a two-handed weapon under the overhaul, and offsets weapon weight.
- **Luck** raises crit chance (Critical Strike / 2 at Luck 100, against /4 at 50), and crits double damage at
  Critical Strike 100.
- **Agility** matters early, while hit chance is still below its 97% cap.
- Intelligence, Willpower and Personality add nothing to melee damage.

### 3. The class costs: why these picks

- **HP 30** costs 22 difficulty points. Every other "power" pick is paid for by disadvantages a pure fighter
  never feels. That brings the class to **−12**, the floor, so every skill rises at x0.30: 2.5× faster than
  a Warrior.
- **No magic at all**: the three magic disadvantages are worth **−38** together, and a character with 0
  magicka loses nothing to them. Online, rest restores health and magicka anyway (REST-MANA1).
- **Forbidden Steel, Elven and Dwarven** (−26): these lock weapons (irrelevant to fists) and plate armour
  of those metals. Iron, silver, mithril, adamantium, ebony, orcish and daedric plate stay allowed, so the
  armour ladder has gaps but no wall. It's the classic forbidden-material trick, and fists make it
  nearly free.
- **Immunity to Paralysis**: melee's worst threat is paralysis (a spider's or scorpion's hit casts Spider
  Touch). Khajiit have no racial immunity, so the class buys it.
- **Immunity to Disease**: quality of life.
- **Athleticism**: techniques and every swing cost fatigue, and running out of fatigue next to a foe is
  death.
- **Adrenaline Rush**: +8 to hit below a sixth of health.

### 4. Traps this build avoids

- **"Bonus to Hit" is a trap for a fighter.** It adds damage, not hit chance. Under the overhaul its size
  is 10 + (Willpower−50)/5, less half the foe's level. At Willpower 15 that's nothing beyond the earliest
  levels, so it costs 3–6 points for close to zero.
- **Phobia is far worse than it looks.** Its penalty grows as Willpower falls: at WIL 15 that's −7 plus
  half the foe's level, off every blow.
- **Regeneration and Rapid Healing** are poor value online, where rest restores health without passing
  time. In a fight, 1 health per 4 game minutes is too slow to matter.
- **High Elf + Critical Weakness to Paralysis** no longer gives free points; see doc 03.

## Community advice, and where DFO differs

- **UESP's Daggerfall Unity warrior guide (JayH)** uses a Redguard long blade: Speed first, Strength second,
  HP 30, Expertise, Immunity to Poison. Speed and Strength first is exactly what the measurements say.
  But it dumps **Agility to 25**. That was fine in Daggerfall Unity, but DFO's overhaul reads Agility in
  every to-hit term (your AGI − the foe's, /4) and in Expertise. Agility 80 → 40 costs a level-1 fighter
  about 30% of its damage.
- **The Redguard bonus it relies on** (+level/3 with every weapon) is Daggerfall Unity's. Under DFO's
  overhaul, Redguards get attribute-based bonuses with long blades, blunt weapons, axes and bows. That still
  makes them the most *versatile* weapon race: top two with every weapon type at level 1.
- **"Hand-to-hand is probably the best melee option"** (r/Daggerfall) matches DFO's maths. In DFO, fists skip
  material requirements entirely, and the overhaul made Khajiit the best brawlers.
- **Classic fast-leveling guides** relied on High Elf + Critical Weakness to Paralysis. Daggerfall Unity, and
  so DFO, closed that.
- I found **no published DFO-specific build guides**; the game is too new.

## If you'd rather swing a weapon

**Ashen Blade** ([class file](../planner/presets/ashen-blade.dfo-class.json)): a **Dark Elf** with a
two-handed long blade (Dai-Katana). It has the same skeleton, with Expertise in Long Blade, and forbids
Elven, Adamantium, Mithril and Silver. That leaves the iron → steel → dwarven → ebony → orcish → daedric
ladder open, and dwarven already meets a werewolf's silver requirement. It's the strongest weapon user:
74–87% of the fists' damage, depending on level. In exchange it gets weapon enchantments, gem sockets and loot powers,
and the long-blade techniques (Whirlwind, Leap Strike).

**Redguard** is the pick if you want to switch weapons freely, and it's the strongest at level 1 with
anything but fists.

## The honest limits

- **Armour on the foe.** These figures are before the target's armour. Monsters mostly wear none. Against
  people in top-tier plate (other players, armoured knights), fists are reduced more than blades:
  - Daedric-tier armour lets through 30% of a fist, 34% of an edge, 40% of a blunt weapon;
  - leather is the other way round.
  
  In PvP against heavy plate, a Nord with a blunt two-hander roughly ties the fists.
- **Gear isn't modelled**: enchantments, loot powers, gem sockets, sigil sets and technique lines. Weapons
  have more room for those than gauntlets do, so a perfect end-game weapon may close the gap.
- **Survivability**:
  - Willpower 15 means poison is stopped only 31% of the time and spells land ~60% of their damage.
  - A **Breton** with Resistance to Magic is immune to every Magic-element spell (doc 03), at roughly
    20% less damage.
  - **Personality 10** makes merchants and townsfolk unfriendly; raise it if that matters to you.
- **Past 100**: online, Master Skills lets five skills reach 200. The model caps skills at 100, so that
  climb isn't measured here.
- **No spells means no Recall, Levitate or Water Breathing.** Use potions, items and, online, the Portal
  Stone.

Sources:
[JayH's Character Creation Guide (UESP)](https://en.uesp.net/wiki/Daggerfall_Mod:Daggerfall_Unity/JayH's_Character_Creation_Guide),
[UESP: Daggerfall classes](https://content1.uesp.net/wiki/Daggerfall:Classes),
[UESP custom-class hints](https://ts.uesp.net/dagger/hints/dagcus2.shtml),
[r/Daggerfall tips thread](https://redlib.hbubli.cc/r/Daggerfall/comments/1kvavgk/daggerfall_tips_for_dummies),
[Roleplay & Realism (dfworkshop forums)](https://forums.dfworkshop.net/viewtopic.php?p=26893),
[PC Gamer: Daggerfall mods guide](https://pcgamer.com/daggerfall-mods-setup-guide).
