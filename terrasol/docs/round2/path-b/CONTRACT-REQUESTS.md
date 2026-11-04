# Path B round-two contract requests

No shared contract file was edited. Path B implements the frozen `dfo-player.v1`
target against mocks. These are expectations for Path A at reconciliation.

## 1. `/health` and `/snapshot` player surface

- Keep the existing `dfo-control.v1` fields. Add:
  - `playerContractVersion:'dfo-player.v1'`
  - `capabilities.tasks:true`
  - `capabilities.uiActions:true`
  - `capabilities.workflows:[implemented workflow ids]`
- `GET /snapshot` keeps the existing basis/capture/native/UI fields and adds
  `player:{phase:'frontdoor|loading|world|modal|death|unknown', facts:[]}`.
- UI observations must remain available when `native.ready` is false; the Path B
  scheduler now plans startup/modal/death tasks in that case instead of holding.
- Path B tolerates the capability aliases the control client already accepts, but
  canonical booleans are requested so the capability log is unambiguous.

## 2. Workflow catalogue and `/task`

- `GET /workflows` returns `{schemaVersion:'dfo-workflows.v1', workflows:[...]}`.
  Each record contains `id`, `version`, `description`, `parameterSchema`,
  `allowedPhases`, `successEvidence`, `maxMs`. Code/commands are never parameters;
  Path B rejects prohibited keys.
- `POST /task` accepts `{requestId, basis, authority, task}` with
  `task.kind` of `intent`, `ui`, or `workflow`. The intent payload is the existing
  native intent plus `observedTarget`; the UI payload is
  `{action, uiObservationId}`; the workflow payload is
  `{workflowId, version, args, maxMs}`.
- Echo `requestId` and `authority`. Make same-ID/same-payload idempotent; reject
  conflicting reuse and implicit replacement of an active task. Include
  `cleanupPending` on terminal tasks whose release is not verified.
- `GET /task?requestId=...` returns that task only; `POST /task/cancel` is
  request-specific and idempotent. Legacy `/intent` stays compatible.
- Workflow args are validated by Path A against the advertised schema; Path B also
  validates the subset it can see. Unknown workflow/phase is a bounded failure and
  a Terra reassessment, not a fatal driver error.
- A workflow must not invent a quest choice, purchase, conversation or strategic
  destination beyond its declared model-authorized args.

## 3. Evidence identity

Path B preserves `EvidenceRecord` fields: `schemaVersion`, `evidenceId`,
`eventType`, `taskId`, `requestId`, `planId`, `planVersion`, `basis`, `observedAt`,
`source`, `status`, `before`, `after`, `reason`, `artifactRefs`. Please include
them on terminal tasks and in emitted evidence events. Path B counts only
`status:'verified'` and representative useful event types; disappearance,
dispatch, or a generic window change must stay observed/unknown.

## 4. Repair exchange

- Path B writes typed proposals (`dfo-repair.v1`) to
  `data/runs/<run>/repair-proposals/<proposalId>.json` through
  `src/mind/repair.mjs`; Path A's external executor should consume that queue.
- Path B polls `data/runs/<run>/repair-status.json` (atomically replaced by Path A)
  and calls `scheduler.receiveRepairStatus`. Status fields:
  `schemaVersion:'dfo-repair-status.v1'`, `proposalId`, `phase` (one of
  `queued|reproducing|patching|testing|staged|applying|verified|rolled-back|failed|maintenance-required`),
  `at`, `beforeRevision`, `afterRevision`, `invariants`
  (`characterPreserved`, `pagePreserved`, `memoryPreserved`, `planPreserved`),
  `artifactRefs`, `reason`.
- A `verified` status must include `afterRevision` and character/page invariants;
  Path B clears only its repair hold and never an operator or budget hold.
  `applying/staged/...` holds the current task and checkpoints plan/memory. A
  failed/rolled-back/maintenance-required status pauses for an operator.
- If the external runner prefers an HTTP endpoint instead of the status file,
  record the exact transport in the shared contract; the scheduler method is the
  same.
- Do not execute generated code in the playing process. Bridge/engine repairs
  requiring a page reload remain maintenance-required, not a successful hot repair.

## 5. Source revision and telemetry

- Path B records `sourceRevision` from `DFO_SOURCE_REVISION` or the engine commit;
  Path A's repair runner should set/report the Git revision so packets and repair
  proposals share identity.
- Preserve logger `event/flush/close` and `collectRevision` APIs; Path A's reload
  and repair runners depend on them.
