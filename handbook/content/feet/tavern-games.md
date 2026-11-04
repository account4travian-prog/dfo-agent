---
title: Tavern games
summary: The games A Seat at the Table introduces.
stage: feet
order: 90
gate: level 2
status: draft
verified: 0df2d87eb
tags: [taverns, games, multiplayer]
---

> [!tip] At a glance
> - **A Seat at the Table** opens with a tavern regular at character level 2.
> - Its second step introduces **The King's Gambit**, a card-table game of armies and kings.
> - The King's Gambit is enabled by default, but you can switch it off for your own game.
> - When it is off, tables offer Hold'em and Iliac Hand instead.

## Find the tables

Taverns are places to rest and meet other players, and their card tables host online games. **A Seat at the Table** is a short introduction questline from a tavern regular. Its first step is **A Hand of Cards**; its second, **The King's Gambit**, waits until the King's Gambit feature is enabled.

The King's Gambit is a game of armies and kings at a tavern card table. You can play against a regular or another player, for gold or for fun. If you do not see the table, check the feature's setting: it is on by default, but it remains your own setting online. With it off, tables offer Hold'em and Iliac Hand.

## Next

- [Taverns and rooms](../town/taverns-and-rooms.md)
- [Meeting other players](../town/meeting-players.md)

## Sources

- `src/systems/questlines/qlLines.js`: `introTables`, A Seat at the Table gate and the King's Gambit step requirement
- `src/systems/features.js`: `KINGS_GAMBIT_KEY` and `mod-kings-gambit` feature default and online scope
- `src/systems/online/onlineLane.js`: online preference policy
- Online-lane check: `handbook/research/M.md`
- `src/scenes/gambitTableGame.js`, `src/net/kingsGambit.js`: King's Gambit table game
- Research note: `handbook/research/Q1.md`
