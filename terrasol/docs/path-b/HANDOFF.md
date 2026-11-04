# Path B handoff: three-tier mind runtime

- **Branch:** `deepseek/mind-runtime`
- **Base:** `3ccabd5` (shared parallel-work handoff)
- **Path B implementation commit:** `ac69739e9a63af69a301be8339b3107d8019f81a`
- **Path B tests commit:** `9a048926e0c87fa1878695f9dd8db074e36a6ddd`
- **Path B cancellation/abort fix:** `c0ba7c324182f253469a562987fed094858e6533`
- **Documentation commit:** the tip of `deepseek/mind-runtime` after this file; inspect with `git log --oneline deepseek/mind-runtime`.
- **Scope:** model-free implementation only. No browser, game, native driver, paid model, network, live trial, push or primary-checkout edit was performed.

## 1. What was implemented

One event scheduler/blackboard replaces the old per-decision loop for native control. It owns:

- **Typed, versioned plans** (`src/mind/plan.mjs`, `PLAN_SCHEMA='dfo-plan.v1'`): goal, ordered legacy-intent steps or bounded `tactical` steps, `planId`, monotonic `version`, `baseVersion` on every update, observation/page/generation/frame basis, TTL, reassess events, step states, and next-step selection.
- **Basis-bound tier requests/replies** (`src/mind/scheduler.mjs`): each request captures `observationId`, `pageId`, `generation`, `frame`, `planVersion`, start time and role TTL. A reply is applied only if the basis still matches; mismatches are logged as `tier-reply-rejected` and archived, never applied to a new task or plan.
- **Role routing** (`src/mind/router.mjs`, `src/mind/config.mjs`): Luna, Terra and Sol each have an explicit model, effort, timeout, decision TTL, cooldown, window call cap, context byte cap and image policy. A role with no configured model is unavailable. There is no model substitution, no silent Luna identifier, and no API-billing fallback.
- **Event scheduling** (`src/mind/scheduler.mjs`): local execution is primary. One Terra call can authorize a multi-step plan; each step dispatches one request-fenced intent and is polled locally. Luna is called only for a `tactical` plan step (or is replaced by that step's declared fallback/locally bounded failure path), never per keypress. Sol is called for difficult strategy/escalation or the post-session review, not for routine play.
- **Escalation queue/coalescing/cooldowns:** event-triggered Terra requests are queued and coalesced by reason; a request already in flight is never duplicated; critical plan/failure requests bypass the cooldown but still respect the single-flight rule and budget. Damage/UI/scene/chat events are recorded and only wake a tier when the plan declares that reassessment event or a bounded failure rule fires.
- **Bounded failure recovery:** one local retry by default, then a Terra reassessment; repeated failure, missing plan, stale scene, unavailable tier, budget exhaustion, operator stop and unverified cleanup all end in an explicit pause/hold state rather than a spin.
- **Budget governor** (`src/mind/budget.mjs`): explicit global/per-tier token/call/output caps (no guessed subscription conversion), cached input treated as a subset of input, per-role/session counters, and a pause latch. Exhaustion and usage-limit errors pause; only `resume({operator:true})` can clear a pause. The worker writes `paused-budget`, releases with `/stop`, pauses the game and exits non-zero for the supervisor to hold.
- **Compact per-tier context** (`src/mind/context.mjs`): no raw scan/view dump; one typed target list instead of duplicated foes; memory retrieval filtered/deduplicated; persona preserved; plan/step and last outcome included; images only under the role policy and explicit UI/ambiguity flag; handbook passages only when requested/cached; hard byte cap with deterministic reduction.
- **Historical telemetry/report compatibility** (`src/report.mjs`): old `terra`/`sol` records still count as legacy pilot/planner; new records carry role/schema/model/request ID/plan version. Per-role request/response/timing/usage, plan updates/rejections, stale replies, tier unavailability, escalations, pauses and control errors are reported. Cached input is not double-counted; engineering usage remains `unavailable`, not zero. Metric v2 transition logic is preserved.
- **Luna identifier policy:** `DFO_LUNA_MODEL` (or a config file) is required. If it is absent, the role is unavailable and a tactical step without a fallback holds. No identifier is invented or confirmed by a paid/model call; `models.mjs` also requires the identifier to be in its local allowlist (`DFO_ALLOWED_MODELS`).
- **Revision archives** (`src/mind/revision.mjs`, `tools/reload.mjs`, both workers): archives now cover `src/`, `test/`, `vendor/` and `tools/`, with per-file SHA-256, hot-swap classes, rollback instructions and inclusive vendor hashes. Worker/driver/Body can preserve the page; bridge/engine changes require a suitable page/session reload (stated, not promised as live).
- **Worker integration** (`src/main.mjs`): `--control native` uses the new runtime by default and fails closed/holds when `dfo-control.v1` capabilities are absent. `DFO_MIND_LEGACY=1` selects the previous worker; browser diagnostic mode still uses the previous loop. Existing public exports (`movementAction`, `cycleMatches`, `addUsage`, `runNativeIntent`) and historical log parsing are preserved. Plan/memory continuation is written to `continuation.json`; status gains Luna/Terra/Sol counts, budget and plan fields for the dashboard.
- **Dashboard** shows plan version/status, L/T/S calls, budget/input/call totals and the pause/hold reason without new endpoints.

## 2. Fake end-to-end scenario (how to run)

```powershell
cd %USERPROFILE%\Documents\DFO\DFO-TerraSol-DeepSeek
node --test --test-isolation=none test/mind-scheduler.test.mjs
node --test --test-isolation=none test/mind-foundations.test.mjs
node --test --test-isolation=none test/mind-report.test.mjs
```

`test/support/fake-control.mjs` implements the frozen `dfo-control.v1` HTTP shape (health capabilities, coherent snapshots, request-fenced intents, request-specific polls/cancel) and a fake model transport. `test/mind-scheduler.test.mjs` demonstrates:

1. one Terra decision executes two local steps across three driver polls with **no additional model call**;
2. Luna choosing inside a Terra-delegated tactical step (and the fallback when Luna is unavailable);
3. a saved plan continuing across a worker epoch with **zero** model calls;
4. plan-complete review delegated to Sol instead of a periodic Terra call;
5. escalation coalescing for two damage events (one queued Terra escalation);
6. one local retry after failure, then escalation;
7. budget exhaustion pausing with no auto-resume;
8. operator stop cancelling the active task with no auto-resume;
9. unverified cleanup blocking new execution;
10. a baseline driver failing closed before any model call;
11. staleness rejection for generation/observation/plan-version/TTL mismatches.

**Sandbox note:** the DSH Windows sandbox denies the Node test runner's child-process pipes (`spawn EPERM`) and `test/native-bridge.test.mjs` additionally calls `spawnSync git`. In this worktree the per-file runner was used (`node --test --test-isolation=none <file>`). All 23 new Path B tests pass. The per-file suite result (including these 23) was 150 pass / 4 fail; all 4 failures were in `native-bridge.test.mjs` from the sandbox's denied `git` spawn, and that file passed in the normal environment before this work. Run `node --test test/*.test.mjs` in a normal shell/primary checkout for the union result. This is **not** a live or native-play test.

## 3. Configuration

The worker reads `DFO_MIND_CONFIG` (JSON path) and then environment overrides. Example:

```json
{
  "schemaVersion": "dfo-mind.v1",
  "roles": {
    "luna":  { "enabled": true, "model": "<exact locally available Luna identifier>", "images": "ui", "cooldownMs": 1000 },
    "terra": { "enabled": true, "model": "gpt-6.1-terra", "images": "ui", "cooldownMs": 15000 },
    "sol":   { "enabled": true, "model": "gpt-6.1-sol",   "images": "never", "cooldownMs": 120000 }
  },
  "models": { "allowlist": ["<exact Luna identifier>", "gpt-6.1-terra", "gpt-6.1-sol"] },
  "budget": { "maxInputTokens": 200000, "maxCalls": 80, "tiers": {} },
  "scheduler": { "pollIntervalMs": 250, "localRetries": 1, "failureThreshold": 2, "planTtlMs": 180000 }
}
```

Environment shortcuts: `DFO_LUNA_MODEL`, `DFO_TERRA_MODEL`, `DFO_SOL_MODEL`, `DFO_ALLOWED_MODELS`, `DFO_MIND_MAX_INPUT_TOKENS`, `DFO_MIND_MAX_CALLS`, `DFO_MIND_CONFIG`.

The numeric defaults (15s/30s/120s cooldowns, 180s plan TTL, byte caps, retry counts) are engineering starting points, not measured optima. Reserves/shares are not invented; per-tier limits are only used when configured.

## 4. Contract requests (see `CONTRACT-REQUESTS.md`)

Path B depends only on the external `dfo-control.v1` interface and existing public exports. No shared contract file was edited. The main requests to Path A are the exact `/health` capability keys, `/snapshot` shape/coherence, request/authority echo and lifecycle, `cleanupPending`, and Task `evidence` classes. If Path A chooses different capability names, the adapter tolerates `fencing`/`image`/`ui.supported` aliases but fails closed rather than guessing.

## 5. Deferred work / limitations

- **No live/native evidence.** Fake driver/model only. Real native movement, combat, driver HTTP concurrency, latency and token savings remain for the reconciled live smoke.
- **Startup/UI skills.** The new runtime holds when the native world is not ready. Character creation, loading screens and complex UI workflows still need the legacy/browser path or Path A skill endpoints; the scheduler deliberately does not implement a second input controller.
- **Capability gate means the current primary driver holds.** The baseline driver does not advertise `dfo-control.v1`; the new worker will log `mind-control-unavailable` and hold until Path A supplies it (or `DFO_MIND_LEGACY=1` is used).
- **Bridge/engine hot updates are not session-preserving.** Only worker/driver/Body-layer changes are; vendored bridge/engine changes need a page/session reload. Revision archives now include vendor hashes so a rollback is reproducible.
- **Plan/resume semantics.** A completed plan pauses `session-complete`; an operator resume will currently see the completed plan and pause again. Post-session review/next-session plan creation is deferred. A budget pause requires an operator resume; there is no auto-recovery.
- **Cooldowns/TTLs/reserve numbers are unmeasured engineering defaults.** They should be tuned from live latency/context data, not treated as savings.
- **Report evidence is still conservative.** It counts only metric-v2 movement/separation/place transitions; kill/quest/item/save evidence needs Path A evidence producers before it can be scored.
- **No `reload.mjs` live drill.** The revision helper is unit-tested; the operator reload workflow was not run (it needs live control ports and a held session).
- **No `DFO_MIND_LEGACY` removal.** The old browser loop is retained for diagnostics/reconciliation; it is not replaced silently.

## 6. Reconciliation instructions for Codex

1. Fetch/merge `deepseek/mind-runtime` into the primary checkout; do not rewrite the primary working tree or force anything. Path B commits only the files listed above.
2. Resolve `src/main.mjs` around the worker dispatch and the shared `src/protocol.mjs`/`src/report.mjs` changes first. Keep Path A's browser/native/executor/vendor files untouched by Path B.
3. Implement `dfo-control.v1` in Path A: `/health` contract/capabilities, `/snapshot`, request IDs/authority/`cleanupPending`, request-specific poll/cancel, evidence classes. The Path B adapter is at `src/mind/control-client.mjs`.
4. Add the cross-path fake-driver integration check from `PARALLEL-WORK-PLAN.md`: plan/version basis -> observation -> one accepted request -> local progress -> evidence terminal -> next tier decision, including stop, scene change, cleanup failure and budget exhaustion.
5. Run the full suite in a normal shell (including `test/native-bridge.test.mjs` and the engine-dependent checks) and keep Path A and Path B test counts separate from the union. Re-run `node tools/native-benchmark.mjs` from the primary checkout.
6. Keep `DFO_MIND_LEGACY=1` as an explicit fallback until the capability-gated native path has live smoke evidence. Do not start a live trial from this handoff; the user must resume gameplay, and the first live step should be a zero-model native smoke with code frozen.
7. If the merged worker needs a shared export or capability name not in `CONTRACT-REQUESTS.md`, record it in that file and update the adapter deliberately; do not silently reinterpret an interaction.

## 7. Pending live checks (not performed)

- Capability handshake against the real driver and a coherent snapshot with real UI/native state.
- One real intent across multiple HTTP polls with no model call; cancel/stop/lease release; scene change mid-intent.
- Luna identifier availability and actual per-call latency/context; Terra/Sol latency under the subscription path.
- Budget pause -> game pause -> operator hold/resume with memory/plan continuity.
- Worker/driver reload with page preservation; bridge/engine reload boundary.
- Short zero-model native control smoke, then a capped model comparison and only then an hour trial (per the independent review sequence).
