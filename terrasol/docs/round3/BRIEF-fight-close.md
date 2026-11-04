# Brief: fight-close (Luna)

Worktree `terrasol\fight-close`, branch `luna/fight-close`. Read `docs/round3/COMMON.md` first.

## The bug

TerraSol's Body (`vendor/legacy-agent/body/core.mjs`) was copied from the old harness one job before its FIGHT-CLOSE fix. The old harness's trial 13 shows the result: Rowan's predecessor opened the door, then died to a rat in the doorway. Old run: `%USERPROFILE%\Documents\DFO\.claude\worktrees\ai-game-interface-dfos-3bf743\agent\runs\2026-10-20T06-36-16` (read only).

Its stop reasons were:
- "blocked closing on Rat" ×62 and "door ahead" ×37;
- the rat bit from 1.9–2.2 m;
- the Body stopped at its 2 m reach and swung 48 times from the edge;
- when the rat sat beyond 2 m in the doorway, the door counted as an obstacle, so the Body would not step in.

The same logic is in TerraSol's `core.mjs` around the `fight` goal: `blocked closing on ${f.type}` and the `f.dist > s.reach` test.

An unfinished fix exists in the old worktree at `%USERPROFILE%\Documents\DFO\.claude\worktrees\ai-game-interface-dfos-3bf743\research-inbox\fight-close-wip.patch` (read only, not applied). It made two changes:
1. While closing on a visible foe, door hazards and door cells no longer stop the Body. Walls, water and drops still do.
2. The Body steps in to `CLOSE_M` = 1.3 m before swinging. When the step-in is blocked, it swings from bite range (reach + 0.3).

In the old harness it failed 5 tests whose expectations were meant to change. Its doors-now-pass test was one of them.

## The job

- Port and finish that fix in `vendor/legacy-agent/body/core.mjs`.
- Keep Path A's per-tick combat guard: the selected target, frame, freshness and health-floor checks, the latch, and the 750 ms occlusion grace in the executor.
- Add a regression built from trial 13's numbers: a rat 2.1 m away across a doorway, biting. Before the fix the Body stays at the edge; after it, the Body closes and swings in reach.
- Keep a test that real walls, water and drops still stop closing.
- If fight completion or receipts in `src/intent-executor.mjs` depend on reach, adjust them there so evidence stays honest. A swing is not a hit; a vanished foe is not a kill.
- Update the vendored hash records for `core.mjs` (`docs/BODY-PORT.md`, plus any test or benchmark that checks it).

## Files you own

- `vendor/legacy-agent/body/core.mjs`
- `src/intent-executor.mjs`, only if needed
- `test/body-*.test.mjs` and `test/intent-executor.test.mjs`
- new fixtures under `test/support/fight-close/`
- `docs/BODY-PORT.md`
- `tools/native-benchmark.mjs`, only to register new tests

Report: `docs/round3/fight-close-REPORT.md`.
