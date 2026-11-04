---
title: World events and their clock
summary: "Raids, Motherlodes, Dagon's Breaches and the sea serpent: when and where they happen."
stage: bay
order: 40
gate: none
status: draft
tags: [events, schedules, game clock, raids, motherlodes]
verified: 0df2d87eb
---

> [!tip] At a glance
> - World events follow shared schedules. Use the event display and map before travelling; event clocks can differ from UTC account limits.
> - Town raids last two game hours and can begin at different times in a game day.
> - Three Motherlodes are scheduled each UTC day, each with an open window.
> - Dagon's Breach and the sea serpent have their own phases; their detailed guides explain what to do at each one.

## Read the clock before you travel

DFO Online uses more than one clock. A game day has 1,440 classic minutes; some events schedule against that clock. Account rewards and daily limits can instead reset on UTC. A world event being “daily” therefore does not mean it resets at your local midnight.

| Event | What to expect | Clock to follow |
|---|---|---|
| Town raid | A selected town is attacked for a two-game-hour window. Its start varies within the game day. | Shared game-day event information |
| Motherlode | Three world lodes are scheduled per UTC day. Each has a two-hour open window and a warning before it opens. | UTC schedule and its live warning |
| Dagon's Breach | A daily sequence of omen, rise, opening, seal and Wrath phases. | Shared game-day clock; see [Dagon's Breach](../rivals/dagons-breach.md) |
| Sea serpent | A scheduled appearance with omen, rise, seal and sound phases on alternating game days. | Serpent event clock; see [The sea serpent](../rivals/sea-serpent.md) |
| Starfall | Several falling stars during a night associated with the seasonal calendar. | Starfall omen and gather window; see [Festivals and Starfall](festivals-and-starfall.md) |

Motherlodes are shared resource events rather than a personal harvest timer. Their warnings and placement tell you when and where to travel. The sources do not establish a fixed schedule time for each day's lode, so use the live warning instead of planning around an assumed hour.

> [!online] Online rule
> Event schedules are port and shared-world laws. Online mod settings and the server-side receipt rules determine the shared result; an offline calendar or a personal UTC offset cannot replace the event's live phase.

## Plan a short visit

1. Check whether the event is active, announced or still upcoming.
2. Confirm its destination and phase before beginning a long trip.
3. Leave time for the event window, the fight or interaction, and the return trip.
4. Check the account receipt after an event. Daily caps can apply across several event types.

For tactics and rewards, continue to [Town raids](town-raids.md), [Festivals and Starfall](festivals-and-starfall.md), or the event page that matches your goal. This page is only the clock map.

## Common mistakes

- **Treating every daily rule as a UTC reset.** Some schedules use game time; account caps use service boundaries.
- **Travelling on an old schedule.** Check the current event phase and target before setting out.
- **Assuming every event has a fixed hour.** Some laws define a window or warning but not one published start time per event.

## Next

- [Catching up in short sessions](catching-up.md)
- [Town raids](town-raids.md)

## Sources

- `src/systems/gameDate.js`: classic game-day length and clock conversion
- `src/net/raid/raidLaw.js`: `RAID_DAY_MINUTES`, `RAID_WINDOW_MINUTES`, raid window law
- `src/net/motherlodeLaw.js`: schedule, warning and open-window law
- `src/net/gate/gateLaw.js`: Dagon's Breach phases
- `src/net/serpent/serpentLaw.js`: serpent day and phase law
- `src/net/starfall/starfallLaw.js`, `src/systems/starfall/starfallNight.js`: Starfall phases and calendar
- Research: `handbook/research/W1.md`, `handbook/research/X1.md`
