# Independent review: DFO three-tier agent (Luna / Terra / Sol)

- **Date:** 2026-10-28 (America/Chicago)
- **Basis:** working tree at HEAD `6ad493984c0f03ca5440aa6a8c6f8cfda8a1edbd`; `docs/`, `src/`, `vendor/`, `test/`, `tools/` and `data/runs/2026-10-27T09-31-49-338Z/` as inspected that day.
- **Review type:** independent systems review. No game was launched, no paid model was invoked, no network was used, and no existing project file was modified during the review. This document is the review deliverable.
- **Purpose:** evidence-bearing critique and design proposal for Sol. Treat findings as proposals tied to the cited evidence, not as descriptions of deployed behavior. Re-verify line numbers and test state against the tree before acting.
- **Status labels used:** **C** = confirmed from code or trace; **H** = mechanism confirmed, live rate/frequency unmeasured; **G** = live-test gap (no data exists).

Paths are relative to the project root (`DFO-TerraSol`).

---

## 0. Scope, evidence, and the main verdict

**Inspected:** the seven requested docs plus `CHECKPOINT-2026-10-28.md`, `CAPABILITIES.md`, `REUSE.md`; current `src/main.mjs`, `brain.mjs`, `browser.mjs`, `intent-executor.mjs`, `body-runtime.mjs`, `native-bridge.mjs`, `protocol.mjs`, `models.mjs`, `memory.mjs`, `report.mjs`, `control.mjs`, `config.mjs`, `role-instructions.md`, `tools/reload.mjs`, `tools/native-benchmark.mjs`; relevant vendored Body/Autopilot/scan/bridge seams; the test list and composition; the trial summary, epoch sources, and traces. I did not launch the game, inspect the full engine, or evaluate an unselected Luna model.

Two facts reframe the brief before any design discussion:

1. **The 21-minute trial did not exercise the native executor.** Its traces contain zero `intent-start`/`intent-outcome` events; the archived epoch-1 `main.mjs` has no native path; and `main.mjs`, `browser.mjs`, `brain.mjs` and `models.mjs` changed across epochs (6/3/4 changed files at epoch-2/3/4 starts). The 176 Terra / 9 Sol / 2.2M-token figures describe the superseded browser-action loop. Nothing about native-play token savings has been measured.
2. **The trial produced zero verified terminal outcomes.** 167 dispatch receipts, 176 observations, no kill, no zone exit, no quest step, no confirmed save. Model time was ~73% of wall (Terra alone 933.6s of 1,278s), and 37% of actions were `look` calls. This was not a weak-model problem; it was an architecture that pays a full model round trip for every micro-action and then measures receipts instead of play.

**Verdict.** Three *decision horizons* are defensible. The proposed three *model loops* are not yet justified and will probably make cost worse: with the current Codex-subprocess transport every call has a ~3.6s / ~5k-token fixed floor, so a "fast Luna" invoked per action still cannot play at a useful pace. Build the deterministic skill/outcome layer and event scheduler first; then Luna becomes an optional routing policy over that scheduler, not a third always-on brain. The 121 model-free tests are real counts (116 literal + 5 loop-generated; 83 benchmark subset) but they are fake-page/recorded tests — only 3 import real engine modules and none exercise CDP, HTTP, sensing or live control.

---

## 1. Five highest-impact weaknesses

### W1 — The loop buys one decision per action at a large fixed cost (C for trial; G for native)

**Evidence.** 176 Terra + 9 Sol requests in 1,278s; Terra mean 12,372 input tokens/call (median 10,666), 34% cached, ~96 output tokens; Sol 10,797 input, 0 cached. Terra median latency 4.94s, minimum 3.65s, p90 7.05s; Sol median 11.68s. Terra wait alone was 73.1% of wall. Action mix: `look` 64 (37%), `click` 37, `key` 33, `hold` 32, `swing` 7 — zero `goto`/`type`/`scroll`/`wait`/`stop`. All 32 holds were 1,000–2,500ms (median 1,500), despite the prompt's 6–12s guidance in later epochs. There were 176 observations and 176 Terra calls: one paid decision per observation.

**Where the tokens go (Est.).** A regression on the traces gives roughly `input ≈ 0.294 × promptChars + 5,019`: ~46% is fixed transport overhead (~3.8k Codex preamble/instructions + ~1.1k image + schema), and only ~5.8k is dynamic content. The always-present handbook blob (~1,735 tokens/call, 16%), repeated goal memories (~354), and `previousEpoch` duplication (~231) are the largest removable items. Decision-relevant state (observation + outcome) is under 5% of a call. The largest lever is call count, not prompt trimming: 173 × 3.65s = 623s (49% of wall) is the latency floor even with zero inference.

**Consequence.** ~6.24M input tokens/hour extrapolated at trial rate, 100k+ tokens/min, and a player that can only complete ~0.15 actions/s because it idles during every model call. A cheaper tier invoked per action does not escape this; it adds calls on top of the same transport floor.

### W2 — The native contract makes the intended efficiency fix unreliable (C mechanism; H rates; G no native data)

The native path is the right direction, but its evidence/acceptance design has defects that would turn it into more calls and more stalls:

- **Freshness window vs scan cadence.** `readNative` exposes `targets` only when `state.scan.fresh` is true, which requires a sample ≤200ms old (`src/native-bridge.mjs:72`), while still scans refresh every 500ms indoors / 1,000ms outdoors and the Body wakes the scanner only when it has a goal. With the Body disabled between intents, idle `/native` reads will return empty `targets` much of the time. A model answer with `targetIndex` then throws in `normalizeNativeDecision` (`src/protocol.mjs:40`), is silently discarded, and immediately costs another paid model call; `use`/`fight` starts are rejected too (`src/intent-executor.mjs:67,79`).
- **`turn` cannot complete.** The Body treats a turn as arrived within its 12° `faceToleranceDeg` (`vendor/legacy-agent/body/core.mjs:63,923`), but the executor requires angular error ≤2° and the `arrived` event (`src/intent-executor.mjs:119`). A turn normally ends 2–12° off and therefore runs to its 30s deadline. That is a 30s wall-clock penalty plus another model call for the most basic tactical action. Tests use exact yaw, so they pass.
- **Combat has no success terminal and the guard is stricter than the Body.** There is no `completed` branch for fight/retreat: every fight ends `interrupted` or `expired`. A killed foe and an occluded foe both produce "chosen hostile lost" (`src/intent-executor.mjs:107-113`). The per-tick guard ORs a strict `fresh !== true` check (`vendor/legacy-agent/body/core.mjs:1107-1114`), bypassing the Body's own 3s threat-retention (`THREAT_MS`); one dropped scan ends the fight. The page already has a player-blame kill ledger (`vendor/native-agent/agentBridge.js:194-196`) but it is deliberately never exposed. Combined with nearest-target identity rounded to 0.1m, brief occlusions or a 5cm distance crossing can freeze the character mid-fight and spend a Terra call.
- **Interaction evidence is too permissive.** `use` can complete on any overlay appearing (`src/intent-executor.mjs:105`) or on any HUD line heard since the press; the Body's `settleUse` treats any visible change as an outcome (`vendor/legacy-agent/body/core.mjs:1082-1098`). `explore` can never complete: autopilot success is mapped to `interrupted` (`src/intent-executor.mjs:127`), and the executor's 30s default pre-empts the autopilot's 90s limit.
- **Typed-target mismatch.** `targets` includes foes, but foe entries carry `targetId/type/hostile/dist/bearing/dy/h` and no `x/z` (`vendor/native-agent/agentBridge.js:208-209`); `goto`/`use` on a foe-`targetIndex` therefore fails `point(t)` and costs a call. Persons move, but their "stable" identity is exact kind+x+z equality (`src/browser.mjs:78`), so NPC interaction can 409 while the model is thinking.
- **Frame invalidation is incomplete.** Only three producers bump the frame (mode change, dungeon teleport, boot/landing); ladders, stairs, elite-gate pulls and rescue moves do not, so target IDs and remembered routes can survive a real relocation. "Teleports increment the frame" in the docs is overbroad.

**Consequence.** Native may be *slower and more failure-prone* than the browser practice loop until these are fixed. The first native trial would otherwise measure contract bugs, not the model.

### W3 — Outcome semantics and metrics cannot distinguish progress from thrash (C)

`buildReport` defines `verifiedOutcomes` as completed native intents excluding only `stop` and `look` (`src/report.mjs:66`). That includes completed `turn` (a camera movement), counts a `use` that merely opened some window, and can never count `fight` or `explore`. It does not read `action-observation` evidence (visual/health deltas), displacement, zone transitions, quest state, save/load or deaths; browser mode emits `dispatchReceipts` while native mode emits `intent-outcome`, so the two modes are not comparable. In this trial the report-equivalent is 0 verified outcomes against 167 receipts. Efficiency is `null` when the denominator is zero — honest, but it means no baseline exists for the proposed tier comparison.

The deeper problem: the project's own failure definition — "a loop that runs cheaply but makes no useful progress is a failure" — is currently unobservable. `turn`-as-verified is exactly the metric-gaming the user is worried about.

### W4 — Plan authority, cancellation and terminal semantics are unversioned and racy (C)

- The plan is a bare string (`src/main.mjs:46`) with no id/version/basis; a Sol reply is applied unconditionally on resolution (`src/main.mjs:92`) even if the scene, goal or plan changed. A critical escalation arriving while Sol is in flight is silently dropped, not queued (`src/main.mjs:88`); play never pauses for Sol (2–4 Terra requests ran inside every completed Sol interval), and Sol never receives native state (`src/main.mjs:90`) so strategy is blind to the pose/targets Terra acts on.
- Escalation did not work as designed: 0/173 Terra responses set `escalate`; of 9 Sol calls, 3 were periodic review (trial code), 1 was initial-after-plan-loss, and 5 were triggered by transient dispatch errors ("Control changed since observation", "Stale observation", timeout). Sol was an error-echo channel. One critical escalation was dropped; 2 Sol calls never returned.
- `finish()` marks the task terminal only after `await io.stop()` (`src/intent-executor.mjs:17-22`); if the page evaluate rejects during stop, the task remains `running`, no terminal event is emitted, and the executor can wedge. There is no intent id/sequence; a new start silently replaces a running intent. Body command validation checks id/frame/mode/page but not generation (`src/body-runtime.mjs:26-34`). One-shot completion events are consumed by cursor and not latched, and `events.dropped` is ignored — a missed `arrived`/`used` becomes `expired`.
- Between intents the Body is stopped, so the character stands defenceless during each ~5s model call.

### W5 — Run integrity, allowance and hot-repair scope are not ready for an hour trial (C + G)

- A non-409 `/observe` error is fatal (only 409 is retried, `src/main.mjs:100`), ending the epoch; any nonzero exit makes the supervisor "held" and requires an operator `resume` (`src/main.mjs:195,200`). The trial had 5 epochs (1 fatal, 3 operator holds, 1 stop), a 109.9s repair gap, and three code revisions swapped in mid-run; it is not one system under test.
- `/stop` sets a `nativeStopped` latch (`src/browser.mjs:253`) that only `/resume` clears, but `main.mjs` calls `/stop` after a timed-out action and continues the loop without `/resume` (`src/main.mjs:160`) — every later `/action` and `/intent` in that epoch 409s while Terra keeps being called. The historical "fatal controller-busy" is consistent with this family of races.
- There is no preflight budget/burn-rate governor: at 104k input tokens/min the trial could exhaust a typical allowance before the operator knows. "Pause on exhaustion" is a regex on CLI text plus a human resume; no projected-spend warning, no reset-time awareness, no separate engineering-usage accounting (reported "unavailable, not zero" — honest, but not budgeting).
- Every 250ms intent poll triggers a memory checkpoint (full-snapshot fsync + rename) and a status-file write (`src/main.mjs:134`); the executor samples `io.native(0)` so each poll re-serializes up to the 200-line event log; screenshots accumulate unpruned. These are avoidable latency and disk costs on the same machine as the game.
- **Hot updates are only partly hot.** `tools/reload.mjs` archives `src/test`, runs the suite, optionally restarts the driver, and preserves the page — this is genuinely useful and was exercised in the trial (worker epochs survived; game stayed open). But the vendored bridge is installed at world boot and lives in `window.__agent`; bridge/engine changes need a page reload/session restart, and the revision manifest omits `vendor/`. The plan's "apply improvements while the game remains open" cannot mean all layers. Also, repairing during a live session with no pause is unsafe if hostiles are near.

---

## 2. Proposed Luna/Terra/Sol design

### 2.1 Principle: three horizons, one scheduler, one physical authority

Do not run three autonomous loops. Run one **blackboard + event scheduler**; model tiers are *request handlers* bound to decision classes, with a single local executor holding physical authority. Tier 0 is deterministic local skill code (the existing Body plus a skill library), not a model.

```
Game ──50ms──> Body (input, steering, attack cadence, guards)
                 └─> Skill executor (bounded, evidence-producing)
                       └─> Scheduler/Blackboard ─┬─ Luna   (skill decisions, event-gated)
                                                 ├─ Terra  (plan versions, milestones)
                                                 └─ Sol    (strategy, review, engineering proposals)
                          Budget gate ──> pause latch (no API fallback)
```

### 2.2 Shared typed objects

- `WorldSnapshot`: `{obs_id, page, frame, generation, tick, scene, pose, vitals, weapon, mode, overlay, pointerLocked, targets[{handle,kind,label,dist,bearing,pos?}], ui{digest,text,controls}, events[{seq,kind}], scan_age_ms}`. **One atomic sample** (state/view/targets/screenshot from the same basis), not `/observe` + `/native` at different times.
- `Plan`: `{plan_id, version, author, goal, horizon, steps[{id,skill,args,success,abort_if,deadline}], reassess_on[], ttl, basis{obs_id,scene}, status}`. Steps name skills, not prose.
- `SkillInvocation`: `{skill_id, args, plan_version, authority, deadline, cancel_token}`.
- `OutcomeReceipt`: `{task_id, plan_version, terminal: completed|cleared|failed|blocked|interrupted|expired|cancelled, evidence{displacement, zone, target_change, interaction, health, kill_ledger?}, observed_at, dispatch_only:false}`.
- `TierExchange`: `{schema_version, request_id, tier, kind, basis{obs_id,plan_version,frame,generation}, payload, deadline_ms, budget, reply_to}`. Replies echo `basis` and `request_id`.
- Decisions: `SkillDecision{skill,args,expected,abort_if,confidence,reason}`; `PlanUpdate{base_version,new_version,goal,steps,reassess_on,ttl,scope}`; `StrategyDecision`; `EngineeringProposal`.

### 2.3 Authority matrix and arbitration

| Tier | May decide | May not | Deadline | Write scope |
|---|---|---|---|---|
| Local skills/Body | execution details, target reacquisition within plan, safety aborts, local retry | change goals, spend gold, accept quests, chat content | per-skill | physical input only |
| Luna | which allowed skill/parameters for the current step; local combat parameters (health floor, engagement radius) | change plan/goal, add steps outside plan, edit memory/persona | 2s | current step |
| Terra | create/replace `Plan` versions, choose goal, priorities, when to reassess | issue input, bypass local safety, apply stale plan | 20s | plan/blackboard |
| Sol | goal/strategy constraints, approve/reject plan direction, engineering proposals | input, live code execution, game-text-authorized changes | 60s (async) | strategy + proposal queue |

Arbitration: one active plan version; intents are pinned to it; a new plan applies at the next skill boundary unless it carries an `abort` class (death, safety, operator). A tier reply is advisory until validated by the local executor, which may refuse an unsafe or unobservable command and return `blocked`. This preserves "models retain authority over objectives and courses of action" without giving them the keyboard.

### 2.4 Event-driven triggers, cooldowns and coalescing

| Wake | Trigger | Cooldown / single-flight | If unavailable |
|---|---|---|---|
| Luna | plan step has no matching skill; two same-class skill failures; novel UI/visual ambiguity; multi-threat target choice; player message needing a reply | 1s, max 3/10s; queue latest | use plan's default skill; if none, safe `stop/defend`; do not synchronously call Terra |
| Terra | step terminal/milestone; scene/zone transition; death; HP below plan threshold; new hostile group; quest/UI transition; inventory/resource threshold; repeated failure; plan TTL; Luna escalation | 30s; one in flight, latest queued | continue current plan; if expired, local survive/explore policy with backoff; never end epoch |
| Sol | explicit consequential/irreversible choice; repeated failure across two plan versions; session end; safety incident; engineering request | 10min; one dossier | queue dossier, continue; review later |

All requests carry a basis; dedupe by `(event_class, scene, plan_version)`, coalesce for 500ms, and never make periodic "review of progress" calls. Trial evidence: periodic review + error-echo Sol calls were 8 of 9 — the scheduler must own triggers, not the model's `escalate` flag (0/173 here).

### 2.5 Plan versions, stale replies, safe application

- Only Terra writes plan versions (Sol may write `author:sol` if Terra is unavailable); every update carries `base_version`. If `base_version != current`, the update is **stale**: archive it; merge only if the scene/basis is unchanged, the update is additive, and its TTL is valid; otherwise discard and re-request once if budget allows.
- Luna decisions are valid only for `obs_id` within a 2s window and the plan version they were asked under; otherwise discard.
- Sol strategy replies are applied as constraints to the next plan version, not directly; a stale reply is archived, never silently applied.
- The executor rejects `targetIndex`/ground targets that are no longer in the same atomic observation; it re-resolves by stable handle and 409s visibly if missing. "Old index never reassigns" is correct and should stay.

### 2.6 Budget and allowance governor

Track per-tier calls, input/cached/output tokens, latency, uncached input and outcomes; forecast spend from the last N calls. Reserve shares (e.g., 15% Luna, 55% Terra, 30% Sol — configurable, estimate) and a session hard cap. At 80% of cap: stop discretionary escalation; at 100%: release input, checkpoint memory/plan/status, pause the game via visible controls, write `paused-budget`, and require explicit operator resume. Never fall back to API billing. Engineering usage gets its own role home and its own counter, even if only approximate.

### 2.7 Sol's evidence-to-code workflow and hot updates

**EvidenceBundle**: run dir, summary/report, metric deltas, trace slices around failures, receipts, selected screenshots (opt-in), source commit + hashes, test results, open questions, target metric. Game text is quarantined as untrusted evidence; it can describe a UI problem but can never authorize a change.

**EngineeringProposal**: diagnosis with evidence pinpoints; affected files; reproducible failure (test/fixture); proposed diff; tests; expected metric delta; risk; rollback; swap class (`worker|driver|bridge|engine`). Sol produces the proposal; the playing process never executes model-written code.

**Gates**: (1) branch/worktree, tests green; (2) replay recorded fixtures; (3) staging + static/import checks; (4) safe window: no hostiles, not in menu, HP above threshold, release input, pause/checkpoint memory/plan/status, capture pre-state; (5) swap + smoke skill + observation identity check; (6) rollback on failure; (7) audit receipt. During timed trials, freeze code; emergency fixes end the epoch and are annotated, otherwise the numbers are not attributable (the trial swapped 4 files mid-run).

**Swap matrix** (must be explicit in the plan): prompts/skills/planner → worker restart (game open, proven in browser mode); driver → driver restart + CDP page reconnect (page preserved, generation changes); Body injected JS → replace on next driver start; vendored bridge/engine host patch → page reload/session restart. "Game remains open" is achievable for the first two only; say so rather than over-promising.

### 2.8 Does the third tier pay?

| Design | Calls/hour (Est.) | Input/hour (Est.) | Model-time share | Decision latency | Useful-play visibility | Status |
|---|---|---|---|---|---|---|
| Trial baseline (browser, per action) | ~496 Terra + 25 Sol | ~6.24M | ~73% wall Terra | 3.6–14s each | 0 verified | measured |
| Naive three-tier (Luna per action) | 400–800 Luna + 50 Terra + 10 Sol | ~2–4M+ (same fixed floor per call) | high | ~3.6s+ | only if metrics fixed | estimate; likely no win |
| Skill layer + two model roles (recommended) | 20–50 | 0.3–1.0M | <30% | sub-second local, model at milestones | measurable | estimate; needs ablation |
| Skill layer + Luna on events only | 30–70 | 0.4–1.2M | <30% | sub-second | measurable | estimate; Luna only if cheap/fast |

**The decisive fact:** with the current `codex exec --ephemeral` transport, every call pays ~3.6s and ~5k tokens before content. Luna cannot be "fast and cheap" unless it uses a different transport (persistent Codex thread, local model, or non-CLI endpoint). The tier split is therefore a routing/cost-policy question, not an intelligence question. I would not implement Luna until an ablation shows it displaces Terra calls at materially lower cost; the third tier's benefit is not assumed.

---

## 3. Alternatives compared

1. **Current two-tier, fresh context per action** (measured). Simple, bounded, no drift; but one call per action, no local multi-step skill, no outcome metric, and the fixed floor dominates.
2. **Proposed three-tier** (unmeasured). Better conceptual separation; more calls, more coordination, more stale-reply surface; only wins if Luna replaces per-action Terra calls at much lower per-call cost and the scheduler suppresses redundancy.
3. **Recommended: deterministic skill layer + two model roles + event scheduler.** Keep Terra for session planning, Sol for strategy/review, and let local code execute multi-step skills with success predicates. Luna becomes an optional event-gated skill chooser behind the same `SkillDecision` interface. Simpler than three runtimes, fewer calls, and it directly fixes the "no useful progress" failure. Reuse the existing autopilot `prepare/commit/step` pattern (`vendor/legacy-agent/mind/autopilot.mjs`) as the skill template rather than writing a new planner.
4. **Single persistent model thread with tools.** Would cut the ~3.8k-token preamble and the 3.6s spawn floor and improve continuity; but context grows, the plan lives in model memory (hard to version/audit), interruption and staleness are harder, and a corrupted thread poisons the session. Worth a transport experiment, not the architecture.
5. **Behavior tree/utility controller + one planner.** Lowest calls and strong interruption semantics; but authored behavior is brittle in DFO's UI/quests. Formalize the skill layer as a small BT with monitor/interrupt nodes only if the flat skill table becomes unmanageable; don't build a general BT engine now.
6. **Cross-cutting: event-sourced deltas, selective images, compact structured state.** Orthogonal and recommended regardless of tier count. Send deltas since the last decision plus a compact summary; attach a screenshot only for UI/ambiguous/novel cases; retrieve memory by relevance and cap it. Current prompts always ship a full screenshot and the full DOM text/controls even for native decisions (C).

---

## 4. Where models decide and where local code acts

| Situation | Local detection/action | Model involvement |
|---|---|---|
| Routine movement, door use, loot, equip | skill executes along observed route, verifies zone/item/UI change | none; Terra sets destination/goal once |
| New threat / combat | Body engages per plan policy; local health floor, retreat, target reacquisition | Terra on encounter start or threshold crossing; Luna only for target choice/ambiguity |
| Plan change | validate version/basis; apply at boundary | Terra (or Sol constraints) |
| Player message | detect chat event, snapshot, queue; send typed reply | Luna/Terra for content; rate-limited; never software instructions |
| Quest/UI transition | detect new scene/window/journal; local UI skill (text matching, retries) | Terra at transition; Luna if UI ambiguous |
| Target occlusion | grace window, reacquire by handle; defensive fallback (back off/defend) | none unless lost beyond TTL or health risks |
| Death/recovery | release input; pre-authorized recovery skill (offline load own save / online respawn); journal | one Terra/Sol call after recovery, not per UI step |
| Stuck / repeated failure | local watchdog, retry once, change approach | escalate after two same-class failures |
| Conversation / social | local chat I/O, safety filter | model generates persona-consistent reply |

This keeps the model in charge of *what and why* and local code in charge of *how and when*, with local refusal/reporting authority. Calls fall because a skill can run for seconds/minutes and only terminal events wake a tier; calls rise only for genuinely uncertain or consequential decisions.

---

## 5. Failure-mode audit

- **Cancellation races.** Good: stop latch, generation/frame checks at intent start, serialized control gate, worker abort during model calls, lease expiry. Gaps: `finish()` terminal-after-I/O wedge; `/stop` latch never cleared after the timeout path; no intent ID/idempotent cancel; body mutations omit generation; a poll in flight can renew a lease once after a stop request (bounded, but log it); no crash test for "driver dies while keys held".
- **Stale observations.** The worker takes `/observe` and `/native` at different moments; only generation/frame are revalidated, not scan freshness for explicit x/z targets. A five-second model latency also makes UI controls stale, producing the 5 "Control changed/Stale observation" errors — these should be retried locally, not escalated to Sol.
- **Nearest-target switching.** Chosen target must equal the current nearest in both the poll and the 50ms guard. This is too strict for real combat: a bystander, occlusion or a 0.1m rounding flip freezes the player and costs a call. Prefer "engage hostiles in this area until clear or floor", with target reacquisition and hysteresis; keep exact-target selection for special cases only.
- **Scene-relative coordinates.** Continuous origin-corrected metres are used, not scene-relative coordinates as the docs say; foes carry no x/z; things are identified by exact float kind+x+z; persons move. Give real handles (engine key/loot uid/actor handle) with TTL, and state the coordinate frame to the model.
- **Observable completion.** `goto` (arrived + ≤1m) and `look` are reasonable; `turn` is broken; `fight`/`explore` cannot complete; `use` can certify an unrelated HUD line or any overlay. Add explicit evidence classes and, for combat, a `cleared` terminal (no hostile in radius for N scans) plus `kill` as report-only evidence from the existing player-blame ledger — never fed to the model or used for control.
- **Combat loops.** `expired` → model retries fight; retreat/fight can oscillate around the HP floor; there is no encounter state or cooldown. Add encounter IDs, post-retreat disengage policy, and local "no progress" detection.
- **UI starvation / player messages.** 45s model calls mean no observation and no chat response for seconds; menus interrupt native intents and cost a call. Use local UI skills, async chat replies, and a short "observe/act" loop while a tier plans.
- **Live-update compatibility.** Worker/driver hot swap is plausible and partly proven; bridge/engine need a page reload; the revision archive omits `vendor/`; mid-trial source changes invalidate measurements. Define swap classes and freeze code during trials.
- **Metric gaming.** Dispatch receipts are acknowledgements, `turn` counts as verified, `use` can be weak, and `verifiedOutcomes` is empty in browser mode. Replace with "verified useful state transitions per 1M input tokens and per call": displacement ≥2m, zone/exit change, confirmed kill/clear, save/load, quest/UI transition, item equipped, chat sent/received; exclude look/stop/turn/dispatch. Track interventions/hour and model-time share alongside.

---

## 6. Low-cost experiment sequence

**Phase 0 — model-free (hours).** Replay harness with recorded observations and a fake model adapter: one call starts a multi-step skill; zero calls while it runs; cancel at random ticks; page-evaluate rejection during stop; 500s on `/intent`; stale scan/occlusion; body replacement; overlapping stop/start; dropped events. Golden traces for report: kill ≠ receipt, turn not verified, fight cleared, explore completed, browser/native parity. Installer idempotence after a `world-install.txt` change. Gate: deterministic pass; **no live claims**.

**Phase 1 — zero-model live native control (10–15 min).** Fixed scripted skills (turn 90, goto door, use, explore 60s, fight nearest, retreat, stop) with **no model calls**. Record screen/manual ground truth, receipts, displacement, heading error, zone transitions, scan age, guard interruptions, kill ledger vs visual, input release after stop/cancel/lease expiry. Gates: 0 stuck inputs, turn completes after tolerance fix, ≥3 room/scene transitions, no false `use` completion, no freeze >1s in combat, stop within 500ms. Stop on stuck key, dual authority, crash, false completion. Rollback: kill script, `/stop`, hold, restore saved source dir; game paused/held. This is the missing "does native control work at all" test.

**Phase 2 — capped model A/B (15–20 min).** Arm A: current two-tier native loop. Arm B: skill layer + Terra event scheduler (Luna optional). Same starting save; hard cap (e.g., 60 calls / 300k input or 20% of remaining allowance, whichever first); pre-register 3 outcomes (e.g., leave starting room, equip/save, clear a fight). Measure verified transitions per call/token, model-time share, 409s/stale starts, repeats, interventions. Stop at cap, 2× projected burn, 3 consecutive no-progress calls, or any safety incident. Gate: B ≥ A per token and no worse on interventions, else reject.

**Phase 3 — one-hour trial.** Only after Phase 1/2 gates. Pre-register success (e.g., exit Privateer's Hold / reach town / complete a quest step / survive), supervision ≤1 intervention/hour, 0 fatal, 0 stuck, code frozen, budget cap with `paused-budget`, memory/plan preserved, rollback ready. Evidence = verified transitions + receipts + budget + supervision log; a passing unit suite is not a live trial.

---

## 7. Prioritized implementation table

| # | Change | Reason | Expected benefit (Est.) | Effort | Risk | Verification |
|---|---|---|---|---|---|---|
| 1 | Fix native evidence contract: forced fresh scan, one atomic snapshot, turn tolerance, thing/foe handles, latch events, honor `dropped` | Native currently loses targets/turns/combat | Turns native from unusable to measurable; avoids paid re-decisions | M | Med | Phase 0 replay + Phase 1 |
| 2 | Terminal-before-I/O; idempotent stop; clear stop latch on recovery; intent IDs/queue | Executor wedge + 409 cascade | Removes a class of epoch-ending failures | S | Low | Fault-injection tests |
| 3 | Outcome ledger + metric v2 (fight cleared, explore complete, use evidence, exclude turn; report-only kill ledger; tokens/call per outcome; reason histogram; source hash per epoch) | Metrics currently reward receipts | Makes useful play visible; enables A/B | M | Low | Golden traces + trial report |
| 4 | Skill library + event scheduler (goto/use, explore-until, fight-until-clear, loot, equip, rest, travel, recover) reused from autopilot pattern | 1 call/action is the cost driver | 5–20× fewer calls (est.); sub-second local response | L | Med–High | Phase 0 harness; Phase 2 |
| 5 | Context budget: drop always-on handbook/previousEpoch, dedupe foes/vitals, selective images, cap controls/history | 46% fixed + stale content | ~20–30% fewer tokens/call (est.) | S–M | Low | Context-size regression |
| 6 | Plan/blackboard: versions, basis, stale rejection, typed handoffs, authority matrix, escalation queue | Stale Sol plans, dropped escalations, three-tier arbiter missing | Fewer redundant plan calls; coherent strategy | M | Med | Fake-tier tests + Phase 2 |
| 7 | Tier routing + budgets/cooldowns/unavailability (Luna optional) | Prevent call storms; make three-tier testable | Bounds cost; graceful degradation | M | Med | Model-free routing tests |
| 8 | Combat guard hysteresis + engagement-area fight + defend/retreat fallback + kill evidence | Freeze-on-flip; no-completion | Better survival and fewer interrupted fights | M | Med–High | Fake fight fixtures + Phase 1 |
| 9 | Budget governor + pause latch + bounded auto-recovery | 21-min burn; manual resume | Avoids allowance exhaustion; unattended runs | S–M | Low | Simulated usage-limit tests |
| 10 | Hot-swap staging/smoke/rollback + safe window + vendor manifest; code freeze in trials | Mid-trial revisions; unsafe repair | Attributable, reversible improvements | M | Med | Phase 1 repair drill |
| 11 | Remove 250ms checkpoint/status churn; native event cursor; cap prompt/trace logging; prune screenshots | Latency/disk on game host | Lower poll latency, less disk | S | Low | I/O benchmark |
| 12 | Report/dashboard parity for browser, native, roles; separate engineering usage | Current report hides native work and third roles | Comparable telemetry | S | Low | Report tests |

---

## 8. Smallest next step, removals, and blocking questions

**Smallest next implementation step.** Before any Luna or three-tier work: fix just enough of the native evidence contract to run a **10-minute, zero-model native smoke**. Concretely: (i) force a fresh scan and return one atomic state/view/targets sample; (ii) make `turn` complete at the Body's arrival tolerance (or set it to 2°); (iii) give `fight` a real terminal (`cleared` when no hostile remains for N scans, `interrupted` on loss, kill only as report evidence) and `explore` a completion; (iv) mark the task terminal before best-effort stop. Then run the fixed-skill script with no model calls. That single smoke answers the question the current project cannot: *does native control work reliably enough to be worth optimizing?* Do not build the third tier first.

**Remove or don't build.**
- Remove from every routine call: automatic full screenshot, always-on handbook blob, `previousEpoch` duplication, dead `context-size` double serialization, per-250ms memory fsync/status writes, `events(0)` full-log polling, `stop` as an intent, periodic Sol "review", Sol calls on transient UI errors, `turn`/`look` as "verified outcomes", `targetIndex` for `goto`/`use` on foes, duplicated foes in prompt, redundant `foes[0]` guard check, gesture-swing without pointer lock.
- Avoid building: a third always-on model loop or separate role runtimes; per-action Luna; model-written code executed in the playing process; a general BT/HTN engine before the skill table exists; persistent raw model thread as the plan store; more fake-only tests that never touch the driver/CDP; auto-resume after usage-limit exhaustion.
- Reuse what exists: the 50ms Body, guards and lease; the autopilot `prepare/commit/step` frontier-hand pattern as the skill template; the managed installer/hash discipline; the generation/frame/target recheck; the honest "dispatch is not outcome" documentation.

**Questions that genuinely block a better decision.**
1. **Luna variant**, with measured per-call latency/token cost/vision/context, and whether it must use the Codex CLI/`chatgpt` auth path or can use a persistent thread/cheaper endpoint. With the current 3.6s/~5k-token-per-call floor, per-action Luna is not viable; without this, the three-tier comparison is unquantifiable.
2. **Subscription allowance size and reset semantics**, and whether concurrent/tier calls and `codex exec resume` threads count or cache differently. This determines budgets, trial caps and the persistent-context experiment.
3. **May the engine's player-blame kill ledger be used as verification-only evidence** (never model input/control)? If not, what counts as combat success — corpse/loot/quest/XP?
4. **Online or offline for the hour trial**, account/checkpoint policy, and whether the native bridge is permitted online by the operators (policy as well as tech).
5. **Hot-update scope:** is a page reload/session restart acceptable for bridge/engine changes, or must the game remain open absolutely? Current bridge/engine changes cannot be hot-applied.
6. **What exactly counts as "useful play"** for the hour trial (pre-registered), so success is not redefined after the fact.
7. **Authority boundary:** may local code choose subgoals/skills and perform save/death recovery without a model call within a pre-authorized policy? (I recommend yes; it is the main call-reduction lever.)
8. **Budget policy at exhaustion:** pause + hold + operator resume, maximum auto-recovery attempts, and whether engineering usage shares the same allowance.

---

## Appendix — evidence index for re-verification

- Trial data: `data/runs/2026-10-27T09-31-49-338Z/` — `summary.json`, `trace.jsonl`, `epoch-1..5/trace.jsonl`, `epoch-*/source/` (revised mid-run; no native intent events).
- Model accounting: 180 successful responses sum to 2,215,985 input / 736,000 cached / 18,131 output; 5 aborted requests carry no usage, so this is a lower bound. Terra: 2,140,405 input (34.4% cached), 16,716 output, 12,372 input/response. Sol: 75,580 input (0 cached), 1,415 output.
- Timing: Terra total 933.6s (73.1% of wall); Sol total 82.3s (never blocking); execution/polling 185.3s (15.9% active); holds 115.2s.
- Tests: 121 model-free tests (116 literal `test(` + 5 loop-generated); benchmark subset 83; fake/recorded pages except 3 tests importing real engine modules; zero browser/CDP/HTTP/live tests.
- Key code anchors: `src/main.mjs` (context assembly, escalation, worker/supervisor), `src/intent-executor.mjs` (terminal outcomes, guards), `src/report.mjs` (metric definitions), `src/models.mjs` (transport), `src/native-bridge.mjs` (freshness/targets), `src/browser.mjs` (stop latch, action validation), `vendor/legacy-agent/body/core.mjs` (Body tick, arrival tolerance, guard), `vendor/native-agent/agentBridge.js` (target IDs, kill ledger), `tools/reload.mjs` (hot repair scope).
