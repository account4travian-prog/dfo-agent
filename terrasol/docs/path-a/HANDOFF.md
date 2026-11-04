# Path A handoff - control contract and bounded skills

Implemented in the primary checkout from shared baseline `3ccabd5`. No browser/game/model trial was launched. Path B's worktree was read for interface reconciliation and left untouched.

## Implemented

- `src/native-controller.mjs` supplies the actual `dfo-control.v1` service and HTTP routing used by the browser. Health advertises canonical capability keys. `/snapshot` keeps page/generation/frame coherent across its capture interval, requests a fresh native sample, and captures UI/images only when requested. A mixed-frame capture is rejected. Coherence is not frozen pixels/pose.
- Requests preserve their captured observation, page/frame/generation and observed target basis. Request IDs are idempotent within the driver generation; conflicting reuse, unknown IDs, stale observations and implicit replacement of an active task are refused. Task-specific polling/cancellation never aliases a newer task. Plan authority is echoed as opaque audit metadata; Path B validates current plan versions.
- Stop latches immediately, independently of a pending protocol operation. Start/poll/cancel/release operations have deadlines; a hung operation holds control and records a terminal fault with unverified cleanup. Explicit resume requires acknowledged release. The in-page generation fence rejects old asynchronous commands. Driver replacement/Body replacement is needed after an unresolved old executor operation; the browser installs a fresh disabled Body for new execution after verified release.
- UI input uses the same cancellation/serialization boundary. Unverified native cleanup refuses UI input. Captured UI identities can be supplied as the UI ID or enclosing snapshot ID; stale UI still fails the existing DOM/control/generation checks.
- Visible person/thing IDs are allocated only after sight checks, using underlying records; exterior door wrappers use continuous-coordinate anchors. IDs change at frame replacement. Moving NPC interaction refreshes the chosen actor's coordinates, requires that handle at the crosshair, and refuses a closer ambiguous target. Nonpersistent engine records may still invalidate a handle rather than guessing another actor.
- The central normal `PlayerMotor.spawn` placement seam now invalidates the spatial frame, covering ladder/load/recall/rescue placements that use it. Existing mode/teleport seams remain. An observed discontinuity guard also invalidates unexpectedly large jumps; it is a conservative fallback, not a proof that every engine position write has been audited.
- Combat locks onto the model-selected visible hostile, even if another actor becomes slightly nearer. It stops movement/attacks during occlusion, permits a 750ms reacquisition interval, and ends on sustained loss, scene change, health floor or deadline. No blind attacks and no automatic switch to another actor. Fight, retreat, support/door/corridor behavior reuse the prior Body.
- Terminal receipts include evidence schema `dfo.evidence.v1`, measured progress and explicit `killVerified:false` / `gameGoalVerified:false`. Fight expiry/loss remains an interruption/expiry, not a fabricated kill/clear. Generic HUD text alone no longer completes a use.
- The installer records managed host patch blocks as well as module hashes. Managed `world-install.txt` updates replace the recognized old block once; unrelated edits or unrecognized installations are refused before writes.

## Verification

The pre-reconciliation primary suite passed **144 tests**. The expanded overlapping controller benchmark passed **104 tests**. Real HTTP requests against the production protocol service with injected game adapters cover idempotency, conflicting IDs, unknown/stale requests, mixed-frame snapshots, selective images, stop/start races, hung poll, release failure and UI/native authority. These are HTTP tests, not CDP/rendering or live-game tests.

Actual engine-module tests cover player input-hook dispatch, visibility-filtered foe/person handles and a small normal motor placement invalidating the frame. Actual Body tests cover selected-actor aiming, distance crossings, short occlusion, health floor, typed use disambiguation and generation rejection. Recorded corridor/door regressions remain green. Source/vendor hashes are updated.

## Zero-model live smoke tooling

`node tools/native-smoke.mjs --case turn` is a **dry run**: no HTTP, no game, no model. The script starts no services under any mode.

After the user resumes gameplay and a compatible driver is already running, an explicitly requested smoke can use `--execute`, optional `--images`, and a supported case. Goto/use/fight/retreat require an actually observed `--target-id` or `--target-index`; turn accepts `--degrees`. Execution is bounded by `--max-ms` (default 10000, cap 90000), saves local receipts under `data/smoke/`, cancels on deadline/signal, and attempts pause/hold afterward. It never automatically resumes a held driver. No `--execute` smoke was run during development.

## Remaining limits

Live native precision, combat survival, target identity across all engine record families, CDP cancellation timing and the hot-repair drill remain unverified. Completed kill/clear, quest/item/save evidence and comprehensive player UI skills are not implemented by this control package. The three-tier worker currently needs an already booted world; startup/character/load UI remains the explicit legacy path until a validated UI workflow is integrated. No one-hour trial or real token-saving claim is established.

Path B contract requests for canonical capabilities, snapshots, task IDs/authority, cleanup state, conservative evidence and operator latching are implemented. Reconciliation must exercise its client/scheduler against this actual HTTP service, then run the union suite before creating a combined checkpoint.
