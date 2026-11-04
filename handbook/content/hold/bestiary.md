---
title: Bestiary
summary: The enemy families and tiers, what each resists or requires, how they fight, and what they pay.
stage: hold
order: 55
gate: none
tags: [enemies, monsters, bestiary, resistances, meaner monsters, enemy expansion]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - A foe is minted from its row: a monster keeps its row's level and health, while a **class enemy** (bandit, knight, sorcerer) is built at your level.
> - Families matter: **Animal**, **Undead**, **Daedra**, **Golem**, **Water**, **Daylight**, **Darkness**, **Human** and **None** set innate damage reduction and behaviour.
> - Some monsters need a metal: silver for werewolves and many undead, dwarven for harpies, mithril for gargoyles, daedra and liches. Online a shortfall cuts damage rather than refusing it.
> - Online, **Meaner Monsters** and **Enemy Expansion** are both forced on; beside Enemy Expansion, MUDEX stands in for Meaner Monsters, so the shipped rows below are guides, not guaranteed online stat blocks.
> - Elite, champion and revenant promotions layer on top of the row: more health, better loot and, for revenants, a return.

## How a foe is built

The game's base table holds a row per classic monster id: a level, a health range, an armour value, up to three damage pairs, a minimum metal to hit, a soul point value, a loot table key and a behaviour/affinity pair. `enemyLevelOf` reads a monster's level from that row; a **class enemy** is handed the player's level instead, so a bandit or knight you meet is built for you while a rat is still a level-1 rat.

Online, the host owns the foe. The room forces Meaner Monsters and Daggerfall Enemy Expansion on and holds both whole at their defaults. With Enemy Expansion loaded, MUDEX — Meaner Monsters' author's form of it for a game with the Expansion — stands in for Meaner Monsters; Meaner Monsters' own rows and PCAAO's edit of them stand aside. Enemy Expansion also changes which types spawn. What you meet online is therefore the host's Enemy Expansion/MUDEX foe, not the base row below.

## Families and behaviour

| Affinity | Examples | Notes |
|---|---|---|
| Animal | Rat, Giant Bat, Bear, Sabretooth, Spider, Giant Scorpion | Fight with natural attacks; usually no metal requirement. |
| Undead | Skeletal Warrior, Zombie, Ghost, Mummy, Wraith, Lich, Ancient Lich | Will not flee from morale in the ordinary sense; several need silver or better. |
| Daedra | Frost/Fire Daedra, Daedroth, Daedra Seducer, Daedra Lord | Strongest family tier; mithril requirement common. |
| Golem | Atronachs (fire, iron, flesh, ice) | Atronach rows share a template; resistances are kind-specific. |
| Water | Slaughterfish, Dreugh, Lamia | Aquatic behaviour; mostly met in water. |
| Daylight / Darkness | Spriggan, Centaur, Nymph, Orc, Vampire | The row's affinity, not a rule that they appear only then. |
| Human | Class enemies and the watch | Built at your level; may carry weapons and shields. |
| None | Horse | Not a normal enemy row. |

Behaviour drives movement: **General**, **Flying**, **Aquatic**, **Spectral** and **Guard**. Flying and spectral foes ignore some terrain paths that grounded ones must walk; aquatic foes only make sense in water.

## A tier sample

These are base-table rows, before Meaner Monsters/Enemy Expansion and before elite or champion promotion. Level and health are the clearest measure of a tier; damage is the row's first pair.

| Foe | Level | Health | Damage (first pair) | Metal needed |
|---|---:|---:|---:|---|
| Rat | 1 | 9–16 | 1–4 | — |
| Giant Bat | 3 | 12–26 | 2–12 | — |
| Grizzly Bear | 4 | 13–34 | 1–8 | — |
| Orc | 5 | 13–34 | 1–6 | — |
| Werewolf | 6 | 17–66 | 1–10 | Silver |
| Skeletal Warrior | 9 | 17–66 | 5–15 | — |
| Giant | 10 | 18–74 | 10–30 | — |
| Zombie | 10 | 52–66 | 15–50 | — |
| Ghost | 11 | 17–66 | 10–35 | Silver |
| Harpy | 8 | 16–85 | 5–15 | Dwarven |
| Giant Scorpion | 12 | 18–74 | 15–25 | — |
| Gargoyle | 14 | 19–82 | 10–15 | Mithril |
| Wraith | 15 | 30–90 | 20–45 | Silver |
| Dragonling | 16 | 14–42 | 5–15 | — |
| Orc Warlord | 16 | 20–90 | 5–50 | — |
| Frost Daedra | 17 | 25–130 | 50–100 | Mithril |
| Vampire | 19 | 28–154 | 20–50 | Silver |
| Daedra Lord | 20 | 35–210 | 15–50 | Mithril |
| Lich | 20 | 30–170 | 70–100 | Mithril |
| Ancient Lich | 21 | 30–170 | 70–100 | Mithril |

The table is a guide to order, not an online guarantee: a promoted elite or champion adds more, and the online room's rows are the mods'.

## What they resist

**Metal requirements.** The base row's `minMetalToHit` is a material index: silver (2) for the Werewolf, Wereboar, Nymph, Ghost, Mummy and Vampire; dwarven (4) for the Harpy; mithril (5) for the Gargoyle, the daedra, the liches and the Ancient Vampire. Online, "soft" material requirements multiply damage by `1 − min(shortfall × 0.2, 0.9)` — a one-step shortfall is ×0.8, five or more ×0.1 — and the game tells you when a blow falls to 45% or less. The classic zero-damage refusal only runs with the module off.

**Silver and edges.** Silver doubles damage against the Skeletal Warrior and the six careers Werewolf, Ghost, Wraith, Vampire, Mummy and Wereboar. A non-edged weapon is halved against the Skeletal Warrior.

**Innate reduction.** A monster with nothing worn on the struck part reduces by its group's multiplier instead of natural resistance. Most are 1.0; exceptions include the Skeletal Warrior 0.8, Gargoyle blunt 1.21 and other 0.71, Spriggan blunt 0.66 and other 1.26, Ice Atronach blunt 1.4 and Iron Atronach blunt 0.6, and a few daedra careers at 0.84–1.04.

**Poison and disease.** The source routes poison through a monster's hit; the exact immunity set is per career and per spell, so check the effect's own saving throw rather than assuming a family is immune.

## How they fight

- **Beasts** telegraph a lunge. **Brutes** telegraph slam and sweep. **Blades** (humanoid weapon users) telegraph sweep and lunge. Class casters throw no telegraphed blow.
- An **archer** shoots from its ranged band on a 1/32 chance per classic tick; an aimed shot is faster and stronger.
- A **caster's** `CastSpell` action runs on a long cooldown; silence and magic resistance matter.
- An armed foe whose natural attack averages higher discards the weapon and strikes unarmed.
- A monster's unarmed attack can roll up to three damage spans, each gated by your Reflexes setting.
- **Watchful** revenants cannot be backstabbed and are never “unaware”.

## What they pay

The row's `lootTableKey` selects the loot table, and `soulPts` sets the soul value a trap captures. As a rough map from the sample: orcs use table A, giants F, ghosts and wraiths I, daedra J, vampires Q, daedra lords and liches S, the Skeletal Warrior H. Higher-tier tables carry better gear; promoted elites and champions improve the odds again. The same dungeon-kind grade that makes a place dangerous also sets its loot odds, so a high-tier foe in a high-tier place pays best.

Danger scales from the place as well as the foe. A town, a mine and a natural cave are the gentlest grades; a crypt, vampire haunt or dragon's den raises both foe strength and loot. See [Danger and regions](../travel/danger-and-regions.md), [The hero's threat](../feet/heros-threat.md) and [Elites and champions](../bay/elites-and-champions.md).

## Common mistakes

- **Reading a base row as online fact.** The room's Meaner Monsters/Enemy Expansion rows are the online foes.
- **Bringing iron to a silver fight.** Online it cuts damage; against the Skeletal Warrior the edge matters too.
- **Assuming a family is immune to poison or magic.** Immunity lives on the career/effect, not the label.
- **Treating a class enemy as a fixed level.** It is built at your level.
- **Ignoring behaviour.** Flying, aquatic and spectral foes path differently; a water foe will not come to you on land.

## Next

- [Fighting](fighting.md)
- [Elites and champions](../bay/elites-and-champions.md)

## Sources

- `src/characters/enemy/enemyBasics.js`: `ENEMY_NAMES`, `MOBILE_BEHAVIOUR`, `ENEMY_BASICS` rows (level, health, damage, `minMetalToHit`, `soulPts`, `lootTableKey`), `enemyLevelOf`
- `src/combat/pcaao.js`: `pcaaoWeaponAttackDamage`, `SILVER_DOUBLED_CAREERS`, `pcaaoPercentageReductionCalculationForMonsters`, soft material requirement, `SPECIAL_WEAPON_MONSTERS`
- `src/characters/meanerMonsters.js`: `MEANER_MONSTERS_ROWS` (the mod's buffs and rat/bat/zombie debuffs); `src/systems/enemyExpansion/dexSwitches.js`: `meanerMonstersAlone`, `mudexLoaded`; `src/systems/enemyExpansion/dexTables.js`: the Expansion's table reader
- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS`, `ONLINE_WHOLE_MODS` (both enemy mods forced)
- `src/ai/blowShapes.js`: `BLOW_FAMILY`, `familyShapes`; `src/ai/foeBlows.js`: `blowTier`; `src/characters/enemy/enemyAttack.js`: `BOW_SHOT_CHANCE`; `src/systems/spellcast.js`: `CASTSPELL_COOLDOWN_TICK`
- `src/characters/enemy/enemyBasics.js`: class-enemy levels via `isClassEnemyId`; power scaling: `src/systems/heroThreat.js`
- `src/systems/loot/lootRarity.js`: `DUNGEON_RARITY_TIER`; research note `handbook/research/H2.md`
