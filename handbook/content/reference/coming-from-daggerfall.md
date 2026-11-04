---
title: Coming from Daggerfall or Daggerfall Unity
summary: The rules a classic or DFU veteran has to unlearn before playing DFO online.
stage: reference
order: 25
gate: none
status: draft
tags: [veterans, differences, online rules, classic, Daggerfall Unity]
verified: e4f093166
---

> [!tip] At a glance
> - DFO keeps Daggerfall's world, data and many of its systems, but online it replaces the rules that decide combat, enemies, loot, travel, death and progression.
> - Your classic or Daggerfall Unity instincts are usually right about *what exists* and often wrong about *what it costs or how it resolves*.
> - Read this page before following an old guide. Then use [Which rules apply online](online-ruleset.md) as the index to every replacement.
> - Offline DFO does keep classic rules; these changes describe **online** play unless a line says otherwise.

## The short version

Online, DFO is not Daggerfall with players in it. It is a rebuilt game that uses Daggerfall's data and presentation, with a fixed online ruleset on top. The world map, dungeons, quests, items and lore are largely the ones you know. The maths that decides whether you hit, what drops, how you travel, what death costs and how you grow has been replaced or locked.

The working rule for a veteran: **assume a familiar rule has a replacement until you have checked it**. The rest of this page lists the replacements a player notices first.

## 1. Overland travel is travelled, not teleported

Classic Daggerfall's map travel is instant. Online, a trip over land is a walked or ridden journey in real time, and the carriage driver is the paid shortcut; ships sail only from ports (`src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS` forces Travel Options and Immersive Travel; see [Which rules apply online](online-ruleset.md), "Travel"). Party travel is the one fast trip: a follower can pay a fare to reach the leader without advancing world time.

## 2. Hit chance and damage are PCAAO's

Online combat runs Physical Combat and Armor Overhaul, not the classic formulas. Your Agility, Speed and Luck meet the target's; hit chance is clamped to **3%–97%**; racial weapon bonuses and attribute-based Expertise apply (`src/combat/pcaao.js`; `online-ruleset.md`, "Hitting and damage"). A hit that a classic guide calls certain can miss here, and a build that relied on a classic to-hit shortcut does not work the same way.

## 3. Enemies telegraph their blows

Enhanced AI is on online. An enemy's heavy attack lands when its wind-up completes, and the tell is your chance to move, block or interrupt (`src/characters/enemy/enemyAttack.js`: telegraphed blows; `online-ruleset.md`, "Enemy attacks"). Standing in front of a wind-up and trading blows is a classic habit that now costs health.

## 4. The enemy roster and its scaling are not classic

Meaner Monsters and Daggerfall Enemy Expansion are forced on, and the place you are in sets the threat more than your level does (`src/systems/online/onlineLane.js`: both mods locked whole; `src/systems/skillSoftcap.js`: place threat and foe scaling). A low-level character can meet a foe a classic guide would never place there, and a high-level character does not automatically outscale an easy dungeon.

## 5. Loot is unleveled

Unleveled Loot and Loot rarity are on. Materials and rarity come from luck, place and source rather than your character level (`src/systems/unleveledLoot.js`, `src/systems/loot/lootRarity.js`; `online-ruleset.md`, "Loot"). The old "level up and the loot improves" loop does not hold. Better places drop better things, and a shared container's contents are rolled under the shared rules.

## 6. Carrying, loans and repairs follow Roleplay & Realism

Encumbrance slows and drains fatigue once you pass **75%** of your carry limit; loans use Roleplay & Realism's table divided by ten for the Empire's bank; an item's condition affects its sale price, and magic items can always be repaired (`src/systems/roleplayRealism/rrRealism.js`; `src/systems/banking.js`: `EMPIRE_LOAN_DIVISOR`; `online-ruleset.md`, "Carrying", "Loans", "Repairs and selling"). The classic "no penalty until the limit" and the old loan sizes are gone online.

## 7. Death is not a reload

Offline, death ends the run and you load a save. Online, you respawn after a countdown at a safe place, at reduced health, and lose part of the gold you carry; banked gold is safe (`src/ui/deathScreen.js`: `DEATH4`; `src/systems/deathPenalty.js`; `docs/23-playing-online.md`: a tenth of carried gold). Do not plan an online fight around reloading to undo it.

## 8. You cannot load mid-session online

Online, loading a save during play is disabled, including quick load (`src/scenes/dungeonContext.js`: `ONLINE-LOAD1`). The game checkpoints your character as you go and on exit (`src/scenes/world.js`: online checkpoints and exit autosave). The classic habit of saving before a decision and reloading after a bad outcome has no online equivalent.

## 9. Mods are not yours to choose

DFO has no mod support: you cannot install DFU mods or Nexus mods, and there is no load order to manage (`https://daggerfalljs.dev/`, "Not finished"). The game ships a fixed set of mods and settings; online, the shared and balance ones are forced, and only looks-and-sound switches remain yours (`src/systems/online/onlineLane.js`; `online-ruleset.md`). A "best mods" list is advice for another game.

## 10. Your settings are Features rows, not a mod list

The switches you do control are the game's own **Features** entries, and online several are still your choice: Climates & Calories, horse care, wagon upkeep and similar personal systems. A few matter a lot: survival defaults to **Boons**, which takes nothing from you and rewards needs met, rather than the harsher tiers a mod veteran may remember (`src/systems/features.js`; `src/systems/survival/difficulty.js`: `SURVIVAL_DEFAULT`).

## 11. Marks are not gold

Online adds a second currency, **Marks**, held by your account rather than your character. They are earned from witnessed activity and spent on the market, guild seats and other account systems. The Bank of the Empire exchanges them for gold **one way**, at 8 gold per Mark, up to 300 Marks per UTC day, and the record values a Mark at about 10 gold of play (`src/net/marksLaw.js`: `MARKS_BANK`, `MARK_WORTH_GOLD`). Gold remains the character's currency; do not treat the two as interchangeable.

## 12. Renown is a second ladder

Online, character level is only one progression. **Renown** runs 1–50, comes from kills, quests and events, and pays for the **Firmament**'s stars; the Firmament's passive tree is online-only and sleeps offline (`src/net/renown.js`; `src/systems/firmamentLive.js`). A classic veteran who ignores Renown falls behind on the passive bonuses that online characters assume.

## 13. Guilds promote at once, and stop at 7

Online, an earned guild promotion is applied when you next open the services, without the classic wait; the 28-day review delay is not used for earned promotions (`src/systems/guild/guilds.js`: `updateRank`, the PROMO-NOW rule; `docs/23-playing-online.md`). Personal online rank stops at 7; 8 and 9 are chapter seats. Training is also its own law online: a member pays **100 × character level** a session, a non-member **400 × level**, sessions are capped at skill 50, and a character can train once per **12 game hours** (`src/systems/guild/guildServiceActions.js`: `TRAINING_COOLDOWN_MINUTES`; `guildServices.js`: `trainingPrice`).

## 14. Quests behave like an online game's

Quest failure costs **no faction standing online**, unlike classic Daggerfall's reputation loss (`src/systems/quest/quest.js`: `failureFree`). Quest deadlines charge only **played** time, while waits and delays are cut to a short online wait (`src/systems/quest/clock.js`). DFO adds questlines with level, account and event gates (`src/systems/questlines/qlLines.js`), and a quest's dungeon can be taken as a **private instance** for you and your party (`docs/23-playing-online.md`, "Dungeons without the crowds"). The old advice to save before a quest and reload if it goes wrong belongs to offline play.

## 15. Other players change the world around you

Online is one shared world: other players fight in the same dungeons, public dungeon kills and containers are shared, and a cleared public dungeon respawns on a real-time clock. Mentor mode switches on automatically when a party's reference level is well below yours, scaling you down without taking your real progress (`src/systems/mentorMode.js`; `docs/23-playing-online.md`, "Group up"). This is not in any classic guide because classic Daggerfall had no other players.

## What did not change

The map and regions, the dungeons' data, the quests' scripts, the items, the races and classes, the guilds' identities and most of the lore are the Daggerfall you know. Character creation still asks the classic questions; the difference is which rules those choices meet after you enter the world.

## Common mistakes

- **Following a classic walkthrough's numbers.** Hit chances, loot, travel times and death costs are the online rules now.
- **Saving to undo an online mistake.** Mid-session loading is disabled online.
- **Looking for a mod list.** DFO does not accept mods.
- **Ignoring Renown and the Firmament.** They are part of online power, not optional cosmetics.
- **Expecting a guild promotion wait.** Earned promotions apply when you next open services.

## Next

- [Which rules apply online](online-ruleset.md)
- [Offline and online](../begin/offline-and-online.md)

## Sources

- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS`, `ONLINE_WHOLE_MODS`, `ONLINE_PLAYERS_OWN_MODS`, and the travel rules
- `src/combat/pcaao.js`: hit-chance bounds, racial weapon bonuses, Expertise
- `src/characters/enemy/enemyAttack.js`: telegraphed blows (Enhanced AI)
- `src/systems/unleveledLoot.js`, `src/systems/loot/lootRarity.js`: unleveled loot and rarity
- `src/systems/roleplayRealism/rrRealism.js`, `src/systems/banking.js`: encumbrance, loans, repairs
- `src/ui/deathScreen.js`, `src/systems/deathPenalty.js`: online respawn and gold loss
- `src/scenes/dungeonContext.js`: `ONLINE-LOAD1`; `src/scenes/world.js`: online checkpoints
- `src/systems/features.js`, `src/systems/survival/difficulty.js`: player-owned Features defaults
- `src/net/marksLaw.js`: `MARKS_BANK`, `MARK_WORTH_GOLD`
- `src/net/renown.js`, `src/systems/firmamentLive.js`: Renown and the Firmament's online-only life
- `src/systems/guild/guilds.js`, `src/systems/guild/guildServices.js`, `src/systems/guild/guildServiceActions.js`: online promotions, training prices and cooldown
- `src/systems/quest/quest.js`, `src/systems/quest/clock.js`, `src/systems/questlines/qlLines.js`: failure-free quests, online clocks, questline gates
- `src/systems/mentorMode.js`: automatic mentor scaling
- `https://daggerfalljs.dev/` and `index.html`: no mod support, no save import, account-optional wording
- `docs/23-playing-online.md`: the online systems summary; `handbook/content/reference/online-ruleset.md` for the full ruleset index
- Where this page states "the source does not say" for a classic behaviour, the online path is the authority; classic Daggerfall and DFU guides describe a different game.
