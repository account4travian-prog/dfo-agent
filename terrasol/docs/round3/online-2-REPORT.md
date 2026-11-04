# Online part 2 report

Changes remain uncommitted in `sol/online-2`. No game, Edge, Vite, driver, live service or model was started; tests used fixtures, fakes and temporary directories.

## Changes

- Startup can establish a pre-world-to-world result using a coherent native frame, the same page/generation, online Rowan's matching identity hashes in both post-action observations and the trusted identity reader, and the trusted startup receipt. Missing frame/identity, wrong character/mode, changed page/generation and unknown results still hold. Replay does not issue input again. Already-signed-in startup records an observed no-op without holding.
- Direct `buildReport()` consumers now receive mode and reject missing/mixed session or epoch modes before aggregation. Dashboard labels follow `/session.mode`, with an unknown-mode fallback.
- `/health` exposes `inputHeld`, `activeTask: {id,kind} | null` and `inputLease: {startedAt,holder} | null`. Reads cover exposed native/Body held actions and browser key/mouse holds. A lease uses its task's start time (first observation for orphan input) and clears when input is released; terminal tasks clear active ownership.

## Tests

Initial new regression run: six expected failures and seven passing negatives before implementation. Additional missing-frame and explicit native-held-flag checks each failed before their fixes. Final new regression set: **16/16 pass**.

Intentionally changed the existing controller limit test from blocked to completed, supplying online Rowan identity evidence. Existing report/watch fixtures now label mode and epoch starts. The unlabelled legacy census intentionally returns unavailable useful-outcome/timing metrics instead of aggregating an unknown mode; its independent counts remain covered.

`node --test test/*.test.mjs`: **288 tests, 283 pass, 5 fail**. All failures are the expected `native-bridge.test.mjs` checks (absent ignored engine modules and `spawnSync git ENOENT`); no other failures. `git diff --check` passes.

## Requests

The read-only engine's `src/agent/agentBridge.js` exposes held keys but omits its timed attack-hook swings. For complete native attack coverage, expose that held state via `state().inputHeld` or include it in `held`. The browser reader accepts the explicit flag and tests it with a mock; the engine change remains outside this job's ownership. No Body, watcher, context or upstream files were edited.

## Live-pending

Actual sign-in/Rowan entry, DOM freshness across startup, physical release and lease timing, and watcher polling/enforcement against the running `/health` endpoint remain unverified. Hook-only native swings remain invisible until the bridge request is implemented.
