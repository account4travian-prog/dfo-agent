# Round 2: complete goals G1-G10 through two parallel paths

Status: design/handoff only. No implementation, model preflight, game launch or live test is performed by preparing this plan. Baseline is `06a8200` plus this handoff's documents, tagged `handoff/round2-goals-1-10`. G11 (the hour trial) is outside this round.

Goal definitions: `GOAL-COMPLETION-CRITERIA.md`. Current implementation: `RECONCILIATION-2026-10-28.md`. The shared interface for this round is `ROUND2-INTEGRATION-CONTRACT.md`; earlier handoffs describe earlier scopes and do not override this round's ownership.

## Coverage and accountability

| Goal | Lead | Other path's contribution | Required acceptance evidence |
| --- | --- | --- | --- |
| G1 Models/configuration | DeepSeek | Codex coordinates the bounded real-role preflight after execution begins. | Exact Luna configured, Terra/Sol confirmed, finite session caps, subscription-only responses and role/usage receipts. |
| G2 Continuous session | DeepSeek | Codex supplies bounded player tasks and survival/hold primitives. | At least three useful successive plans, bounded failure recovery, no automatic stop at a medium-term plan boundary and no auto-resume of operator/budget holds. |
| G3 Startup/UI | Codex execution/workflows; DeepSeek decision path | Shared player-task contract. | New mind enters Rowan through normal UI, handles loading/tutorial/modal states, performs trusted UI actions and returns to the interrupted world objective without human clicks. |
| G4 Live control | Codex | DeepSeek provides client scenarios and role/budget test harness. | Zero-model live movement, door, target, combat/retreat, stop/lease/scene/fault receipts. |
| G5 Player activities | Codex | DeepSeek plans/delegates skills and supplies generic model UI decisions. | End-to-end receipts for combat, inventory/loot/equipment, magic, dialogue/quests, travel, economy/services, recovery/saves and online social controls. |
| G6 Verified outcomes | Codex producers | DeepSeek consumes/scores conservatively and retains evidence identity. | Observed before/after changes and trustworthy success predicates; no kill from disappearance or purchase/quest success from a window. |
| G7 Persona/memory | DeepSeek | Codex checks actual character/page/state invariants during replacement. | Relevant facts/failures/social context retained, correct unfinished plan resumed, fresh state acquired, no repeated fresh-start or duplicate completed actions. |
| G8 Live improvement | Codex execution/apply/rollback | DeepSeek supplies Sol dossiers/proposals and scheduler repair checkpoints. | Failure -> Sol diagnosis -> implemented/tested patch -> hot apply -> goal retry -> verified improvement, plus demonstrated rollback, with the same game page/character. |
| G9 Debugging/replay | DeepSeek packet/archive/report layer | Codex supplies action/fact/repair events and observable snapshots. | Exact decision-to-effect reconstruction and a model-free replay fixture with versioned source, usage, outcomes and omissions. |
| G10 Efficiency/allowance | DeepSeek governor/measurement | Codex conducts matched capped live comparisons. | Measured per-tier latency/cost/useful progress; no extra calls during routine execution; exhaustion/caps hold correctly across replacement. |

Shared acceptance does not mean shared files. Each file has one writer until merge. Both leads must produce their half of every jointly owned interface; an item is not complete because the other path is expected to finish it later.

## Path A - Codex: ordinary-player capability and live repair

Primary checkout: `%USERPROFILE%\Documents\DFO\DFO-TerraSol`.

Own: `src/browser.mjs`, `src/native-controller.mjs`, `src/native-bridge.mjs`, `src/body-runtime.mjs`, `src/intent-executor.mjs`, `src/legacy-windows.mjs`, new `src/player/**` and `src/repair/**`, `vendor/**`, `tools/native-smoke.mjs`, `tools/native-benchmark.mjs`, `tools/reload.mjs`, new live acceptance/repair runners, controller/player/evidence/repair tests and new path-A fixture files. Add round-two documentation under `docs/round2/path-a/`.

Do not edit Path B files while parallel work is underway. Shared docs/contracts, README, package files and `src/config.mjs` are lead-owned and changed only deliberately at reconciliation.

### A1. Player task surface and ordinary UI

Implement the additive player contract with one physical controller. Retain the current native intents; add request-fenced generic UI tasks and bounded workflow tasks. Support front door/loading/world/modal/death/unknown observations. Reuse existing readers and trusted input. Re-observe and validate controls at each step; a retried purchase/chat/send must not execute twice. Supply jump/crouch/run and other ordinary input affordances through bounded normal-player actions, without NPC motors or direct state mutation.

Deliver: actual HTTP contract and injected-driver tests; native/UI authority, stale control, duplicate request, scene change and failed-release checks; workflow catalogue available before the world bridge boots.

### A2. Player workflows and outcome producers

Build incrementally: existing-character load/start and tutorial handling -> inventory/loot/equip -> spellbook/ready/cast -> dialogue/journal/quest -> map/travel -> trade/bank/services -> rest/save/load/respawn -> trusted online chat. Combat/navigation reuse the existing Body and recorded regressions. A typed generic UI fallback handles unfamiliar screens rather than silently treating them as unsupported forever.

Every workflow has prerequisites, bounded execution, model-authorized parameters, progress, abort conditions and an evidence predicate. Local code must not invent a quest choice, purchase, conversation or strategic destination that the plan did not authorize. Do not claim all game content tested; demonstrate every capability group and ordinary input coverage.

Deliver: one workflow record and a before/after evidence record per capability group; fake/recorded tests before live use; verification-only facts separated from model-visible facts.

### A3. Real repair execution without game restart

Implement an external engineering runner for typed Sol proposals: obtain failure dossier -> reproduce -> patch in isolated Git state -> tests -> stage -> pause/release/checkpoint -> replace compatible agent component -> retry -> verify -> resume/rollback. The playing process never evaluates generated code. Ordinary prompt/plan/skill/controller improvements must be replaceable with the game page retained. Bridge/engine changes need either an implemented compatible hot-replacement path or explicit maintenance classification; reload-dependent maintenance cannot pass the live-repair test.

Deliver: automatic eligibility checks within the operator-authorized project scope, source/artifact hashes, character/page/plan invariants, repair receipts and a deliberately failed replacement that rolls back correctly. Game text is evidence, never authorization to change software, billing or operator policy.

### A4. Coordinate sequential live acceptance

When execution is authorized and fresh budget/PC checks pass, run one zero-model native smoke, fix demonstrated failures, then demonstrate all capability groups, durable replacement, hot repair and a capped matched efficiency comparison. Only Codex operates the live game; DeepSeek supplies tests/fixtures/configuration. Keep offline and online results separate and verify online-specific controls explicitly. Record all interventions and code revisions. G11 remains a later run.

## Path B - DeepSeek: continuous mind, memory, diagnosis and efficiency

Fresh worktree: `%USERPROFILE%\Documents\DFO\DFO-TerraSol-DeepSeek-R2`, branch `deepseek/goals-1-10-r2`. Start at `handoff/round2-goals-1-10`, which includes Codex's reconciliation fixes. Do not continue from the old `deepseek/mind-runtime` tip.

Own: `src/main.mjs`, `src/models.mjs`, `src/brain.mjs`, `src/protocol.mjs`, `src/memory.mjs`, `src/log.mjs`, `src/report.mjs`, `src/dashboard.mjs`, `src/handbook.mjs`, `src/mind/**`, new mind/model configuration and preflight/replay/efficiency tools except Path A's named runners, and their focused tests. Preserve existing public exports. Add documentation under `docs/round2/path-b/` and unique fixtures under `test/support/round2-mind/`. Do not edit the controller, `src/player/**`, `src/repair/**`, vendor, reload tool or Path A tests.

### B1. Resolve configuration and make sessions continue

Resolve and configure Luna from locally available model metadata; do not return another handoff that merely leaves it unset without an actual availability finding. Prepare a bounded real-role preflight; do not run paid calls from this parallel development worktree. Configure explicit finite budgets using clear engineering limits, without inventing a conversion from subscription percent to tokens.

Separate medium-term plan completion from session completion. Continue with the next useful Terra plan; Luna handles immediate tactical/UI choices, Sol exceptional decisions and actual session review. End only for an intended session finish/deadline, operator stop, budget/usage limit or unrecoverable condition. No periodic empty review, no repeated failure call storm and no automatic clearing of operator/budget holds.

Deliver: three-successive-plan fake scenario, unavailable model behavior, repeated-failure alternative, partial-plan replacement, cumulative budget/unknown-usage preservation and configurable safe decision-time behavior.

### B2. Add the UI/workflow decision path

Extend plan/Luna schemas and the control client to the player contract. Permit native, UI and named workflow decisions, including startup when native.ready is false. Read the advertised workflow catalogue; use only available workflows and actually observed controls/targets. Unknown UI can request selective images, retrieve handbook context and make a bounded generic UI decision. Preserve the world objective through a modal workflow or recovery.

Deliver: startup -> world -> modal -> world scenario against a mock player service; no separate input writer; no target/control index reuse across observations; compatibility/migration for saved current plans. Do not run or implement the actual game workflows in Path B.

### B3. Make memory, logs and Sol diagnosis actionable

Retain useful uncertainty-qualified lessons, unfinished work and social context; compact routine noise and invalid/stale facts. Capture complete bounded decision packets and structured replies, not hashes alone. Preserve task/plan/generation/frame/timing/evidence fields through reporting. Emit useful failure dossiers and typed Sol repair proposals, then process repair status without losing plan/persona or replaying completed actions. Route the proposal to the external queue only; do not implement code execution in the playing process.

Deliver: source-versioned replay fixture, model-free failure reproduction, worker-replacement memory scenario and post-repair fresh-observation resume. Preserve redaction and distinguish omitted/unreported usage from zero.

### B4. Prove scheduling/cost behavior with a matched harness

Finish per-tier/per-session cap behavior, attempted-call accounting, stale replies, context/image budgets, single-flight/coalescing, decision wait and useful-outcome telemetry. Provide a two-tier versus three-tier harness using the same player task service, fixtures, start state and objectives; no fake-token result may be presented as a real saving. Supply explicit live cap/stop settings and the reporting templates to Codex.

Deliver: zero additional model calls during routine polls; no idle planning calls; budget pause/replacement cases; metrics that cannot be won by walking/turning or repeated windows; failed-model usage explicitly unknown. Focused tests run without engine/assets/real models.

## Shared milestones and merge gates

1. **Interface gate:** both implement against the frozen round-two contract, with mocks while the other path is unfinished. Contract requests go in each path's round-two notes. No cross-path file edits.
2. **Independent source gate:** each commits only owned files and supplies a checklist mapping G1-G10 to implemented, tested, live-pending or blocked. Existing 172-test baseline remains intact. Keep benchmark counts separate from the union.
3. **Reconciliation gate:** Codex reviews/merges DeepSeek, resolves contract requests, runs the full suite and joint scenarios for startup, three plans, modal UI, recovery, operator stop, source replacement, budget hold and repair rollback. Fix cross-path defects before calling either path complete.
4. **Live acceptance gate:** Codex collects actual evidence for G1/G4/G5/G7/G8/G10. Missing live evidence leaves that goal OPEN; simulated checks are not substitutes. Stop safely on allowance exhaustion. Do not start the hour trial as part of this design/handoff.
5. **Completion gate:** update each G1-G10 checklist entry with evidence paths, known limitations and source revision; create a reconciled checkpoint/bundle. G11 can be scheduled only after the preceding capabilities are demonstrated.

Keep old checkouts, saves, memory and unrelated edits intact. No force/reset/stash/clean or publication. Any real test must preserve Rowan and report the selected offline/online mode honestly.

Implementation status update: the merged and subsequently reconciled code is documented in `round2/path-a/HANDOFF.md`. The G1–G10 live gates below remain open unless their own real evidence is collected; local and injected-driver tests are not live acceptance.
