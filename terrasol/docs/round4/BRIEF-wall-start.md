# Round 4 brief: a route can start when Rowan stands against a wall

Owner: Sol (`gpt-6.1-sol`). Worktree: `terrasol/wall-start`, branch `round4/wall-start` (from TerraSol `master` 1db0c0a).
Follow `docs/round3/COMMON.md` (it says `round3`; for you the base is `master` and your report goes in `docs/round4/wall-start-REPORT.md`).

## What happened live (2026-10-29, offline, engine 10e43fd0, zero models)

Rowan loaded his offline save in Privateer's Hold at feet `(14.424, 0.019, 26.565)`, cell `(28, 53)`. Turn and look work live.
After a full look (now an eye-level turn plus a −55° floor turn), `explore` refuses with
`explored all reachable known ground (0 edges visited)`. The cause, reproduced offline from the captured map:

- `test/support/live-2026-10-29/place-against-wall.json` is the `/place` answer right after that look (`.place` is the snapshot).
- `walkable(null, place)` gives 191 nodes; the feet cell `(28,53)` is a node (from footing strips), 39 cells are 4-connected to it,
  and there are 67 edge candidates.
- Every `findRoute` from the feet fails with `unknown or unsafe footing at start`: the 0.35 m start disk overlaps the raster wall
  cell `(29,53)` (it spans x 14.5–15.0; the feet are 0.08 m from it). `leavingWall` only accepts an overlap of at most 0.10 m
  (gap ≥ 0.25 m), and `wallCellClear` returns `null` because the snapshot has no `wallClearance` faces for that cell.
- The engine's `CAPSULE_RADIUS` is 0.35 in both engines, so the real wall face is at least 0.35 m from the feet: only the 0.5 m
  raster puts the wall closer. A player standing there is obviously on the floor and free to step away from the wall.
- The 2026-10-27 practice trial ended stuck at this same spot ("Restore normal exploration controls and find a viable passage"),
  so this is very likely the same defect, not something new in 10e43fd0.

`test/support/live-2026-10-29/snapshot-live.json` is a live `/snapshot` from the same spot (before the −55° change), for the scan
format (`native.view.scan`: `footing`, `floor`, `rays`, `pose` with `projection`).

## What to do

Make a route (and so `explore`'s `pickFrontier`, and `goto`) able to start from a disk that overlaps a raster wall cell when the
evidence says Rowan is standing there legitimately, without letting routes enter walls elsewhere. Keep the player-senses rule:
use only what Rowan's camera saw or where his feet stand; never query engine geometry the player could not see.

Find the right layer yourself (`vendor/legacy-agent/body/core.mjs` `traceRoute`/`wallCellClear`/`leavingWall`, the memory that
builds `wallClearance` in `vendor/legacy-agent/mind/memory.mjs`, or the scan that should have produced faces for that cell). Prefer
the fix that makes the existing exit-only rule work from observed evidence over a new special case. Read the comments for
trials 10, 11 and 12 around those functions first: they explain why the current limits exist, and those regressions must stay fixed.

Files you own: `vendor/legacy-agent/body/core.mjs`, `vendor/legacy-agent/mind/*.mjs`, `vendor/native-agent/agentScan.js` (only if the
scan is where the faces are lost; it is installed into the engine, so say so in the report), and new or existing tests under `test/`.

## Done when

- A new test loads `place-against-wall.json` and shows `pickFrontier({state:{pos:[14.424,0.019,26.565]}, snapshot})` returns an
  edge, with a route whose first steps move away from the `(29,53)` wall cell. Note it fails before your fix.
- A test shows a route still cannot start or pass through a disk that overlaps a wall cell more deeply than the evidence allows
  (keep or extend the existing trial 10–12 tests).
- `node --test test/*.test.mjs` passes (the engine is junctioned in, so the native-bridge tests should pass too).
- `docs/round4/wall-start-REPORT.md` explains the cause, the fix, and anything only a live run can confirm.

Do not start the game, the driver, Edge or Vite: Claude runs the live check after review.
