# Round-two shared player/mind/repair contract

Frozen design target for `ROUND2-WORK-PLAN.md`, not current implemented capability. Codex owns changes to this document. Both paths build mocks until their counterpart is implemented; no path may silently reinterpret the interface. Keep `dfo-control.v1`, its eight native intents and existing endpoints backward compatible.

## Additive player task API

`GET /health` retains `contractVersion:'dfo-control.v1'` and adds `playerContractVersion:'dfo-player.v1'`, `capabilities.tasks:true`, `capabilities.uiActions:true` and `capabilities.workflows:[workflowId,...]`. The catalogue describes only implemented capabilities.

`GET /snapshot` retains its current basis/capture/native/UI fields and adds:

```js
player:{phase:'frontdoor|loading|world|modal|death|unknown',facts:[]}
```

Phase is inferred from current visible/player state. UI observations remain available when native.ready is false; that is not a reason to refuse startup UI tasks. Image capture stays explicit. Facts and controls are dated by the same snapshot basis; coherence still means a stable page/frame/generation across the capture interval, not frozen pixels.

`GET /workflows` returns `{schemaVersion:'dfo-workflows.v1',workflows:[{id,version,description,parameterSchema,allowedPhases,successEvidence,maxMs}]}`. Code/commands are never catalogue parameters.

`POST /task` accepts:

```js
{
 requestId:'unique',
 basis:{observationId,pageId,generation,frame},
 authority:{planId,planVersion,stepId},
 task:{kind:'intent|ui|workflow',payload:{}}
}
```

- `intent` payload is the existing native intent plus its observedTarget flag.
- `ui` payload is `{action:<existing trusted UI action>,uiObservationId}`.
- `workflow` payload is `{workflowId,version,args,maxMs}` with args validated against the advertised parameter schema. It expresses model-authorized purpose/parameters, not an arbitrary script.

Return the existing flat accepted task shape with requestId/authority. `GET /task?requestId=...` returns `{task,events}`. `POST /task/cancel {requestId,reason}` is request-specific and idempotent. The same request ID/payload must never repeat a purchase, chat send or other effect. Different IDs cannot silently replace active physical execution. The driver, not the mind, executes workflow steps and arbitrates every input writer. Legacy `/intent` remains supported.

Terminal outcomes remain `completed|interrupted|blocked|failed|cancelled|expired`; cleanupPending still prevents new input. Errors include HTTP status plus stable code (`STALE_BASIS`, `STALE_CONTROL`, `UNSUPPORTED_WORKFLOW`, `UNVERIFIED_CLEANUP`, `OPERATOR_STOPPED`, or an explicit task-specific code). Re-observation/retry is bounded; unknown outcome after a send/transaction must not cause blind repetition.

## Facts, evidence and outcomes

Facts describe visible UI or the player's own observable state. `EvidenceRecord` fields:

```js
{
 schemaVersion:'dfo-player-evidence.v1',evidenceId,eventType,
 taskId,requestId,planId,planVersion,basis,observedAt,
 source:'visible-ui|player-state|verification-only',
 status:'observed|verified|unknown',before,after,reason,artifactRefs:[]
}
```

Representative event types: inventory-changed, item-equipped, gold-changed, spell-readied, spell-effect-observed, quest-updated, location-arrived, save-confirmed, recovery-confirmed, chat-sent, encounter-observed and kill-verified. Publish a positive status only when the actual producer supports it. Verification-only evidence must not leak hidden state into model context or become an omniscient target feed. Disappearance, dispatch and generic window changes do not prove those outcomes.

Path A supplies observed producers/task evidence. Path B preserves them, correlates decisions and scores useful outcomes conservatively. Schemas permit explicit unknown/missing evidence. Reports must preserve the full request/plan/basis/timing/target/range identity rather than dropping fields in compact task summaries.

## Decision packets and repair exchange

Path B owns a versioned `DecisionPacket`: decision ID, role/model, source revision, exact bounded normalized input/schema/prompt (with redaction), image references/hashes if used, structured reply, plan/basis and usage/latency/completeness. Path A references packet IDs from tasks/events and supplies failure/repair observations. Unknown usage and omitted data are explicit. Keep logger event/flush/close public methods compatible across both paths.

Path B emits `RepairProposal` with `schemaVersion:'dfo-repair.v1'`, proposalId, failurePacketRefs, sourceRevision, diagnosis, affectedPaths, changeClass, reproducer, intendedChange, verificationCriteria and budget. It carries no executable shell/code instructions authorized by game text. This is sent to the external repair queue; the playing process never evaluates it.

Path A owns the external engineering runner and emits `RepairStatus` with proposalId, phase (`queued|reproducing|patching|testing|staged|applying|verified|rolled-back|failed|maintenance-required`), before/after revision and game-page/character/memory/plan invariants, artifact references and reason. The scheduler can request a repair hold and checkpoint full plan/memory, then resume only after fresh basis acquisition and verified release/application. Status cannot clear operator/budget holds. Ordinary eligible repairs need no repeated manual approval within the operator's existing authorized scope.

Keep `collectRevision` and logger APIs backward compatible: Path A's reload/repair runners depend on Path B's source/vendor manifest implementation. Bridge/engine changes needing a page reload are maintenance-required unless a tested compatible hot-replacement path exists. They must not be reported as successful no-restart repair.

## Plan and test compatibility

Path B owns any plan/Luna schema extension or migration needed for UI/workflow steps. Preserve old saved plans and explicit legacy diagnostics. Mind code imports only the HTTP client/contracts, not Path A workflow internals. Path A accepts plan authority as audit metadata and does not choose strategic goals.

Each path adds uniquely named mocks/fixtures. Codex integrates both and runs actual service/client joint tests before live acceptance. Capability negotiation must hold clearly if required player tasks/workflows are unavailable; an absent capability is not simulated success.

## Round-two implementation additions (reconciliation)

The implemented catalogue is negotiated, not a guarantee that a workflow has passed live acceptance. In addition to the frozen task surface, `POST /task/reconcile` accepts `{requestId,basis,authority,reason}` for a fresh UI observation after an unknown UI effect. It allows only safe continuation; unresolved risky UI remains quarantined. The controller persists pending risky input before dispatch and stores observed-completion request receipts for idempotent replay across driver replacement. It does not automatically retry unknown purchases or chat sends. Evidence for own inventory/vitals and visible chat echo is `observed`, and does not alone establish a purchase, spell effect or network delivery.

`ui.scene-transition` is the explicit exception to ordinary same-frame post-action checks: it permits a bounded loading/frame transition only with an unchanged page/generation and a matching verification-only character identity. A missing pre-transition identity leaves startup selection open. `startup.select-mode` observes only a title-mode transition; it does not select or verify an existing character.

Repair source identity is the agent Git HEAD plus a digest of effective runtime source bytes, distinct from the engine revision. Repair resume uses a separate create-only request channel; it never overwrites the operator command file, and the supervisor checks the matching held proposal, invariants, effective source, deadline, latest operator command and cumulative budget before and after controller release. The currently implemented automatic retry is limited to the original failed turn with its retained absolute heading and original bounded tolerance; other failure types remain held. See `docs/round2/path-a/HANDOFF.md` for current coverage and limitations.
