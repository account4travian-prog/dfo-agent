# Parallel implementation paths

Baseline: `45b5299` (131 model-free tests; 92 overlapping controller checks). No new live game/trial is authorized by this split. Both paths use `PARALLEL-RUNTIME-CONTRACT.md` as their integration boundary. The existing two-tier runtime remains the baseline until reconciliation.

## Path A: Codex/Sol - reliable control and skills

Work in the primary checkout: `%USERPROFILE%\Documents\DFO\DFO-TerraSol`.

Own `src/browser.mjs`, `src/native-bridge.mjs`, `src/body-runtime.mjs`, `src/intent-executor.mjs`, new control/skill/observation modules, `vendor/native-agent/**`, `vendor/legacy-agent/**`, `tools/native-benchmark.mjs`, new zero-model smoke tooling, and associated controller/bridge/HTTP/skill tests. Preserve existing browser exports used by other tests.

Deliver:

1. Coherent observation basis and capabilities, typed stable observed targets, relocation invalidation, request IDs/idempotency, fenced polling/cancellation and bounded failure cleanup.
2. Reliable bounded combat/retreat and doorway/navigation behavior, occlusion/target-selection hysteresis within explicitly model-authorized policy, and evidence-producing terminals. Missing foes alone never establish a kill or clear area.
3. Actual HTTP-level fault/concurrency checks with a fake injected driver; recorded skill regressions; a prepared zero-model live smoke command that is not run during this work.
4. A path-A completion note covering tests, capability changes, pending live checks and replayable failures. Do not claim universal normal-player capability from generic controls.

Do not edit the Path B files below. Request a shared-contract change explicitly if needed.

## Path B: DeepSeek - three-tier mind and efficiency

Use the separate worktree `%USERPROFILE%\Documents\DFO\DFO-TerraSol-DeepSeek`, branch `deepseek/mind-runtime`.

Own `src/main.mjs`, `src/models.mjs`, `src/brain.mjs`, `src/protocol.mjs`, `src/memory.mjs`, `src/report.mjs`, `src/dashboard.mjs`, new plan/scheduler/budget/context/model-routing modules, `tools/reload.mjs`, and corresponding model/runtime/protocol/memory/report/dashboard tests. Path B may update `test/native-integration.test.mjs` while retaining compatibility with the browser exports; request new controller exports through the contract rather than editing Path A.

Deliver:

1. One event scheduler/blackboard with typed versioned plans, basis-bound requests/replies, queued/coalesced escalations, cooldowns, stale-reply rejection and clear unavailable-tier behavior.
2. Luna chooses short-term tactics/intentions; Terra 6.1 owns medium-term/session planning; Sol 6.1 handles difficult decisions, post-session review and engineering handoffs. No independent always-running model loops; local execution needs no per-keypress model calls. Keep engineering code execution outside the playing process.
3. Configurable role/model routing, compact per-tier contexts, selective images/handbook retrieval, historical-log compatibility and explicit per-tier usage/latency. Keep authentication subscription-only; do not introduce API billing fallback. Confirm the Luna model identifier from local availability without spending model calls, or leave its configuration explicitly required.
4. A budget governor with configured limits/reserves and pause/hold behavior. Token caps are engineering limits, not an asserted conversion to subscription allowance. Never auto-resume after exhaustion or operator stop.
5. Source/vendor-aware revision archives and stated hot-swap classes. Worker/driver/Body changes can preserve the page; bridge/engine changes currently require a suitable reload. Preserve durable persona/memory and plan checkpoints.
6. A fake-driver/fake-model scenario demonstrating multiple local execution polls with no additional model call, stale plan rejection, escalation coalescing, bounded failure recovery and budget-triggered pause. Report evidence and unknowns honestly.

Do not edit Path A files, shared contract, README, package/config files, earlier checkpoint/review documents, source assets, runtime `data/` or original DFO projects. Add path-B documentation under `docs/path-b/` and tests for owned modules. Dependencies should use built-in Node modules where practical. If a shared file must change, record the requested change instead of changing it in parallel.

## Reconciliation

1. Both paths commit only their owned files. DeepSeek must not cherry-pick/merge Path A or modify the primary checkout. Supply its branch/commit IDs and a path-B handoff; no publication/push.
2. Codex reviews both diffs, resolves shared-contract requests, then merges the DeepSeek branch into the primary checkout. Do not use force/reset/stash/clean or overwrite unrelated edits.
3. Check capability negotiation and add cross-path fake-driver integration checks: plan/version basis -> observation -> one accepted request -> local progress -> evidence terminal -> next scheduled tier decision. Include stop, scene change, cleanup failure and budget exhaustion.
4. Run the entire suite, compare evidence/metric semantics, then create a reconciled checkpoint and Git bundle. Keep both paths' test counts separate from the union count.
5. Live smoke, capped model comparison and the hour trial remain subsequent work after the user resumes gameplay. No benchmark savings or live success may be inferred from fake tests.

Status: both implementation paths committed and merged locally. Path B was delivered in the separate DeepSeek worktree; Codex read and merged its handoff branch. See `RECONCILIATION-2026-10-28.md` for cross-path repairs, 172-test union results and pending capabilities/live checks. No game or model trial was started.
