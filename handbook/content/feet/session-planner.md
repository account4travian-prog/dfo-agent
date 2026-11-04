---
title: Planning a session
summary: Turn one hour or one evening into a route through caps, event windows, questline letters and travel.
stage: feet
order: 15
gate: none
status: draft
tags: [session, caps, events, planning, questlines]
verified: e4f093166
---

> [!tip] At a glance
> - Decide the session's one goal before leaving town: a capped daily, an event window, a questline step or a dungeon.
> - Renown is capped at {{fact renown.hourlyXpCap}} XP per account per clock hour; combat Marks at {{fact marks.combatPerDay}} a UTC day; court writs at {{fact crafts.courtWritsPerDay}}; the bank exchange at {{fact marks.bankPerDay}} Marks.
> - Questline letters arrive outdoors in a town by day, and a new line starts no more than once per character hour.
> - Travel is real time: a carriage costs about {{fact travel.carriageDailyFee}} gold a travel day, a Portal Stone {{fact travel.portalStoneShards}} shards, and the trip back counts.

## Choose the session's goal

A session works when it chases one thing. Three kinds cover most evenings:

- **A cap run** collects the day's bounded rewards while they are available: combat Marks, a court writ, the bank exchange, the day's gathering nodes.
- **An event run** puts you at a world event inside its window: a Dagon's Breach, a town raid, the sea serpent, a Motherlode, a Starfall night.
- **A progress run** advances something uncapped: a questline step, a dungeon, a profession rank or a skill.

Mix them only in order: take the capped reward first, because it is the part a longer session cannot recover, then spend the rest of the time on progress. [Catching up in short sessions](../bay/catching-up.md) has the same advice in short form.

## Know which clock you are racing

DFO uses several clocks, and a "daily" rule does not mean local midnight.

| Clock | What runs on it | What it means for a session |
|---|---|---|
| Shared game day | The event clock. One game day is 1,440 classic minutes, and the shared clock runs 12 classic minutes per real minute, so a game day is **two real hours**. | Event windows can open and close inside one sitting. |
| UTC day | Combat Marks ({{fact marks.combatPerDay}}), bank exchange ({{fact marks.bankPerDay}} Marks), court writs ({{fact crafts.courtWritsPerDay}}), Motherlodes (three), Starfall claims (nine), gathering node slots. | The reset can happen mid-session, at a UTC boundary, not at your local midnight. |
| Clock hour | Renown ({{fact renown.hourlyXpCap}} XP), profession requests, Marks operations, market posts. | These reset at the top of each real hour; they are rate limits, not daily allowances. |
| World timers | Dungeon respawns ({{fact dungeon.respawnMinutes}} minutes ordinary, {{fact dungeon.eliteRespawnMinutes}} elite); gate, raid and serpent phases. | These belong to the world, not to your account; waiting does not "earn" anything. |

The full tables are in [Caps, timers and resets](../reference/caps-and-timers.md) and [World events and their clock](../bay/world-events.md).

The event clock's practical windows:

- **Dagon's Breach** rises once a game day (every two real hours); its open phase runs 20:00–22:00 on the game clock, about ten real minutes. Its omen starts at 17:00 game time.
- **Town raids** use a two-game-hour window, about ten real minutes, and the start varies within the game day.
- **The sea serpent** rises on every second game day — every four real hours — with its phases on that day's clock.
- **Motherlodes** are three scheduled lodes per UTC day, each with a two-hour open window and a warning before it opens; the source does not publish one fixed hour for each, so use the live warning.
- **Starfall** runs during the seasonal Witches' Festival with its own falling-star windows and a daily claim limit.

## A one-hour plan

1. **Start in a town.** Bank the purse, repair, sell spare loot, and check the event display before you commit to a direction.
2. **Read the Quests tab.** A step that is due now is worth more than a random dungeon; a letter you cannot receive away from town can wait.
3. **Pick one destination and add the return trip.** A fight that takes fifteen minutes but forty to reach is a ninety-minute session, not a one-hour one.
4. **Take the capped reward first.** If a gate or raid is close, fit it in before the dungeon; if the Marks ceiling is already spent, skip combat about Marks and do the progress activity.
5. **Leave a buffer.** Bank, repair and reach a safe town before you log out; dying with the session's takings carried is the classic way to lose them.

## A two-hour plan

Two hours is one full game day. That means one Dagon's Breach window and one raid schedule are both inside the session, and the day's combat Marks ({{fact marks.combatPerDay}}) can be filled by a gate plus a raid.

1. Spend the first stretch on the capped daily list: combat Marks, a court writ if you hold the material, the bank exchange if you have Marks.
2. Use the middle on one progress goal — a questline step, a dungeon with a private instance, or profession gathering before the day's node slots turn.
3. Watch the clock for the event you actually want; do not try to catch every event.
4. Return to town, sell, and close safely.

> [!tip] The cap is not the session
> Reaching an account cap stops that reward; it does not stop play. A capped player can still gain skill, character level, profession XP, dungeon loot and quest progress. Decide which of those the session is for.

## What not to plan around

- **A fixed Motherlode hour.** The source sets a schedule of windows and warnings, not one published start time per lode.
- **A letter while you are away from town.** The courier needs you outdoors in a town by day; a step that needs a building waits for a town that has one.
- **Loot from a respawn timer.** Dungeon respawns are world clocks; someone else may clear the room before you return.
- **A trip you cannot reverse.** Check the return leg before you spend the session's time on the outward journey.

## Common mistakes

- **Checking the caps after the activity.** Read the account list first; otherwise you spend an hour on a reward that was already spent.
- **Treating a world timer as a personal allowance.** A dungeon respawn clock is not a daily cap, and a capped account still has uncapped progress.
- **Planning a route by distance alone.** The route planner prices roads cheapest and open ground dearest, so a longer road route can be faster; see [Overworld travel](../travel/overworld-travel.md).
- **Forgetting the return.** A one-way trip can fit while the session cannot.

## Next

- [Catching up in short sessions](../bay/catching-up.md)
- [Caps, timers and resets](../reference/caps-and-timers.md)

## Sources

- `src/net/wire.js`: `ONLINE_MINUTES_PER_MS`, `sharedClassicMinutes` (a game day is two real hours)
- `src/net/gate/gateLaw.js`: `GATE_DAY_MINUTES`, `GATE_OMEN_MINUTE`, `GATE_OPEN_MINUTE`, `GATE_SEAL_MINUTE`, `GATE_EVERY_DAYS`
- `src/net/raid/raidLaw.js`: `RAID_DAY_MINUTES`, `RAID_WINDOW_MINUTES`
- `src/net/serpent/serpentLaw.js`: `SERPENT_DAY_MINUTES`, `SERPENT_EVERY_DAYS`, `SERPENT_OMEN_MINUTE`, `SERPENT_RISE_MINUTE`
- `src/net/motherlodeLaw.js`: `MOTHERLODES_A_DAY`, `MOTHERLODE_THIRD_S`, `MOTHERLODE_OPEN_S`, `MOTHERLODE_WARN_S`
- `src/net/starfall/starfallLaw.js`: `STAR_PER_NIGHT`, star windows; `server-account/src/stars.js`: claim limit (through [Caps, timers and resets](../reference/caps-and-timers.md))
- `src/net/renown.js`: `RENOWN_XP_HOUR_MAX`; `src/net/marksLaw.js`: `MARKS_COMBAT`, `MARKS_BANK`; `src/net/professionLaw.js`: `COURT_WRITS_PER_DAY`
- `src/systems/questlines/qlLineRunner.js`: `STEP_GAP_S`, `mayBegin`; `src/systems/quest/actions.js`: `GivePc` delivery conditions
- `src/systems/dungeon/dungeonRespawn.js`: `DUNGEON_RESPAWN_MS`, `ELITE_DUNGEON_RESPAWN_MS`
- `src/systems/gate/gateSpoils.js`: `PORTAL_STONE_SHARDS`; `src/systems/modSettings.js`: carriage fee (through the facts registry)
- Design records: `docs/27-caps-and-timers.md`; `docs/23-playing-online.md` "The event clock: plan a session around it" and "Your daily checklist"
- Research: `handbook/research/W1.md`, `handbook/research/X1.md`
