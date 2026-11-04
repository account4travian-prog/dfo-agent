# Path B round-two handoff: continuous mind, UI routing, diagnosis and efficiency

- **Worktree:** `%USERPROFILE%\Documents\DFO\DFO-TerraSol-DeepSeek-R2`
- **Branch:** `deepseek/goals-1-10-r2`
- **Starting checkpoint:** tag `handoff/round2-goals-1-10` (`c72fc0d`)
- **Implementation commit:** `e0e34e46c545f3181cdbd2f2467fc80a266f42d8`
- **Tests commit:** `14bee9667186d8e90e889329c1eb915edfe986da`
- **Observation/continuation evidence fix:** `bf8347ba670f470f0c12975dac30e486e1f4c382`
- **Documentation commit:** the tip of the branch after this file; inspect with `git log --oneline deepseek/goals-1-10-r2`.
- No game/browser was launched, no paid/model preflight was executed, no primary checkout was modified and nothing was pushed.

## What changed

Path B now implements the round-two mind contract against mocked player services:

1. **Configuration and preflight.** `src/mind/model-metadata.mjs` reads local Codex model descriptors (never auth/credential files) and resolves the exact role set. On this machine the finding is `gpt-6-luna`, `gpt-6.1-terra`, `gpt-6.1-sol` (see `MODEL-AVAILABILITY.md`). `loadMindConfig` verifies/records the resolution and keeps explicit overrides; missing/different models are never substituted. Default finite engineering caps are 1,500,000 input tokens, 240 calls and 60,000 output tokens, overridable. `tools/mind-preflight.mjs` and `src/mind/preflight.mjs` prepare a bounded real-role preflight that refuses paid execution without both `--execute` and `DFO_REAL_ROLE_PREFLIGHT=1`; one minimal request per role is issued only in that mode.
2. **Continuous planning.** `scheduler.continueAfterPlan` (default true) treats a completed medium-term plan as a boundary, appends a full plan summary (goal, steps, args, state) to plan history, and requests the next Terra plan. `sessionComplete:true` from Terra, a deadline, operator stop, budget/usage hold or an unrecoverable condition ends the session. A verified session finish requests the Sol review. Full current plan plus plan history are checkpointed and survive worker replacement; old saved plans remain valid.
3. **UI/workflow decision path.** `src/mind/tasks.mjs`, the control client and scheduler support the additive `dfo-player.v1` task surface: `intent`, generic trusted `ui`, and named `workflow` tasks. `/health`/`/snapshot.player`/`GET /workflows`/`POST /task`/`GET /task`/`POST /task/cancel` are used when advertised; legacy `/intent` remains the fallback. Plans and Luna decisions can select these tasks; startup/frontdoor/loading/modal/death phases with `native.ready:false` can be planned instead of holding. Workflow catalogue/phase/args are validated at dispatch; unavailable workflows become a bounded Terra reassessment. UI actions carry the current `uiObservationId`; no second input controller exists.
4. **Memory and continuity.** Memory entries now carry `qualification` (observed/inferred/uncertain/stale), confidence, subject, tags and optional expiry; `select()` ranks/deduplicates and suppresses stale/expired and old routine noise while retaining social context and journal/unfinished-work entries. Full plan/plan-history checkpoints preserve arguments and step states.
5. **Decision packets and replay.** Every tier request produces a bounded `dfo-decision-packet.v1` containing role/model/source revision/basis/plan version/reason/schema, redacted input, structured reply, usage (explicitly unknown when unreported), latency and omissions. Packets are written under `data/runs/<run>/packets/packets.jsonl`. `src/mind/replay.mjs` builds a `dfo-replay.v1` fixture and replays recorded Terra plan decisions into a fresh plan store without a model or game.
6. **Sol diagnosis/repair exchange.** Sol engineering output is normalized into a typed `dfo-repair.v1` proposal with failure packet refs, source revision, affected paths, change class, reproducer, intended change, verification criteria, budget, risk and rollback. The playing process only queues it under `data/runs/<run>/repair-proposals/`; it never executes generated code. The scheduler ingests `dfo-repair-status.v1` (from Path A) and holds/cancels/checkpoints during applying; a verified status clears only the repair hold, never an operator or budget hold.
7. **Telemetry and efficiency.** Report parsing preserves task/evidence identity, player phases, packets, plan completions, repair events, attempted/failed calls and unknown usage; metric v2 now also accepts verified `EvidenceRecord` event types. `src/mind/efficiency.mjs` and `tools/mind-harness.mjs` compare two-tier/three-tier routing under a matched scenario/fingerprint and label fake evidence as non-saving. Unknown usage is never zero.

## G1-G10 coverage (Path B half)

| Goal | Status | Evidence / remaining |
| --- | --- | --- |
| G1 Models/config | **Implemented + fake-tested**; real preflight pending | Local metadata finding `gpt-6-luna`/`gpt-6.1-terra`/`gpt-6.1-sol`; finite caps; role receipts; no substitution/API fallback. Real bounded preflight is prepared but not run. |
| G2 Continuous session | **Implemented + fake-tested** | Three successive plans with different objectives, full history/args, session-finish Sol review, budget/operator hold behavior. Live continuation pending. |
| G3 Startup/UI decision path | **Implemented against mock**; live player workflows pending Path A | frontdoor→world→modal→world task sequence, workflow catalogue, trusted UI task, no native requirement for UI, no second writer. |
| G4 Live control | **Path A** | Path B client/scenario support only; no live control claim. |
| G5 Player activities | **Path A execution; Path B selection** | Plan/task delegation and UI routing; actual capability group receipts remain Path A/live. |
| G6 Verified outcomes | **Consumer implemented** | Report preserves evidence identity and counts only verified useful event types; kill/quest/item/save producers remain Path A. |
| G7 Persona/memory/continuity | **Implemented + fake-tested**; live continuity pending | Qualified memory, social/unfinished retention, full plan/history replacement, fresh basis on resume. |
| G8 Live improvement | **Proposal/status half implemented**; executor pending Path A | Typed repair proposals, external queue, repair hold/checkpoint/verified status; no generated-code execution. |
| G9 Debugging/replay | **Implemented + fake-tested**; live evidence pending | Decision packets, replay fixture, report correlation, revision identity. |
| G10 Efficiency | **Governor/harness implemented**; live measurement pending | Finite caps, attempted-call/unknown-usage accounting, zero-call local polls, matched two/three-tier harness. Fake results are explicitly non-saving. |
| G11 hour trial | Outside this round | — |

## Test commands and results

Per-file model-free suite (normal shell; this worktree has no ignored engine/assets):

```powershell
node --test --test-isolation=none test/round2-mind-config.test.mjs
node --test --test-isolation=none test/round2-mind-continuity.test.mjs
node --test --test-isolation=none test/round2-mind-player.test.mjs
node --test --test-isolation=none test/round2-mind-memory.test.mjs
node --test --test-isolation=none test/round2-mind-diagnostics.test.mjs
node tools/mind-preflight.mjs          # dry run, no model call
```

Result in this worktree: **186 pass / 5 fail**. The 5 failures are confined to
`test/native-bridge.test.mjs`, which imports the intentionally absent
`engine/src/player/motor.js`; they are worktree engine-asset failures, not Path B
failures. The round-two additions are **19 tests** (config 4, continuity 3,
player 4, memory 1, diagnostics 7), all passing. Existing Path A/engine tests were
not edited except the four compatibility expectations noted below.

Changed existing tests (behavior intentionally changed):
- `mind-scheduler` / `control-mind-integration`: legacy `session-complete`
  expectations now explicitly set `continueAfterPlan:false`; new continuity tests
  cover the default true behavior.
- `mind-foundations`: plan summary now includes task kind/args/maxMs.
- `mind-report`: note wording now distinguishes unavailable/unknown usage.

No fake result establishes live gameplay, real token savings or a live repair loop.

## Prepared live settings / A-B comparison

- Default caps: 1.5M input tokens, 240 calls, 60k output. Override for the
  authorized run; keep budget hold and operator-stop semantics.
- Roles: `gpt-6-luna` (low effort), `gpt-6.1-terra` (low), `gpt-6.1-sol`
  (medium). Real preflight command:
  `node tools/mind-preflight.mjs --execute` with `DFO_REAL_ROLE_PREFLIGHT=1`.
- Matched comparison: run the two-tier arm (Luna disabled, Terra concrete steps)
  and three-tier arm (Luna tactical/task delegation) against the same player task
  service, start fingerprint, starting save and objective. Feed the two report
  JSONs to:
  `node tools/mind-harness.mjs --two <report> --three <report> --scenario <id> --fingerprint <start> [--live]`.
  Without `--live` the output is explicitly `not-evidence-of-real-saving`.
- Capture report `playerPhases`, `taskOutcomes`, `decisionPackets`,
  `planCompletions`, `repairEvents`, `attempts`, `modelWaitMs`,
  `verifiedTransitions` and `verifiedOutcomes`.

## Contract requests / outstanding live checks

See `CONTRACT-REQUESTS.md` for the exact player task, evidence, repair-status and
revision expectations. Outstanding live work owned by Path A/Codex:

1. Real bounded preflight for all three models and actual latency/context receipts.
2. Real `/workflows` catalogue and `/task` UI/workflow executions; startup,
   loading, modal, death, inventory, magic, quest, travel, economy, save/recovery
   and online chat.
3. Real evidence producers for item/quest/gold/travel/save/kill outcomes.
4. Real repair executor: consume proposal queue, write repair status, prove hot
   apply and rollback with the game page retained; bridge/engine reload changes
   stay maintenance-required.
5. Matched capped two-tier/three-tier live comparison and the later hour trial.
6. Worker/driver/Body replacement with plan/memory/packet/repair persistence.

## Reconciliation notes

- Merge `deepseek/goals-1-10-r2`; resolve `src/main.mjs`/`src/report.mjs`/
  `src/protocol.mjs` alongside Path A's player/controller work.
- Keep Path B's new files (`src/mind/**`, round-two tests/docs/tools) and do not
  overwrite Path A's controller/bridge/body/player/repair/vendor files.
- Run the union suite from the primary checkout (with engine) and the joint
  startup/three-plan/modal/recovery/operator-stop/repair-rollback scenarios.
- Do not treat these fake checks as live acceptance; keep G1/G4/G5/G7/G8/G10 open
  until their live evidence exists.
