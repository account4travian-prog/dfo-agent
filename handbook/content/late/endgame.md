---
title: Endgame goals
summary: Choose a long-term goal, understand its demands, and decide what finishing means for your character.
stage: late
order: 80
gate: other "varies by goal"
status: draft
verified: e4f093166
tags: [endgame, goals, renown, masteries, seasons]
---

> [!tip] At a glance
> - Choose a goal you want to play toward; the systems do not share one finish line.
> - Renown stops at {{fact renown.max}}, while selected mastered skills can reach 200.
> - Questline levels introduce activities; they are not universal admission levels for every related encounter.
> - Arena seasons last eight weeks. Other goals use different clocks.

## Decide what finished means

You can finish a story, settle on a character build, complete a demanding encounter, compete for a season or continue a family line. You can choose any of these stopping points.

The original Daggerfall main quest remains part of your character's story. Online play does not replace it with a compulsory shared campaign. Your quest state stays yours, even when you share quest foes with a party. The added introduction and endgame questlines lead you into online systems; they do not make the original main quest a prerequisite for parties, guilds, Renown or shared events.



## Choose your long-term goal

| Goal | Gate | What it asks | What it gives |
|---|---|---|---|
| Reach Renown {{fact renown.max}} and shape the Firmament | Online progression; Written in the Stars opens at character level 3 | Earn capped Renown XP and plan star spending | Online growth and a chosen set of Firmament benefits |
| Master selected skills and choose paths | A class skill at 100 and a free mastery slot; paths require a mastered pair | Sustained, relevant skill use and permanent mastery choices | Progress toward 200, milestone benefits and eligible specialisation effects |
| Complete the Elite Breach chain | Burning Doors opens at level 10, registered online; Covens' Hoard then Weir Road | Follow witnessed deeds, obtain a Weir Key and take Redoubts | Questline honours and the encounter's rewards |
| Defeat an Abyss Dungeon | Shared event available; its introduction opens at level 12, registered online | Find the active entrance and complete the shared challenge | Encounter spoils and the relevant witnessed questline deed |
| Hold a city seat | Registered player-guild participation; founding has separate requirements | Coordinate influence and contend for control across seat weeks | A guild seat and its governing choices |
| Compete in Arena or a Royal Tourney | Arena introduction at level 6 online; Tourney follows its proclamation | Repeated refereed bouts against other players | Rated standings, seasonal competition or Tourney results |
| Continue a Legacy | Enable Project Legacy and establish a family | Plan succession and recover eligible family heirlooms | Bounded inheritance and continuity across characters |
| Explore the Eltheric Ocean | Reach it by ship; no universal character-level gate | Manage a voyage, dangerous foes and open PvP beyond the peace | Exploration and depth-band loot opportunities |

## Renown and the Firmament

Renown is separate from your character level. Reaching its cap is a bounded growth goal, not proof that your quests, skills or equipment are complete. The Firmament turns that progress into choices: you earn {{fact firmament.starsPerRenown}} stars per Renown after the first and spend them along its available branches.

Review the [Firmament](../feet/the-firmament.md) before spending. An hourly account cap limits Renown earning across characters, so changing characters does not create another full allowance for that hour.

## Masteries and specialisation paths

Master Skills is active online. At 100, you must choose an eligible class skill for mastery before it can pass the normal cap. Your slots allow two primary skills, two major skills and one minor skill. Mastery choices are permanent; selecting a specialisation and selecting a mastery are different decisions.

Mastered skills can reach 200, but their later points cost more uses and contribute reduced effective value. The use-cost multipliers rise through four, eight and sixteen times the ordinary requirement. Challenging foes and relevant activity matter; repeating weak actions is not a reliable route to mastery.

A mastered pair of spell schools can open an arcane path, while a mastered pair of weapon skills can open a martial path. You can hold one of each family. Compare each path with how you play. A path reset does not refund the mastery slots that made the path possible. Read [masteries and specialisations](masteries-and-specialisations.md) before committing those slots.

## Encounters, control and seasons

Elite Breach and Abyss goals depend on more than your damage output. Questline credit can require a service-witnessed deed in order, and a shared dungeon must be in an admitting phase. The level that opens an introduction letter does not guarantee that a particular event is available when you arrive.

City control asks for coordination across a seat week. Arena uses an eight-week season from its configured UTC epoch; Royal Tourney follows a separate seat-week proclamation. A Tourney notice does not announce a fresh Arena season.

Legacy and the sea support less fixed endpoints. Legacy carries limited gifts and an eligible heirloom through a family; it is an optional player-owned system online. The sea offers voyages rather than a universal completion bar. Beyond Veilhaven's peace, open PvP and death drops make preparation part of the goal.

## How much time to allow

The source sets event windows, caps, cooldowns and season lengths. It does **not** set one playtime estimate for finishing DFO or reaching every cap. Nor does an eight-week season require you to play every day. Your target, party availability and setbacks affect the time involved.

Use [caps and timers](../reference/caps-and-timers.md) to plan around the activity you choose. Shared encounters may require a suitable event window.

## Common mistakes

- Treating a questline's opening level as the admission rule for every encounter it introduces.
- Spending permanent mastery slots before checking a desired path's pair.
- Assuming all endgame activities reset with the Arena season.

## Next

- [Elite Gates and the Elite Breach](elite-gates.md)
- [Arena seasons and the Royal Tourney](arena-seasons.md)

## Sources

- `upstream/snapshot-e4f093166/src/net/identityToken.js`: `RENOWN_MAX`; `upstream/snapshot-e4f093166/src/net/renown.js`: `RENOWN_XP_HOUR_MAX`.
- `upstream/snapshot-e4f093166/src/net/firmament/firmamentLaw.js`: `STARS_PER_RENOWN` and star budget law.
- `upstream/snapshot-e4f093166/src/systems/masterSkills.js`: `MASTERY_SLOTS`, `masteryRefusal`, `skillCanPassCap`; `upstream/snapshot-e4f093166/src/systems/skillSoftcap.js`: `SKILL_HARD_CAP`, `SOFTCAP_TIERS`, `effectiveSkill`, `challengeQuality`.
- `upstream/snapshot-e4f093166/src/systems/arcanePaths.js`: `pathChoices`, `pathRefusal`; `upstream/snapshot-e4f093166/src/systems/martialPaths.js`: `martialChoices`; `upstream/snapshot-e4f093166/src/systems/specReset.js`: `resetSpec`.
- `upstream/snapshot-e4f093166/src/systems/questlines/qlLines.js`: `QL_LINES`; `upstream/snapshot-e4f093166/src/net/questlineClaims.js`: `QL_SERVICE_LINES`.
- `upstream/snapshot-e4f093166/src/net/eliteGates/egLaw.js`: Elite Breach admission law; `upstream/snapshot-e4f093166/src/net/superDungeon/sdLaw.js`: `sdAdmits`, shared event phases.
- `upstream/snapshot-e4f093166/src/net/townSeatLaw.js`: seat-week control and Royal Tourney rules; `upstream/snapshot-e4f093166/src/net/arena/arenaLaw.js`: `ARENA_SEASON_S`, `arenaSeasonOf`, `ARENA_PAIR_DAY_MAX`, `ARENA_PAIR_SEASON_MAX`.
- `upstream/snapshot-e4f093166/src/systems/online/onlineLane.js`: `ONLINE_PLAYERS_OWN_MODS`, Project Legacy; `upstream/snapshot-e4f093166/src/systems/legacy/legacyLaw.js`: inheritance bounds.
- `upstream/snapshot-e4f093166/src/systems/wild/etherWild.js`: sea peace and open-zone law; `upstream/snapshot-e4f093166/src/world/ethericSea.js`: sea geography.
- `upstream/snapshot-e4f093166/bible/11-Multiplayer/Multiplayer.md`: Quests stay separate; `upstream/snapshot-e4f093166/src/systems/instancePlaces.js`: `openerQuestOf`, main-story instance handling. Context: `docs/35-people-and-trouble.md`, The main quest online.


