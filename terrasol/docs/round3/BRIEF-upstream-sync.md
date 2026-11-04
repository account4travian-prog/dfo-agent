# Brief: upstream engine sync (Luna)

Worktree `terrasol\upstream-sync`, branch `luna/upstream-sync`. Read `docs/round3/COMMON.md` first.

## Why

TerraSol plays on its own engine checkout, `engine/` (ignored and nested), pinned at `e4f09316684d78d194553d3c94cbaa9bbdaa9b7b`. Online play talks to the live DFO relay and account service, so the client must stay compatible with what is deployed. Upstream (Lattymoy's `daggerfall-js-source`) changes daily. The user wants a scheduled routine that keeps TerraSol current.

Facts to check in code (read only):
- `engine/` in the primary checkout `%USERPROFILE%\Documents\DFO\DFO-TerraSol` has `origin` pointing to the local clone `%USERPROFILE%\Documents\DFO\upstream\daggerfall-js-source`;
- that clone's remote `upstream` is `https://github.com/Lattymoy/daggerfall-js-source.git`;
- the engine holds generated bridge edits that `ensureNativePort()` installs (see `src/native-bridge.mjs`, `vendor/native-agent/manifest.json` and `engine/.rowan-native-manifest.json`);
- the live client's build tag is fetched by `engine/src/net/updateNotice.js` (`fetchLiveBuildTag`, `buildTagOf`) and set in `engine/src/buildTag.js` `BUILD_TAG`;
- dependencies come through a junction to the clone's `node_modules`.

## The job: `tools/upstream-sync.mjs`

The steps are pure modules under `src/upstream/**` so tests can drive them with temporary Git repos and a fake fetch.

1. **Busy check.** Refuse with `busy` (exit code 3) while a session, driver or game is active. Check `data/session-status.json` and `data/browser-status.json` states, and whether ports 5390–5392 are listening. Never interrupt a run.
2. **Fetch.** Fetch `upstream` in the clone, then fetch the clone into `engine/`.
3. **Choose the target.**
   - Get the live build tag from the live site (the URL that `updateNotice.js` uses).
   - Find the newest upstream commit whose `src/buildTag.js` has that tag, and target it, so the client matches what is deployed.
   - If no commit matches, target `upstream/main` and record why.
   - Record the live tag, the target and how it was chosen.
4. **No-op** when the target equals the current pin; write a receipt.
5. **Candidate.** Prepare a separate candidate engine directory at the target. Never modify the live `engine/` before the candidate passes.
   - If the lockfile differs from the current engine's, install the candidate's dependencies separately. Do not overwrite the shared `node_modules` that the clone's own checkout uses.
   - Run `ensureNativePort()` against the candidate.
   - Run TerraSol's full test suite against the candidate. Add a `DFO_ENGINE_PATH` override in `src/config.mjs` so the whole runtime and tests can point at another engine.
6. **Swap on success.** Swap the candidate in so it can be rolled back: keep the previous engine and record both revisions. Update the tracked pin; put it in one small tracked file such as `engine-pin.json` and make the code that checks the revision read it. With `--commit`, commit only that pin file to the current branch, with a message naming the old and new revisions and the live tag. `--rollback` restores the previous engine and pin.
7. **On failure** (an incompatible host seam, failed install, failed tests or a build error), keep the current engine untouched and write a failure dossier under `data/upstream-sync/<timestamp>/`. Also queue a typed `dfo-repair.v1` proposal in the existing repair-queue format (`src/mind/repair.mjs`, `src/repair/**`) so the engineering loop can repair the bridge seams.
8. **Receipts.** Every run writes a receipt under `data/upstream-sync/`. The default is a dry run that reports what it would do; `--execute` performs it. The tool runs from the primary checkout, so resolve `engine/` and `data/` from the project root as `src/config.mjs` does.
9. **Scheduling.** Document the exact command a Windows scheduled task should run (non-interactive, no prompts, finite timeouts) in `docs/UPSTREAM-SYNC.md`. Do not create the scheduled task; Claude will.

## Files you own

- `tools/upstream-sync.mjs`
- new `src/upstream/**`
- `src/config.mjs`, `src/native-bridge.mjs`
- `vendor/native-agent/manifest.json`, only for how the pin is read
- the new tracked pin file
- `test/round3-upstream*.test.mjs`, `test/support/round3-upstream/**`
- `docs/UPSTREAM-SYNC.md`, `docs/round3/upstream-sync-REPORT.md`

In the primary checkout, read only. Tests use temporary repos and a fake fetch; make no network requests.
