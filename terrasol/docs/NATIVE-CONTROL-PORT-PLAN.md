# Native control port and strengthening

Status: implemented candidate with model-free checks, 2026-10-28. No new live trial is included in this work. Live gameplay acceptance remains pending.

Updated direction: the user now proposes Luna for immediate actions/tactics, Terra 6.1 for medium-term/session planning, and Sol 6.1 for high-end decisions and post-session review, improvement planning and implementation. See `THREE-TIER-MIND-PLAN.md`. The implementation described below is the existing two-tier baseline; the three-tier routing has not yet been implemented.

## Objective and evidence

Models choose objectives, tactical choices, and policies. A local Body executes and verifies those choices without requiring model calls for steering, repeated attacks, or intermediate exploration steps. Reuse the existing DFO agent implementation and retain the current browser driver for screenshots and trusted UI input.

The interrupted practice trial made 176 Terra and 9 Sol requests in 21m18s, recorded 2,215,985 input tokens (736,000 cached), and did not establish dungeon escape or a kill. Its 15-second movement facility was not enough: chosen holds remained 1–2.5 seconds. Repairing this needs an intent executor with dependable state and outcomes, not a prompt requesting longer keypresses.

## Fixed implementation decisions

- Work only in the separate `DFO-TerraSol` project. Original DFO workspaces are read-only references. Engine base remains `e4f09316684d78d194553d3c94cbaa9bbdaa9b7b`; legacy bridge source is the existing `upstream/dfo-agent`, and legacy Body/navigation source is its enclosing agent workspace.
- Track reused source, license, exact origin, hashes, and modifications. The ignored `engine/` directory is an installation target, not the sole copy of ported work. Engine installation must be idempotent and reject an incompatible base without partial edits.
- Adapt the legacy bridge at the world host's existing input-hook seam. The normal world host supplies dungeon, building, and exterior context. Preserve scene-relative coordinates and origin compensation. Do not enable probe teleport, damage, spawn, or healing powers.
- The bridge supplies player-local pose/vitals, current UI and weapon state, visible/sensed targets, observed scans, and sequenced events. Exact pose is a declared control/measurement assist. Do not supply unrevealed layout, hidden quest answers, or omniscient enemy tracking.
- Reuse the legacy Body's 50ms tick, policy/goal validation, threat retention, movement/footing guards, stop/lease handling, and observed interaction outcomes. Reuse its observed-place memory, navigation, and frontier exploration where required; do not replace these with NPC motors or new screenshot steering.
- Native intents are `turn`, `look`, `goto`, `use`, `explore`, `fight`, `retreat`, and `stop`. Targets must resolve from the current native observation. Model choices determine whether to explore, fight, retreat, or interact. Local routines determine individual input timings and check progress.
- Routine outcomes are `completed`, `interrupted`, `blocked`, `failed`, `cancelled`, or `expired`. Acceptance/dispatch is separate from completion. Record actual displacement, angular error, UI/interaction change, health changes, and termination reason where applicable. No kill or quest completion may be inferred from an attack dispatch.
- Keep trusted browser UI actions available, with the Body disabled before any UI action. Complex equipment/commerce routines are subsequent work; this port must not claim them from generic click support.
- Use native control by default in the completed integration. Retain an explicit `--control browser` diagnostic mode; do not silently fall back to timed keys when the native bridge or Body is unavailable.
- Terra receives compact state on task completion, meaningful interruption, new decision-relevant target/UI, or bounded failure. While a routine is progressing, poll locally and do not call a model. Sol handles initial strategy, explicit escalation, and repeated meaningful failure; no periodic empty planning calls.
- Preserve Rowan's identity, memory, task, failure summary, and plan through worker replacement. Cancel active physical execution across scene/bridge/driver changes and obtain fresh observations before resuming. Preserve subscription-only billing and the verified game-pause path on usage exhaustion.

## Three delegated workstreams

1. **Native bridge:** port legacy player observation and input modules, adapt modern host wiring, provide tracked installation and provenance, and test imports, coordinates, target freshness, and normal input-hook dispatch.
2. **Body and verified execution:** port the legacy Body and required map/navigation/exploration modules; add bounded model-free intent execution with progress and terminal receipts, cancellation, leases, and known doorway/combat regressions.
3. **Integration and efficiency:** expose native observation/intent/status endpoints in the existing driver, wire the worker to event-driven native intents, keep UI authority serialized, and extend reports with verified outcomes and tokens/calls per outcome.

The shared integration interface is fixed in `NATIVE-CONTROL-CONTRACT.md`. The lead owns shared-contract changes, cross-stream integration review, and acceptance reporting.

## Acceptance checks

- Existing tests stay green. Add focused tests for the ported code and changed behavior; reuse relevant old regressions rather than recreating their coverage.
- A fake native bridge demonstrates one model-chosen intent continuing through multiple local ticks with zero additional model calls.
- Verify exact turning, arrival tolerance, blocked motion despite changing lighting/camera, stale scene/target rejection, interrupted damage/UI, ordinary interaction with no visible effect, and attack dispatch without a falsely inferred kill.
- Verify stop, lease expiry, cancellation, worker replacement, and Body replacement release all held inputs and retire the previous timer. Old replies cannot operate a new frame or generation.
- Verify native/broker modules install and resolve against the pinned engine. A missing or incompatible bridge produces a clear unavailable outcome, never a success or silent browser fallback.
- Efficiency tests use recorded/fake observations and a counted model adapter: one call initiates a continuing routine; a terminal outcome permits the next call; unchanged progress does not. Separate developer-agent usage from playing-role telemetry; cached tokens are a subset of input, not added twice.
- Produce a model-free benchmark command for turn, movement/block, interaction, threat/retreat, UI interruption, and hot replacement. Mark unrun live checks as pending. Do not restart the game or launch a paid gameplay trial during this porting task.

## Completion report

Report reused versus newly written components, commits, tests, benchmark results, pending live checks, and remaining limitations. A passing unit suite establishes implementation checks, not reliable gameplay or a successful one-hour trial.

## Implementation result

All three workstreams were assigned to Terra 6.1 agents and implemented in the isolated project. Their provenance and limitations are recorded in `NATIVE-BRIDGE.md`, `BODY-PORT.md`, and `NATIVE-INTEGRATION.md`. The lead reviewed integration and required stable moving-foe identities, a per-tick selected-target/health guard, stop-latch serialization, and safe managed bridge upgrades.

The full model-free suite passed 121 tests; the focused native benchmark passed 83 of those tests. These are overlapping checks, not 204 independent tests. Static engine bundling and bridge imports passed. The localhost game/control/debugging ports remained closed; no gameplay or model trial was restarted.

Pending: actual native movement/turning accuracy and timing in the game, doorway and low-rat combat checks, native worker/driver hot repair on a running page, end-to-end HTTP concurrency, UI workflows for equipment/commerce/magic/quests, online operation, and a full one-hour trial. Calls/tokens saved in real play remain unmeasured. The fake model adapter proves that an accepted routine continues through local polls without additional model calls; it does not establish useful-play efficiency.
