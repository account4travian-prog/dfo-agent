---
title: Catching up in short sessions
summary: Daily caps and the event clock, for players with an hour or two.
stage: bay
order: 70
gate: none
status: draft
tags: [short sessions, daily limits, events, planning]
verified: 0df2d87eb
---

> [!tip] At a glance
> - Check the event display first. World events and account limits use different clocks.
> - Pick one destination and one goal for the session; travel can take longer than the activity.
> - Renown, Marks, festival finds and other account services have separate limits. Reaching one does not mean all play is capped.
> - Save time to bank, repair or return to a safe town before logging out.

## Build a one-hour plan

DFO Online has both live world schedules and account-service limits. A short session works best when you decide which one matters to you before leaving town.

1. **Check the clock.** Look for an active raid, Motherlode warning, Starfall or another event you want to join.
2. **Choose one route.** Pick the nearest useful activity or event destination, and account for the journey both ways.
3. **Set a personal stopping point.** For example, finish one dungeon, complete a profession action, or make one event attempt.
4. **Check the account ledger.** Confirm receipts and remaining limits rather than repeating an activity whose account cap is already reached.
5. **Close safely.** Return to town if you need its bank, repair service or other facilities.

## Know which limits you are seeing

Not every number called a cap limits how much you can play. Some limits govern account requests, some limit reward claims, and some describe the schedule or respawn of a world activity.

| Activity | Limit to keep in mind | What it means |
|---|---|---|
| Renown | An account-hour XP ceiling | More play is still possible; Renown credit is the limited part. |
| Combat Marks | A shared daily account ceiling | Event rewards can share the same Marks allowance. |
| Starfall | A daily account claim ceiling | Stars have short gather windows as well as a separate account limit. |
| Motherlodes | Three scheduled lodes per UTC day | This is a world schedule; the open window and warning matter. |
| Dungeons | Per-foe and per-container respawn timers | These are shared world timers, not account daily caps. |

The detailed numbers and reset rules are in [Caps, timers and resets](../reference/caps-and-timers.md). Check the live event information for a current schedule; do not use an old festival date or assume that all daily counters reset on one clock.

> [!online] Online rule
> Account caps are enforced by account services. Shared events use their own game-day or UTC schedule. A character's local clock is not a substitute for either.

## Common mistakes

- **Planning around a daily number without checking its scope.** It may be per account, per character, per opponent pair or per event.
- **Treating a world timer like an account limit.** A dungeon respawn timer applies to a foe or container, not to your whole character.
- **Leaving no time to return.** A one-way trip may not fit the session even when the activity does.

## Next

- [World events and their clock](world-events.md)
- [Caps, timers and resets](../reference/caps-and-timers.md)

- [Planning a session](../feet/session-planner.md)
## Sources

- `src/net/renown.js`, `server-account/src/renownTracks.js`: Renown reporting cap law and account enforcement
- `src/net/marksLaw.js`: daily Marks ceilings and reset scope
- `server-account/src/marks.js`: account-side Marks cap enforcement and ledger
- `src/net/starfall/starfallLaw.js`, `server-account/src/stars.js`: Starfall event and claim limits
- `src/net/motherlodeLaw.js`: Motherlode schedule
- `src/systems/dungeon/dungeonRespawn.js`: per-foe and per-container respawn timers
- Research: `handbook/research/X1.md`, `handbook/research/W1.md`
