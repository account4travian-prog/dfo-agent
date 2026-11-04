# Fighting Well

*Studied at DFO Online source commit `4bba28c6c` (2026-10-20). This guide is for Tiger Fist: bare-handed, no magic, with Gauntlets equipped for its hand-to-hand techniques. Your combat skill and techniques are covered in [The Strongest Melee Build](05-strongest-melee.md) and [Building Your Character](29-build-systems.md), section 5. For danger by place, elites, revenants, and the death penalty, see [The Play Guide](23-playing-online.md).*

## Attacking

**Check the swing mode.** The online defaults set **Click or Hold**. In Controls, `WeaponSwingMode` is `2`: either a click or holding attack starts swings. Each click chooses a random direction from six: up-right, left, right, down-left, down, or down-right. If you choose **Gesture**, hold attack and drag; the drag direction chooses the swing. Gesture is the classic default, but it is not DFO Online's shipped default. (`WeaponAttackThreshold` controls how far you must drag.)

The directions change accuracy and damage:

| Swing | Damage modifier | To-hit modifier |
|---|---:|---:|
| Down | +4 | -10 |
| Down-left | +2 | -5 |
| Down-right | -2 | +5 |
| Left or right | 0 | 0 |
| Up | -4 | +10 |

The click mode does not pick straight up. For damage, that means down is the hardest swing but also the least accurate; left or right has no tradeoff. These are flat formula modifiers, not percentage changes.

A fist swing reaches **2.5 m** (2.25 m plus a 0.25 m cast radius), and still needs the foe in view with clear line of sight. A melee swing has five frames; the hit lands on frame two. The time per frame follows live Speed, strength and weapon heft, and weapon handling. Bare hands use the faster 0.9 handling factor. The clock has a 0.09-second minimum and 0.4-second maximum per frame, so there is no single swing rate for every character. ([Building Your Character](29-build-systems.md), section 5, covers the separate technique attacks.)

*Sources: `src/systems/settings/settings.js` `PORT_DEFAULTS`; `src/combat/playerWeapon.js` `gesture`, `_rollClickStrike`, `playerMeleeCanHit`, `SWING_MODS`; `src/characters/weaponStates.js` `CLICK_ATTACK_DIRECTIONS`, `MELEE_NUM_FRAMES`, `HIT_FRAME_MELEE`, `swingFrameSeconds`; `bible/05-Combat/Combat.md` SWING-LAW; `bible/05-Combat/Physical-Combat-Overhaul.md` PCO1.*

## Defence: move, do not wait to block

Tiger Fist has no active block or timed parry input. A shield can automatically block some attacks if equipped; its chance and protection are resolved by the combat formula. The Shield Widget only draws and animates the shield in first person. The Weapon Widget is a weapon display and recoil effect, not a parry control. An enemy can also turn a connected hit into zero damage; that is a hit result, not a parry button you can press.

Move out of the marked attack shape. When a telegraphed attack misses, the enemy overreaches and is open to punishment. A **perfect dodge** is specifically being inside the marked area at the late sample, 0.25 seconds before impact, then outside when it lands. That makes the open window 1.5 times longer. The foe takes 30% more damage while open; your hit that staggers it can hold it longer. Watch the ground and step clear rather than backing straight away from a tracking lunge or charge.

Armour does not make attacks miss more often. Under the shipped Physical Combat and Armor Overhaul, the attack first hits or misses; armour then reduces damage. A shield's automatic block is another part of that damage calculation.

Ordinary landed blows can knock a foe back. The poise and stagger system matters while a foe winds up: each hit adds weight to its poise, and reaching the threshold breaks the wind-up and staggers it. Your fist blow has less poise weight than a blunt weapon, so do not expect one punch to cancel a heavy wind-up. Iron tells cannot be staggered by adding poise; the blow holds them in place, but does not build their meter. The foe's poise bar is not a player poise meter. Enemy attacks can still shove, rattle, or knock you down when their shape lands.

*Sources: `src/combat/pcaao.js` `pcaaoAttackDamage`, `pcaaoArmorDamageReductionWithUnarmed`, `pcaaoShieldBlockChanceCalculation`; `src/combat/shieldWidget.js` `createShieldWidget`; `src/combat/playerWeapon.js` `weapon` resolution; `src/ai/tells.js` `TELL`, `blowK`, `poiseOf`; `src/ai/tactics.js` `windupStruck`, `beginOverreach`, `stagger`; `src/ai/foeBlows.js` `blowConnects`; `bible/05-Combat/Shield-Widget.md`; `bible/05-Combat/Weapon-Widget.md`; `bible/12-Enhanced-AI/Feud-Arc.md` TELL1, TELL3, TELL4.*

## Read the enemy before closing

Enhanced AI tells are on for everyone online. Look for the foe's body glint and ground shape; listen for its wind-up and release cues. A feint cuts its mark, so do not commit to a dodge until the attack is real. The target bar can show **Iron**, **Staggered**, or **Open**. The wind-up and landing times vary by attack, and elites and champions can use a broader set of shapes.

Fists ignore weapon-material requirements because an unarmed attack has no weapon material to check. That makes fist damage reliable against foes whose hides turn away low-metal weapons. It does not protect you from their attacks.

Prioritize ranged threats. Archers and ranged casters can attack before you reach them; the AI treats bows and ranged spells as shooter attacks. Close distance using cover when possible, then keep moving so an aimed shot or spell does not land cleanly. Poison is another serious threat: your build's low Willpower makes poison resistance weak. Carry Cure Poison and resistance potions as advised in [The Play Guide](23-playing-online.md).

Elites carry a gold halo. Champions are named foes with a visible trait such as Mighty, Swift, or Vampiric. Inspect the name, halo, and health bar before you commit. The play guide explains when they appear and their added danger. Revenants are marked returning foes that can grow stronger after they kill you or escape at low health. See [Companions](31-companions.md) for revenant details and how a sworn revenant works.

*Sources: `src/ai/tells.js` `TELL`; `src/ai/tactics.js` `foeGlint`, `poiseTrack`; `src/ai/foeBlows.js` `blowTier`; `src/combat/pcaao.js` `pcaaoAttackDamage`; `src/characters/enemy/enemyTargets.js` shooter targeting; `src/systems/eliteFoes.js` `promoteEliteFoe`; `src/systems/champions.js` champion traits; `src/systems/poisons.js`; `bible/12-Enhanced-AI/Feud-Arc.md` TELL2, TELL5-TELL9; `bible/12-Enhanced-AI/Tactics-Arc.md` TACT4; `bible/05-Combat/Physical-Combat-Overhaul.md` PCO1.*

## Fatigue and stamina

Your fatigue bar is your combat stamina. A melee swing spends fatigue when it reaches its hit frame, whether it hits or misses. The base cost is 11 before your fatigue modifiers. Running, jumping, climbing, poison, and some other effects also drain it. Haymaker and Flying Kick each cost 4 fatigue; see section 5 of [Building Your Character](29-build-systems.md) for when those attacks can be used.

Do not let the bar reach zero while enemies are nearby. Online, exhaustion near foes costs 10% of your health each time it triggers and displays a warning; it does not instantly kill you. In safe, dry conditions, exhaustion instead causes a recovery hour. A Restore Fatigue potion is the direct in-fight recovery option. Put one on your hotbar before a dungeon so you can drink it without opening the pack. Poison can drain fatigue too, so treat the poison status promptly.

*Sources: `src/scenes/hostCombat.js` `SWING_WEAPON_FATIGUE_LOSS`, `SWING_FATIGUE_COST`; `src/scenes/dungeonContext.js` `drainFatigue`, `onExhausted`; `src/systems/rest/rest.js` `exhaustionOutcome`, `fatigueRecoveryRate`; `src/systems/poisons.js`; `src/systems/quickslots.js` hotbar item entries; `src/scenes/hostMagic.js` `drinkPotion`; `src/ui/enhanced/enhancedHotbar.js`.*

## Healing and escape

Slot healing, Cure Poison, and Restore Fatigue potions before you enter. The hotbar can drink a slotted potion during play. If the fight turns bad, sprint away and break line of sight; do not stop to rest beside active enemies. Resting can be refused or interrupted while enemies are near, and rough rest is not a combat heal.

If you die online, you return at a safe place and lose a portion of the gold on you. Keep most of it banked. The exact penalty and respawn rules are in [The Play Guide](23-playing-online.md).

*Sources: `src/systems/quickslots.js` `hotbarEntry`, `hotbarPress`; `src/scenes/hostMagic.js` `drinkPotion`; `src/scenes/world.js` `enemiesNear`; `src/systems/rest/restSession.js`; `src/systems/deathPenalty.js`; `docs/23-playing-online.md`.*

## Stealth and backstabs

Hold Sneak while approaching, and let Stealth keep foes from detecting you. Backstab is a separate check: the enemy must be facing away when your swing resolves. Your Backstabbing skill sets the chance of tripling a successful hit's damage; every eligible back-facing swing trains the skill, even when the triple-damage roll fails. A Watchful revenant cannot be backstabbed. Sneaking helps you get into position, but it does not guarantee a backstab.

*Sources: `src/scenes/dungeon.js` Sneak input; `src/scenes/shared.js` shared stealth senses; `src/scenes/hostCombat.js` `backstabChanceOf`; `src/combat/formulas.js` `backstabDamage`; `src/combat/playerWeapon.js` `foeUnaware`; `src/systems/revenant/revenantFeud.js` Watchful edge.*

## Fighting with a party

Enemies choose their own targets from what they see and can reach. The AI tracks melee and ranged pressure per target; there is no player taunt button that forces an enemy to switch to you. Call a target with your party and focus fire it yourselves. A normal fist swing can hit more than one unprotected foe in reach, so pull enemies away from allies before punching into a crowded group.

Online party members are peers, not targets in the ordinary PvE foe list. Player-versus-player combat is handled through duels. The friendly-fire rules still matter for allied NPCs: town defenders and shipmates are protected from your attacks, while summons and quest companions retain the classic friendly-fire rules.

*Sources: `src/ai/tactics.js` `targetKey`, `board`, `take`; `src/characters/enemy/enemyTargets.js` target selection; `src/combat/playerWeapon.js` `resolveHit`; `src/combat/friendlyFire.js` `sparedByPlayer`, `isShipmate`; `src/combat/duelCombat.js` `resolveDuelStrike`; `bible/12-Enhanced-AI/Tactics-Arc.md` TACT2, TACT3.*

## Tiger Fist's fight routine

1. Put Cure Poison, healing, and Restore Fatigue potions on the hotbar. Wear Gauntlets with a technique line when you have them.
2. Spot the ranged caster or archer first. Close through cover and keep moving.
3. Watch the glint and ground tell. Step out of the marked shape; punish an **Open** foe.
4. Use down swings when you want damage and can accept the lower hit chance; use left or right for an even tradeoff.
5. Use Haymaker and Flying Kick from [Building Your Character](29-build-systems.md), section 5. Save enough fatigue to keep moving.
6. Drink a potion before the fight is lost. Retreat to safety before fatigue runs out; do not try to rest beside enemies.

*Sources: `src/combat/playerWeapon.js` `SWING_MODS`, `playerMeleeCanHit`; `src/ai/tactics.js` `poiseTrack`, `overreachOpen`; `src/systems/quickslots.js`; `docs/29-build-systems.md` section 5; `docs/23-playing-online.md`.*
