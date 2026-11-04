# Brief: outside watcher and census (Luna)

Worktree `terrasol\watcher`, branch `luna/watcher`. Read `docs/round3/COMMON.md` first.

## Why

The agent can keep reporting finished routines while doing nothing useful, for example exploring in circles. Nothing outside the agent judges a run. The old harness had two tools for this, both read only in `%USERPROFILE%\Documents\DFO\.claude\worktrees\ai-game-interface-dfos-3bf743\agent\checks`:
- `census.mjs` counted stop reasons, which is how the "blocked closing on Rat ×62" bug was found;
- `watch.mjs` was the watcher.

TerraSol needs equivalents built on its own logs. The logs are under `data/runs/<run>/`: `trace.jsonl`, `packets/packets.jsonl`, epoch folders and `summary.json`. Read `src/report.mjs`, `src/log.mjs` and `src/control.mjs` to learn their shapes and the control API. The primary checkout's `%USERPROFILE%\Documents\DFO\DFO-TerraSol\data\runs\2026-10-27T09-31-49-338Z` is a real browser-mode run you may read as a sample. Copy small redacted excerpts into fixtures; do not copy whole logs.

## The job

1. **`tools/census.mjs <runDir> [--json]`**: a zero-model summary of one run:
   - Body and executor stop reasons, as a histogram of note texts such as `blocked closing on X` and `door ahead`;
   - task outcomes by intent, workflow and UI task;
   - verified useful outcomes, using metric v2 from `src/report.mjs`, not a new definition;
   - holds and their reasons;
   - model calls and known/unknown usage per tier;
   - the top repeated failures;
   - time playing, waiting on models, held, and in repair.

   Plain text by default, JSON with `--json`. It must cope with the old browser-mode run and with native/three-tier runs. A missing section reads "absent", never zero.
2. **`tools/watch.mjs`**: an independent watcher process with zero model calls. It polls the control API as `src/control.mjs` does and applies configurable rules over a sliding window:
   - no verified useful outcome for W minutes while not held → hold;
   - the same stop reason K times in the window → hold;
   - health falling while there has been no movement progress → hold;
   - input held with no active task, or a lease that never releases → stop.

   It writes each verdict with its evidence to `data/runs/<run>/watch.jsonl`. It runs dry by default, logging what it would do; `--enforce` actually requests the hold or stop through the existing control path. It never clears a hold, never resumes, and never touches the game page directly.
3. **Tests**: watcher rule tests with a fake control API and clock; census tests on fixtures, including a run with missing usage.

## Files you own

- `tools/census.mjs`, `tools/watch.mjs`
- new `src/watch/**`
- `test/round3-watch*.test.mjs`, `test/round3-census*.test.mjs`
- `test/support/round3-watch/**`
- `docs/WATCHER.md`
- `docs/round3/watcher-REPORT.md`

Do not edit any other file. Under Requests, describe any event that a rule needs but the logs do not contain.
