---
title: The Arena
summary: "Bouts, ladders and rated play, introduced by The Herald's Call."
stage: bay
order: 20
gate: level 6
status: draft
tags: [arena, bouts, rating, multiplayer]
verified: 0df2d87eb
---

> [!tip] At a glance
> - **The Herald's Call** introduces the Arena at character level 6.
> - The Arena has its own rules and referee. Its bouts are separate from ordinary world combat and duels.
> - The ladder is a sequence of bouts against listed opponents. Rated play uses an account rating and seasons.
> - Look at the Arena window before queueing so you know whether you are entering a ladder, exhibition or player bout.

## What the Arena offers

The Arena is a dedicated online match system. It includes a ladder of AI opponents, rated matchmaking and bouts that players can arrange or watch. The Arena window presents its own pages and bout cards. Its rules are handled by the relay, not by ordinary damage between players in the shared world.

The ladder and rated matchmaking are different activities. The ladder advances through its configured opponents; rated matches pair players and update their ratings. Exhibition and private sessions provide other ways to stage or watch bouts. The season clock groups ratings and rewards into fixed eight-week periods.

## Start with the introduction

1. Reach character level 6 and receive **The Herald's Call**.
2. Follow the quest to the Arena and read the available Arena window pages.
3. Choose a ladder bout or a player match that fits what you want to do. Check whether the option is rated before you enter.

An account is needed for the persistent rated ladder. A rating begins at 1,000; a result moves both ratings according to the rating law, within its 100–4,000 bounds. Repeated matches against the same opponent have a daily and season count limit for rating purposes. After that, a bout may still happen but no longer counts as rated progress.

> [!online] Online rule
> Arena bouts are DFO Online systems. The relay creates and judges their match state; the familiar world combat formulas do not describe a rated Arena hit.

## Common mistakes

- **Assuming world combat applies unchanged.** The Arena uses a separate referee and match rules.
- **Treating every bout as rated.** Check its label and the pair's remaining counted matches.
- **Confusing the ladder with a season rating.** The ladder is a bout sequence; rated matchmaking changes your rating.

## Next

- [Arena seasons](../late/arena-seasons.md)
- [Town raids](town-raids.md)

## Sources

- `src/net/arena/arenaLaw.js`: `ARENA_SEASON_S`, rating bounds and `eloAfter`, ladder and match laws
- `server/src/index.js`: relay-run Arena bouts and match handling
- `server-account/src/arena.js`: account ratings, season records and rated-match limits
- `src/ui/arena/arenaWindow.js`: Arena pages and bout cards
- `src/systems/questlines/qlLines.js`: `introArena`, **The Herald's Call** gate
- `src/net/duel/duelRef.js`: separate duel referee
- Research: `handbook/research/S1.md`, `handbook/research/Q1.md`
