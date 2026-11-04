# Path B contract requests / reconciliation notes

Status: no shared contract file was edited. These are implementation expectations
and small clarifications for Path A inside the frozen `dfo-control.v1` boundary.
Path B depends only on HTTP plus existing public exports; it does not import new
Path A internals.

## 1. `/health` capability names

Path B requires exactly one of these for each feature and fails closed if absent:

| Field | Accepted forms in adapter | Required |
| --- | --- | --- |
| `contractVersion` | `contractVersion: 'dfo-control.v1'` (or `contract`) | yes |
| supported intents | `capabilities.intents` array | all `turn,look,goto,use,explore,fight,retreat,stop` |
| snapshot | `capabilities.snapshot === true` or `.snapshot.supported === true` | yes |
| request fencing | `capabilities.requestFencing === true` or `capabilities.fencing === true` or `.requestFencing.supported === true` | yes |
| images | `capabilities.images === true` or `.image === true` or `.images.supported === true` | optional; image requests fail closed if false |
| UI observation | `capabilities.ui === true` or `.ui.supported === true` | optional |

Request: please advertise one canonical spelling (`snapshot`, `requestFencing`,
`images`, `ui` as booleans plus `intents`) so the logged capability document is
unambiguous. The adapter tolerates the aliases above, but only as a temporary
bridge; no silent success is claimed against a baseline driver.

## 2. Snapshot and image shape

- `GET /snapshot?ui=0|1&image=0|1&after=N` must return a coherent sample with
  `observationId`, `basis{pageId,generation,frame}`, `captured.coherent:true`,
  and a `native` block with `ready`, `state`, `events` and `targets`.
- If the frame/page/generation changes during capture, return a retryable
  unavailable/coherence failure rather than mixing frames. Path B retries a
  bounded number of times.
- For selective images, Path B reads `ui.screen` (or `screen`) as a PNG path only
  when the role's image policy and the current UI/ambiguity flag allow it. Please
  keep this field optional and do not require a screenshot for native decisions.
- Typed targets should preserve `{kind:'foe'|'thing', target:<sensed entry>}`
  wrappers. Foe `targetId` stability/invalidation is Path A's responsibility.
  Path B resolves plan targets by `targetId`/handle or by observed thing
  coordinates; it never reuses a target index across observations.

## 3. Intent lifecycle

- `POST /intent` must echo `requestId` and `authority`, preserve the current flat
  task fields, and return `replayed:true` when an identical request is replayed.
- `GET /intent?requestId=...` must return only that task; an unknown/old request
  ID is an explicit stale/failed result, not the current task.
- `POST /intent/cancel {requestId,reason}` must cancel only that request and be
  idempotent.
- A different request must never silently replace a running task; Path B cancels
  explicitly before a new dispatch.
- Include `cleanupPending:true` whenever physical input cleanup is unverified;
  Path B holds on that state rather than starting new work.
- 409 for stale basis/generation/frame is expected and is mapped to a blocked
  outcome and a Terra reassessment. Please include a stable error code/status.

## 4. Evidence for report/reconciliation

The Path B report currently trusts the existing task terminal fields and metric
v2 (`progress.displacement`, `remaining`, `targetDistance`, `range`,
`progress.interaction`). To score combat, quests, items and saves, please add
conservative `task.evidence` classes that describe observations rather than
grant success, for example:

- movement/place transition evidence with an observed zone/page/scene identity;
- interaction evidence naming the exact window/door/control and outcome;
- encounter/kill/clear evidence that distinguishes a player-blame kill from a
  target merely disappearing from view;
- save/load or death/recovery confirmation.

Path B will consume only evidence Path A marks as observed and will keep unknown
outcomes unknown. Do not make disappearance alone a kill or clear.

## 5. UI actions

Path B does not implement a second input controller and does not edit
`/action`. If startup/creation or complex UI skills need a new endpoint or richer
skill receipt, record it as a shared-contract change first; do not bypass the
trusted UI broker. The current scheduler holds when the native world is not
ready, and the legacy browser worker remains available explicitly.

## 6. Operator stop / pause semantics

- `/stop` must latch control and release input; `/resume` is an explicit
  supervisor/operator action, never a stale-request retry.
- Path B never auto-resumes after budget exhaustion or operator stop; it writes
  `paused-budget`/`mind-pause`, releases with `/stop`, pauses the game and exits
  non-zero for the supervisor to hold.
