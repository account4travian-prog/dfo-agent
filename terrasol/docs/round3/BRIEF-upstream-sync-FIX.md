# Fix round: upstream sync (Claude's review)

Your first pass is in this working tree; keep what works and fix the following. Same rules as before (`docs/round3/COMMON.md`).

## What the engine actually does (checked)

- The live client is served at `https://daggerfalljs.dev/`; see the comment above `defineConfig` in `engine/vite.config.js`.
- Every built page carries `<meta name="build-tag" content="<sha>">`. The content is the git commit of the deployed head (`buildTagMeta()` and `readBuildSha()` in `vite.config.js`), and the in-repo `src/buildTag.js` value is also a commit sha.
- The engine's own parser is `buildTagOf(html)` in `engine/src/net/updateNotice.js`. Its caller in `world.js` fetches `location.href`; there is no URL constant in `updateNotice.js`.
- Upstream `main` has about 11,000 commits.

## Required changes

1. **Live tag.**
   - Delete the heuristic URL and body parsing in `liveTag()`.
   - Fetch `process.env.DFO_LIVE_SITE_URL ?? 'https://daggerfalljs.dev/'` with `cache: 'no-store'` and a 10 s timeout.
   - Parse the result with the same rule as `buildTagOf`: the `content` of the `<meta name="build-tag">` tag, attribute order not assumed. Keep a local copy of that rule in `src/upstream/`; do not import the engine module.
   - No tag, or a failed fetch, falls back to `upstream/main` with the reason recorded.
2. **Target.**
   - Remove `candidates()`, the per-commit `git show` scan.
   - Resolve the live sha in the fetched engine with `git rev-parse --verify <sha>^{commit}`, and require `git merge-base --is-ancestor <sha> upstream/main`.
   - When the sha is valid, target it. Otherwise target `upstream/main` with the reason.
   - Never move backwards: if the target is an ancestor of the current pin, record `no-op-behind` and change nothing.
3. **Disk retention.** Keep at most the 2 newest retained previous engines and delete older ones. After a failed validation, record the test output in the dossier and delete that candidate directory. Never delete the live `engine/`.
4. **No machine paths in the tracked pin.** `engine-pin.json` holds only `commit`, `previousCommit`, `liveBuildTag` and `updatedAt`. Retained-engine paths go in the untracked `data/upstream-sync/state.json`, which `--rollback` reads.
5. **Scheduling.** The scheduled action runs `--execute --commit`; Claude has decided this so the primary checkout stays clean. `--commit` must refuse (and leave the pin uncommitted) if `engine-pin.json` has unrelated staged changes; otherwise commit only that file. Update `docs/UPSTREAM-SYNC.md`: run only when the user is logged on (no stored password), daily, with "run as soon as possible after a missed start", a 45-minute limit and no new instance.
6. **Tests**, using temporary repos, a fake fetch and an injected test runner and ensurePort, with no network:
   - HTML meta parsing in both attribute orders;
   - a valid live sha is targeted;
   - an unknown or non-ancestor sha falls back to main;
   - a behind-current target is a no-op;
   - a failing ensurePort leaves the live engine untouched, writes a dossier and queues a `dfo-repair.v1` proposal, and deletes the candidate;
   - a successful swap followed by `--rollback` restores both the engine and the pin;
   - retention keeps only 2 previous engines.

Update `docs/round3/upstream-sync-REPORT.md` with what changed in this round.
