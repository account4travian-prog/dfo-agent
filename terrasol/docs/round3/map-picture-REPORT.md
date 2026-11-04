# Map picture report

Ported `mapImage.mjs` byte-for-byte and added a run-folder PNG writer. The picture uses remembered cells, route, start/current position, seen leads and things, current-level surfaces, and revealed automap floor. Context adds its caption for navigation, exploration, lost-state, and movement-failure planning; Terra/Sol image settings are respected, map bytes are deduped, and Luna receives no map image. The map caption and image are dropped together if the context budget requires it. Provenance and matching SHA-256 values are recorded in `docs/BODY-PORT.md`.

Tests: the new regression file initially failed to load because `src/mind/map-picture.mjs` did not exist. After implementation, all 3 new tests pass, covering bounded PNG dimensions, visible/unknown pixels, caption, navigation-context budget, image dedupe, role policy, and routine context.

Full suite: `node --test test/*.test.mjs` reports 270 passing and 5 failing. All five failures are in `test/native-bridge.test.mjs`, where this worktree lacks the ignored `engine/` checkout; some cases also report `git` unavailable to their spawned process (`ENOENT`). No other suite failures were reported.

Requests: the scheduler/context call site is not owned by this job. It must pass a `placePicture` created from the live place-memory snapshot and revealed automap into `context.build`, and provide the run folder to `createMapPicture`. The current call site does not supply those values, so live planner delivery cannot be verified from this worktree change alone.

Live run remains unverified: image delivery through the active scheduler/model transport, actual in-game map accuracy, and navigation benefit require the run-folder and snapshot wiring above plus a live run.
