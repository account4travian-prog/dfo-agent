---
title: Fighting
summary: Aim your swings, read enemy tells, and move out of marked attacks before they land.
stage: hold
order: 30
gate: none
tags: [combat, melee, telegraphs, shields]
status: draft
verified: 0df2d87eb
---

> [!tip] At a glance
> - A melee attack needs a foe within **2.5 m**, in view, with a clear line of sight.
> - Swing direction trades accuracy for damage: an overhead strike hits harder but is less likely to connect.
> - When an enemy marks an attack on the ground, step outside the marked area before it lands.
> - Wear a shield in your off hand to give online combat a chance to block a blow.

## Make a melee attack

Ready your weapon with **Z**, then swing with **right click**. A blow can reach a foe whose centre is within 2.5 m of
your eye, provided it is in view and there is a clear line of sight.

### Swing direction

Direction changes the swing's hit and damage modifiers:

| Swing | Damage | To hit |
|---|---|---|
| Down | +4 | −10 |
| Down-left | +2 | −5 |
| Down-right | −2 | +5 |
| Left or right | 0 | 0 |
| Up | −4 | +10 |

How you choose the direction depends on your **swing mode** (Settings, Controls):

- **Click or Hold** (the default): a click swings, and holding the button keeps swinging. Each swing goes in a
  **random** direction from six (up-right, left, right, down-left, down, down-right). You don't choose.
- **Click**: a swing on each press, also in a random direction.
- **Gesture**: hold the attack button and drag the mouse; the direction you drag is the swing you get. Choose this if
  you want to pick Down for damage or Up for accuracy.

### Will it land?

Every swing rolls to hit. Online, the Physical Combat and Armor Overhaul works out the chance from your skill with
the weapon, your Agility, Speed and Luck against the target's, the target's armour where the blow falls, and half the
target's Dodging skill. The result is always between {{fact pcaao.hitChanceMin}}% and {{fact pcaao.hitChanceMax}}%. See
[Attributes and skills](../creation/attributes-and-skills.md#the-eight-attributes).

## Read the enemy

Some stronger enemies telegraph attacks: a ground shape shows where the blow will land, and a glint marks the attacker
as it winds up. Move out of the shape before impact to avoid that telegraphed blow. A missed telegraphed attack leaves
the enemy **Open** for a short time; attacks against it deal 30% more damage during that window.

A **perfect dodge** keeps it open longer: stay inside the marked shape until the last quarter of a second, then be
outside it when the blow lands. The Open window is then one and a half times as long, and you hear a bright ring.

You can also interrupt a wind-up by striking the enemy. Hits fill its poise; a full poise meter staggers it. Heavy
weapons such as blunt arms contribute more poise than short blades. Keep moving while an enemy winds up, then use the
opening it leaves.

## Armour and shields

Against you, online armour reduces damage after an attack hits; it does not make the attacker miss. A held shield can also block: the
online combat core rolls a block on an incoming blow and, when the shield provides better protection than the armour
under it, applies the shield's reduction instead.

There is no separate active block action in the input list. The shield must be equipped and held. Press **H** to switch
which hand you use.

> [!online] Online rule
> The Physical Combat and Armor Overhaul runs online. Its armour reduction and shield block rules are the rules this
> page describes.

## Common mistakes

- **Standing in a marked attack.** Leaving the telegraphed shape before impact is what makes that attack miss.
- **Treating a shield as an extra armour layer in every case.** Its online block only counts when it protects better
  than the armour beneath it.
- **Holding still to attack.** Movement helps you leave a marked attack and maintain the distance and view needed for a
  melee hit.

## Next

- [Weapon techniques](weapon-techniques.md)
- [Archery and magic](archery-and-magic.md)

- [Combat maths](combat-math.md)
## Sources

- `src/combat/playerWeapon.js`: `WEAPON_REACH`, `SWING_MODS`, `playerMeleeCanHit`
- `src/ai/tells.js`: `PUNISH_S`, `PUNISH_TAKEN`, `TELL_LATE` (0.25 s), `PERFECT_WINDOW` (1.5), poise and stagger rules
- `src/ai/foeBlows.js`: `blowTier`, `throwsBlows` (which enemies telegraph)
- `src/systems/features.js`: Enhanced AI's online declaration
- `src/characters/weaponStates.js`: `CLICK_ATTACK_DIRECTIONS`; `src/systems/settings/settings.js`: `PORT_DEFAULTS`
  `Controls/WeaponSwingMode` '2' (Click or Hold; overrides Daggerfall Unity's '0' in `settingsDefaults.js`,
  SWING-DEFAULT1); `src/systems/controlsConfig.js`: `swingHint`; `src/systems/inputActions.js`:
  `ReadyWeapon` (Z), `SwingWeapon` (right mouse)
- `src/combat/pcaao.js`: `pcaaoSuccessfulHit` (hit chance, clamped 3-97)
- `src/ai/blowShapes.js`: `inBlow`
- `src/combat/pcaao.js`: `reduce`, shield block calculation and shield comparison
- `src/systems/online/onlineLane.js`: PCAAO in `ONLINE_ROOM_MOD_KEYS`
- Research note: `handbook/research/H2.md`
