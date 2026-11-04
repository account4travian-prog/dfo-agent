# Reconciled control and three-tier mind

Date: 2026-10-28, America/Chicago. Shared baseline `3ccabd5`; Path A implementation `f387632`; Path B tip `0ab73c7`, merged locally without conflicts. No game, live smoke, playing-model call or hour trial was started. The original DFO projects and DeepSeek worktree remain intact.

## Integrated behavior

The browser driver now implements the `dfo-control.v1` capability/snapshot/request-fencing boundary consumed by the mind runtime. Luna chooses delegated tactical intentions, Terra creates versioned medium-term plans, and Sol handles exceptional strategy/review and engineering proposals. One scheduler and one physical executor own their respective decisions; local skill polls need no model call. The exact Luna model remains an explicitly required configuration, with no silent substitution.

Both workstream handoffs remain evidence of their independent scope: `path-a/HANDOFF.md` and `path-b/HANDOFF.md`. Capability, snapshot, request/authority, cancellation, cleanup and operator-latch requests in Path B's contract note are implemented by Path A. Rich kill/quest/item/save evidence remains open; current evidence does not establish those outcomes.

## Boundary defects fixed during reconciliation

- Ground destinations are not treated as captured actor objects. Actual observed actor targets still undergo captured-object and fresh-handle acceptance checks.
- Dispatch rejection now enters the scheduler's bounded failure/reassessment path instead of bypassing its error handler.
- Local exploration deadlines match the controller's 90-second exploration default.
- Worker checkpoints receive the full executable plan, including arguments, schema, basis, version and step states. Dashboard/context summaries are not used as recovery plans.
- Session budget counters survive worker replacement. An explicit supervisor/operator resume can clear a budget pause latch, but cannot reset accumulated counters or bypass a reached session cap. Failed model attempts count toward call caps; token usage for failed/unreported attempts is explicitly unknown.
- Sol strategy notes are included in later tier context; completed control tasks in review context are labeled as control completions, not useful gameplay.

## Verification

Path A's independent suite: **144 pass**. Path B added **23 tests**. The first merged union was **167 pass**. Five reconciliation checks bring the final union to **172 pass**, no failures/skips. The expanded overlapping controller benchmark is **104 pass**. Counts overlap; do not add the benchmark to the union.

Cross-path tests run the actual HTTP service/router from Path A with injected game adapters and the actual Path B scheduler/client with fake models. They demonstrate: one Terra decision executing two steps across four HTTP polls; no automatic images for native decisions; full plan checkpoint fidelity; budget hold before dispatch; hung polling becoming an unverified-cleanup hold; persistent cap counters and failed-attempt accounting. Other workstream tests cover scene/observation staleness, selected actors, cancel races, budget/usage holds, unavailable tiers and review routing.

Commands: `node --test test/*.test.mjs`; `node tools/native-benchmark.mjs`. `node tools/native-smoke.mjs --case turn` was run in dry-run mode only. No CDP/native rendering or live survival claims follow from these tests.

## Remaining work before a normal-player trial

1. Confirm and configure the exact locally available Luna identifier and model allowlist. No model availability/latency call has been spent to guess it. Configure explicit session call/token caps; these are engineering caps, not a subscription allowance conversion.
2. Integrate validated world-startup/loading/character/UI workflows. The new worker currently holds if the native world is unavailable; legacy browser control remains explicit.
3. Improve session continuation: completing a plan currently requests the configured Sol review and holds as session-complete. Creating the next session plan after that boundary is not yet an autonomous whole-hour play loop.
4. Add grounded combat/quest/item/save outcome producers and broader normal-player skills. A disappearing foe, dispatched swing or generic window still does not establish success.
5. When the user resumes gameplay, run the prepared short zero-model native smoke first, then a capped comparison with frozen code, then the hour trial. Measure actual latency, tokens, interventions and useful outcomes. Exercise worker/driver/Body hot replacement in that live drill; bridge/engine source changes still need a suitable reload.

The implementation packages and their interface reconciliation are complete for model-free verification. The overall goal of reliable autonomous normal-player behavior is not complete or live-validated.

Checkpoint tag: `checkpoint/2026-10-28-reconciled-runtime`. Local recovery bundle: `data/checkpoints/2026-10-28-reconciled-runtime/source-history.bundle`. Runtime saves/memory/logs remain in the project's ignored data folder; the bundle stores source history, not a duplicate browser profile.
