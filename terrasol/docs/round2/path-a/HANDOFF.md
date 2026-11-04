# Round 2 Path A and integration handoff

Status: **OPEN**. This is a local implementation and model-free test checkpoint, not live acceptance, gameplay, artistic approval or a completed hour trial. No game, browser, services on 5390–5392, online chat, real playing/engineering model or live acceptance was run during this implementation. The primary checkout contains the Path B merge `df8034f` and subsequent reconciliation commits. Do not interpret simulated fixture results as game results.

## Implemented player surface

The production HTTP controller exposes `dfo-player.v1`, a dated/coherent snapshot, workflow catalogue, request-fenced native/UI/workflow tasks, request-specific polling/cancellation, and shared physical control. UI decisions retain their observed control identity; stale or reordered controls are rejected. Before UI input, the driver checks the legacy executor and quiesces the Body. `/task/reconcile` permits a fresh, model-authorized safe continuation after an unknown UI effect while keeping risky inputs fenced. A durable pending record is written before risky input; matching own-state evidence clears it with an audit receipt, while unknown effects remain fenced after replacement. Observed successful risky requests retain a durable request-ID receipt. This is not a universal exactly-once guarantee across arbitrary external actions or damaged/deleted local records.

Implemented bounded catalogue entries: `startup.select-mode`; `ui.activate-observed`; `ui.scene-transition`; `inventory.change`; `inventory.equip`; `vitals.change`; `vitals.key-change`; `ui.type-field`; `chat.send`. Each requires explicitly authorized parameters and current observed UI, has a deadline and emits observed/unknown evidence. Exact item/equipment counts and own vital changes do not establish why the change happened; chat requires a new visible own echo and does not establish online delivery. Text-field evidence is a value hash. Same-character scene transition uses a verification-only character-ID hash, same page/generation, stable frame and phase, and a bounded loading wait. Pre-character startup cannot satisfy that identity check.

| Activity | Current implementation and unresolved evidence |
| --- | --- |
| Startup | Unique visible Offline/Online title control and visible next-screen evidence. Exact existing Rowan save/character selection and safe pre-world identity are not implemented; inspect actual title/save cards before designing selection. No new character may be silently created. |
| Inventory/loot/equip | One explicitly selected control with exact own-inventory count or equipped-count predicate; count/equipment evidence is observed, not causal proof. No end-to-end loot/container/capacity workflow has been live demonstrated. |
| Magic | A selected control or authorized key can be paired with an exact health/magicka/fatigue change; this does not prove a spell was readied, cast or affected its target. Spellbook, target and spell-effect producers remain open. |
| Dialogue/journal/quest | Generic visible control and text entry exist. Named dialogue choices, journal changes and quest-specific predicates are not implemented. |
| Map/travel | Generic same-character phase/frame transition with bounded loading; no destination/arrival producer or travel-specific verified itinerary. |
| Trade/bank/services | Item-count changes can be observed, but no gold/bank balance, service, or purchase-causality producer; transaction uncertainty stays fenced. |
| Rest/save/load/respawn | Health/fatigue changes and same-character transitions can be observed, but no save confirmation or mode-specific load/respawn receipt. Pre-existing identity is required for scene transition. |
| Social | Visible draft and one own chat echo; no online joining or delivery verification. |
| Ordinary movement | Existing native turn/look/goto/use/explore/fight/retreat/stop. Authorized key+vital workflow is bounded; integrated jump/run/crouch and other configurable movement bindings remain open. |

`ui.activate-observed` is a generic fallback, not a claim that all screens or activities work. Advertised workflow availability means code and injected-driver tests exist; it is not evidence of actual game UI compatibility.

## External engineering and repair

`tools/repair-worker.mjs` is an explicitly enabled external queue poller. It claims each queued proposal once, gathers bounded/redacted packet evidence and scoped source bytes, uses the existing subscription-only `gpt-6.1-sol` transport in its separate process, records engineering attempts and usage separately, and stages its returned patch in an isolated Git worktree. A missing/ambiguous usage result, usage-limit signal, cap or interrupted claim holds; automatic polling does not reissue ambiguous calls. Proposal text is data, not shell commands. Existing acceptance tests cannot be changed by a candidate. The isolated suite explicitly omits engine-only tests when engine files are absent; the full primary suite is required before replacement. `--apply` uses the fixed repair adapter, never arbitrary proposal commands.

The apply adapter verifies source and patch hashes, scoped paths and staged index, requires the matching held repair checkpoint and physical release, archives exact original bytes, runs the full primary test suite, then replaces the driver while retaining the page and keeping the session held. It compares verification-only character/page identity and memory/plan/budget hashes; rollback checks candidate bytes, restores original bytes and attempts a held driver replacement. Bridge/engine changes remain `maintenance-required` rather than a hot-repair claim. Effective source identity contains the Git HEAD and a digest of runtime source bytes; it changes when an applied patch changes the running source even before a Git commit.

The only automatic retry class currently eligible is the **original failed turn** with saved plan authority, original absolute target yaw and bounded original tolerance. The external retry acquires a fresh basis, turns only the remaining angle, observes the original heading and release, and rolls back on a failed verifier. Unknown purchase/chat outcomes and all other goal types are ineligible and stay held. Verified repair continuation uses a separate create-only request; the supervisor checks matching repair/hold, page/character/memory/plan/budget invariants, effective source, deadline and latest operator command, and rechecks after controller resume before spawning. It does not set operator-budget-resume for repair. If a prior operator/budget hold existed, the repair does not resume it. This code path has fake HTTP, local Git and subprocess tests; no real replacement, retry, rollback or supervisor resume has been live demonstrated.

## G1–G10 contribution

| Goal | Status and evidence boundary |
| --- | --- |
| G1 | Path B configured the roles and finite caps; no real role preflight was run here. Actual Luna availability/allowance remains a live gate. |
| G2 | Actual mind + HTTP controller simulated three successive plans and preserved modal-to-world continuity. Real continuous gameplay is open. |
| G3 | Title-mode selection and generic UI are implemented; exact existing Rowan startup is open. |
| G4 | Existing native controls and zero-model smoke are retained. Actual movement, lease/scene/fault and release receipts are live-pending. |
| G5 | Partial workflows and observations as in the activity table; no complete live activity group. |
| G6 | Item/equipment/vital, field, own chat echo and scene observations are produced with bounded identity; no kill, quest, gold, purchase, spell-effect or save verification. |
| G7 | Saved plan/budget and repair hold restore; uncertain UI fences survive fake driver replacement. Real character/page/persona/memory continuity remains live-pending. |
| G8 | External proposal→Sol candidate→isolated staging→held apply/replacement→restricted failed-turn retry/rollback path is implemented; fake transport/HTTP/subprocess and real Git fixture tests only. Real Sol diagnosis, retry and rollback remain live-pending. |
| G9 | Decision packets, request identities, evidence records, hashes, repair status and usage separation are retained. Model-free fixture tests are not a real session reconstruction. |
| G10 | Caps, separate engineering receipts and no routine model call during local polling are implemented/tested with fakes. Real usage, PC contention and matched efficiency remain open. |

## Prepared runners and execution gate

- `node tools/native-smoke.mjs --case turn`: dry run; `--execute` performs one bounded zero-model native case on an already running driver and records a receipt.
- `node tools/player-acceptance.mjs --case snapshot`: dry run. For a later coordinated run, `--execute` captures an existing driver; `--case workflow --spec <json> --execute` performs one advertised workflow with a fresh UI basis, saves a redacted receipt, then stops. It starts no services and invokes no models.
- `node tools/repair-worker.mjs --run <run> --max-calls <1..5> [--max-proposals <1..5>]`: dry run. `--execute` enables the real subscription-only external Sol queue; `--apply` also enables held application and the restricted retry when eligible. Neither was executed here.
- `node tools/repair-stage.mjs --proposal <json> --patch <diff>` stages supplied local bytes only; `tools/repair-apply.mjs --stage <dir>` and `tools/repair-retry.mjs --stage <dir>` default to dry run and require `--execute` for live operations.

Before live acceptance, the director must coordinate PC availability, fresh subscription allowance, correct offline/online mode, selected Rowan save and stop conditions. Collect independent before/after receipts for each activity group, distinguish player-visible from verification-only data, and stop on unverified release or exhausted allowance. G11 remains separate.

## Verification and current limitations

The latest complete model-free suite and controller benchmark are recorded in the coordinating checkpoint; counts overlap and must not be added. Tests use actual HTTP routes with injected adapters, simulated game state and fake model transport; local Git and subprocess fixtures exercise staging, rollback and pre-existing hold checks. They do not establish renderer, CDP, server, or online behavior. The source-backed Rowan save selection, travel destinations, quest state, gold, save confirmation, spell/target results, input bindings and live repair require further work. Pending UI uncertainty may conservatively block all later risky UI until a specific observable predicate or manual reconciliation; no silent reset of the fence is justified.

## Verification at this checkpoint

On code revision `4777de4`, `node --test test/*.test.mjs` passed **226/226**, and the overlapping `node tools/native-benchmark.mjs` passed **104/104**. The benchmark is a subset/overlap, not an additional test count. `node tools/player-acceptance.mjs --case snapshot` was run in dry-run mode only. No live or model-powered commands above were executed.

## Next implementation and live-inspection sequence

1. Inspect the actual offline and online title/save cards with a fresh, zero-model snapshot and identify how a selected existing character's stable identity is shown before launch. Implement an explicitly authorized existing-save selection that rejects ambiguous same-name cards and verifies the resulting character; do not create a new Rowan.
2. Inspect the live inventory, spellbook, journal, map, trade/bank, save/recovery and chat screens separately. For each, add source-backed controls and a specific player-visible or own-state predicate; provide a fixture showing the intended before/after transition and a counterexample that stays unknown. Add configurable ordinary movement bindings and single-owner jump/run/crouch. Keep generic UI available for unfamiliar screens.
3. Review the repair worker and limited turn retry against the actual failure dossier. Extend retry eligibility only when an original authorized task, fresh basis and a meaningful outcome predicate are available. Validate the actual same-page/character replacement and rollback without clearing an operator/budget hold; current simulated repair is not that evidence.
4. After fresh allowance/PC coordination, run the zero-model native smoke, then the player acceptance cases with explicitly chosen existing save and safe controls. Record offline and online separately, stop on unknown transaction or unverified release, and preserve the exact source/receipt revision.
5. Only after the above, collect the bounded real role preflight, matched efficiency evidence and independent G1–G10 review. The hour trial remains G11 and is not authorized by this handoff.
