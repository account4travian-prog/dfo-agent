---
title: Arena seasons and the Royal Tourney
summary: Rated Arena seasons and Crown-city Royal Tourneys have separate schedules, pair limits and entry paths.
stage: late
order: 60
gate: level 6
status: draft
tags: [arena, arena season, royal tourney, pvp]
verified: 0df2d87eb
---

> [!tip] At a glance
> - **The Herald's Call** opens at character level 6 and introduces the Arena.
> - Arena seasons last eight weeks; rated results use a rating ladder.
> - The same pair can count five rated bouts per UTC day and ten per season; later pairings are unrated.
> - The **Royal Tourney** is a separate seat-week event, with its own sign-up cutoff and pair limit.

## The Arena season

The Arena offers bouts, ratings, exhibitions and private sessions. A season lasts eight weeks from its configured UTC epoch; the Arena week is a seven-day segment used by some reward rules. Do not confuse either clock with the seat week that governs the Royal Tourney.

Rated matchmaking begins within a rating band and widens while it searches. An offer expires if you do not answer within its response window. The rating system starts at 1,000 and uses an Elo calculation; the range enforced by the service is 100 to 4,000.

The same rated pair can have five counted bouts in a UTC day and ten in a season. Further bouts between that same pair remain playable but are no longer rated for the restricted count.

## The Royal Tourney

The Royal Tourney is proclaimed for a seat week rather than an Arena season. The same pair has at most three counted bouts in a UTC day. Its eligibility and schedule depend on the active seat-week proclamation, so check the event notices and registration screen.

## Common mistakes

- Assuming a new Arena season starts at the same time as every player's local week ignores its UTC epoch.
- Treating the per-pair limit as a limit on all of your Arena bouts misstates the scope.
- Carrying the Arena season's eight-week timer over to the Royal Tourney ignores the seat-week event.

## Next

- [Elite Gates and the Elite Breach](elite-gates.md)
- [Caps, timers and resets](../reference/caps-and-timers.md)

## Sources

- `src/net/arena/arenaLaw.js`: season/week clock, rating bounds, matchmaking and pair-counted bouts
- `src/net/townSeatLaw.js`: Royal Tourney proclamation and pair limit (the 10-minute `SIGN_CLOSES_MS` cutoff is for siege rosters)
- `src/systems/questlines/qlLines.js`: The Herald's Call level gate
- Research note: `handbook/research/L1.md`
