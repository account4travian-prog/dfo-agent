---
title: What DFO Online is
summary: DFO Online is a browser-played reimplementation of Daggerfall that uses your own game data and adds shared online play.
stage: begin
order: 10
gate: none
tags: [introduction, online, browser]
status: draft
verified: e4f093166
---

> [!tip] At a glance
> - DFO Online is a reimplementation of the 1996 role-playing game *The Elder Scrolls II: Daggerfall*.
> - You play in a browser at the DFO site; the game itself is served from `/play/`.
> - You need your own copy of Daggerfall's original game data. DFO does not include it.
> - Online play adds shared systems and rules to the port. Your interface and many personal settings remain yours.

## A shared Daggerfall world

DFO Online began as a port of Daggerfall Unity, but it has developed into its own game. Daggerfall Unity remains a
reference for its data and logic; DFO rebuilds the presentation in WebGL2 and adds its own online systems. You explore
the familiar world alongside other players, with rules that can differ from offline Daggerfall Unity.

You play it at [daggerfalljs.dev](https://daggerfalljs.dev/), and the game itself opens from the site's
[Play page](https://daggerfalljs.dev/play/). The project is open source at
[Lattymoy/daggerfall-js-source](https://github.com/Lattymoy/daggerfall-js-source), and players compare notes on the
[DFO Discord](https://discord.gg/jM2JdwSM8w).

The game reads original Daggerfall data from your own copy. Those files are required and are not part of the DFO
repository or download. See [Playing in the browser](playing-in-the-browser.md) for the client and data requirements.

## Your first character

New characters begin in Privateer's Hold, a dungeon that introduces movement, interaction and survival. Your early
route leads out to Gothway Garden. The guide follows that same order: [your first minutes](../hold/first-minutes.md),
then [moving](../hold/moving.md) and [fighting](../hold/fighting.md).

## Online rules

Some rules are shared so everyone in a room meets the same world; other choices belong to you. For example, the online
lane forces selected world systems on, while your interface skin is a personal setting. Where this guide describes a
system that differs online, it explains the online rule in that page.

## Next

- [Playing in the browser](playing-in-the-browser.md)
- [Interface skins](interface-and-skins.md)

## Sources

- `https://daggerfalljs.dev/`: the live game site, its Play page, the public source repository and the Discord
- `README.md`: project description, `/play/` location, WebGL2 presentation, and ARENA2 requirement
- `src/systems/settings/settingsDefaults.js`: `StartCellX`, `StartCellY`, `StartInDungeon`
- `src/systems/online/onlineLane.js`: `ONLINE_ROOM_MOD_KEYS`, `ONLINE_FORCED_PREFS`
- Research note: `handbook/research/B1.md`, `handbook/research/H1.md`
