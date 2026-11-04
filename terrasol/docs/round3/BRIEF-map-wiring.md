# Brief: wire the map picture to the planners (Luna)

Worktree `terrasol\map-wiring`, branch `luna/map-wiring`. Read `docs/round3/COMMON.md`, then `docs/round3/map-picture-REPORT.md`; that work is merged but not yet called.

## Why

`src/mind/map-picture.mjs` and the `placePicture` option of `context.build` exist, but nothing supplies them. The place memory lives in the driver process (`src/intent-executor.mjs` creates it with `createPlaceMemory`), while the scheduler runs in the worker process and reaches the driver only over HTTP (`src/mind/control-client.mjs`).

## The job

1. **Driver.** Expose a read-only `GET /place` from `src/browser.mjs`. It returns the executor's current place-memory snapshot in the shape `drawPlace` expects, the revealed automap for the current level (from the bridge's map reader, already installed), and any seen edges. Every value must be visible-to-player data only: no unrevealed layout. It returns `{available:false, reason}` when there is no native world or no executor.
2. **Client.** `control-client.mjs` gains `place()`, and it is used only when advertised in `/health` capabilities.
3. **Worker.** When the scheduler is about to build Terra or Sol context, and the navigation predicate in `context.mjs` would be true, fetch `/place` once. Write the picture with `createMapPicture({runDir})` into the active run folder and pass the result as `placePicture`. Make no extra calls on Luna or routine polls, and do not rewrite the file when the place revision is unchanged.
4. **Tests.** With a fake driver and HTTP:
   - Terra navigation context receives the map image path and caption;
   - Luna and routine polls cause no `/place` call;
   - an unavailable place map means no image and no error;
   - an unchanged revision is not redrawn.

## Files you own

- `src/browser.mjs` (the `/place` route only)
- `src/intent-executor.mjs` (a read-only accessor only)
- `src/mind/control-client.mjs`, `src/mind/scheduler.mjs`, `src/mind/runtime.mjs`
- `test/round3-map-wiring*.test.mjs`
- `docs/round3/map-wiring-REPORT.md`
