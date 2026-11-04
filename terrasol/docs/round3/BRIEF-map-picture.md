# Brief: the map picture (Luna)

Worktree `terrasol\map-picture`, branch `luna/map-picture`. Read `docs/round3/COMMON.md` first. This job starts after the online job is merged, so the base already contains its context changes.

## Why

Terra and Sol plan routes from text coordinates. The old harness drew a place's memory as a small PNG for the planning model. Its cost stays flat however much has been explored, and the agent with place memory reached the door in 92 s against 179 s without it.

The source is the old harness's `agent/mind/mapImage.mjs`, which offers `drawPlace` and `mapCaption`; see `agent/mind/loop.mjs` for how it was used. It is read only, at `%USERPROFILE%\Documents\DFO\.claude\worktrees\ai-game-interface-dfos-3bf743`. It writes plain PNG with node's zlib, so no packages are needed.

TerraSol already carries the matching place memory (`vendor/legacy-agent/mind/memory.mjs`, `placeMap.mjs`), used by `src/intent-executor.mjs`, and the bridge's automap base layer (`vendor/native-agent/agentMap.js`).

## The job

1. **Port the module.** Copy `mapImage.mjs` into `vendor/legacy-agent/mind/mapImage.mjs`, byte for byte where it fits, with its provenance and hash recorded in `docs/BODY-PORT.md`. Adapt it only where TerraSol's place-memory shape differs.
2. **Build the picture from what the player has seen**: remembered ground, routes, seen ways, things, the revealed automap floor, the start and the current position. Write it under the run folder.
3. **Hand it to the planners.** Add it to Terra's and Sol's context in `src/mind/context.mjs`, with its caption, when a plan involves navigation, exploration, being lost or a repeated movement failure. Respect the existing image and context budgets and the `images` role setting. Never send it on routine Luna polls, and never send it unchanged twice in a row; send the caption alone then.
4. **Tests.** Cover a valid PNG of bounded size, the caption, that nothing beyond seen ground is drawn, the budget and dedupe rules, and that Luna polls get no image.

## Files you own

- `vendor/legacy-agent/mind/mapImage.mjs`
- `src/mind/context.mjs`
- a new `src/mind/map-picture.mjs`
- `docs/BODY-PORT.md` (provenance section only)
- `test/round3-map*.test.mjs`
- `docs/round3/map-picture-REPORT.md`
