# Brief: online part 2, finishing the requests (Sol)

Worktree `terrasol\online-2`, branch `sol/online-2`. Read `docs/round3/COMMON.md` first, then `docs/round3/online-REPORT.md` (your first round, now merged) and `docs/round3/watcher-REPORT.md`.

## The job

These are the open requests from round 3.

1. **Startup across the frame transition** (your Request 1, required). In `src/native-controller.mjs`, add trusted outcome support for startup workflows that legitimately cross from the pre-world screens into a native world frame, and make an already-signed-in `startup.sign-in` a clean no-op rather than a hold.
   - Keep page and generation fencing, request replay and unknown-effect holds.
   - Do not waive frame or identity checks. Instead, define the transition's own evidence: the same page and generation, the pre-world phase before, and online Rowan's identity hash after.
   - Turn the limits shown in `test/round3-online-controller.test.mjs` into passing behaviour, and keep negative cases for a wrong character, wrong mode and changed page.
2. **Mode in direct reports** (your Request 2): `src/report.mjs` applies the same mode checks for direct consumers.
3. **Dashboard** (your Request 3): `src/dashboard.mjs` shows the reported session mode instead of its hard-coded offline label.
4. **Watcher signals** (the watcher's request). Expose `inputHeld` (whether any physical input is held), `activeTask` (the active task's id and kind, or null) and `inputLease` (start time and holder, or null) on `/health` from `src/browser.mjs`. The watcher (`src/watch/watcher.mjs`, read only for you) already reads those names. Test that they appear and clear correctly.

## Files you own

- `src/native-controller.mjs`, `src/report.mjs`, `src/dashboard.mjs`, `src/browser.mjs`
- `src/player/**`
- tests `test/round3-online2-*.test.mjs`, plus existing tests of these modules where an expectation changes on purpose
- `docs/round3/online-2-REPORT.md`

Do not edit `src/mind/context.mjs` (the map-picture job is changing it), the Body, `src/watch/**` or `src/upstream/**`.
