# Shared runtime contract for parallel work

Contract target: `dfo-control.v1`. This is a frozen integration target, not a claim that the baseline driver already implements it. Codex owns its implementation and contract edits. DeepSeek builds against a fake driver until the real driver advertises support. Existing endpoints remain compatible with the old worker while both paths are developed.

## Common rules

- Single driver/executor owns physical input. Models choose goals, plans and bounded intentions. Playing models never execute generated code.
- Retain legacy intent kinds: `turn`, `look`, `goto`, `use`, `explore`, `fight`, `retreat`, `stop`. New skill/intent kinds require an explicit shared-contract change and capability advertisement.
- Current intent arguments remain `target?`, `degrees?`, `range?`, `maxMs?`, `stopHpPct?`; UI actions retain the current schema. Target list indexes are resolved only against their captured observation. Stable handles are rechecked against current observed targets, never reassigned to a different actor.
- Task outcomes remain `completed|interrupted|blocked|failed|cancelled|expired`. Positive completion requires explicit evidence; dispatch or disappearance alone never proves useful progress, a kill or clear area. `cleanupPending` and cleanup errors remain first-class fields and prevent new execution.
- Preserve model-role and historical-log distinctions: old `terra` records meant tactical pilot; new records must carry schema version, role and model.

## Driver integration target

`GET /health` advertises `contractVersion:'dfo-control.v1'`, `generation`, and `capabilities` (supported intents and snapshot/request-fencing support). A new three-tier worker must fail closed/hold when required capabilities are absent; it must not silently claim to be active against the baseline driver.

`GET /snapshot?ui=0|1&image=0|1&after=N` returns:

```js
{
  contractVersion:'dfo-control.v1', observationId:'opaque',
  basis:{pageId:'opaque',generation:123,frame:1},
  captured:{startedAt:'ISO',endedAt:'ISO',coherent:true},
  native:{ready:true,state,view,window,events,targets},
  ui:null // or the existing visible UI observation; screen is optional
}
```

`coherent` means the page/generation/frame stayed constant across the capture interval. It does not mean the game or rendered pixels were frozen. A changing frame produces an unavailable/retry result rather than mixing frames. Image capture is explicit; no screenshot should be required for every native task decision. The snapshot must say when UI or native state is unavailable. Native targets preserve wrappers `{kind:'foe'|'thing',target:<sensed object>}` and legacy fields; new handles may add fields without removing old ones.

`POST /intent` accepts:

```js
{
  requestId:'unique-id',
  basis:{observationId:'opaque',pageId:'opaque',generation:123,frame:1},
  authority:{planId:'plan-1',planVersion:2,stepId:'step-3'},
  intent:{kind:'explore',maxMs:60000},
  observedTarget:false
}
```

Response is the accepted task object, preserving the current flat receipt shape, plus `requestId`, `authority`, and `replayed` if applicable. Same request ID and same semantic payload within one driver generation is idempotent; conflicting reuse is 409. Different requests cannot silently replace a running task: cancel explicitly first. Request IDs must not be reused across decisions. The driver treats plan fields as opaque audit metadata; Path B owns current-plan validation before dispatch. Generation/frame/page/observation and target acceptance belong to Path A.

`GET /intent?requestId=...` returns `{task,events}` for that request. Unknown/stale request IDs cannot be interpreted as the current task. A request-specific cancel uses `POST /intent/cancel {requestId,reason}` and cannot cancel a newer unrelated task. `/stop`, `/pause` and shutdown remain global operator actions; they latch control and release input. `/resume` is an explicit supervisor/operator operation, never a routine stale-request retry. Legacy requests without request IDs remain a compatibility path for the old worker only.

`task` preserves `{id,generation,frame,kind,status,outcome?,reason?,startedAt,endedAt?,progress,cleanupPending?}` and adds `requestId`, `authority`, and optional `evidence`. Evidence classes must describe observations (movement, place, interaction, encounter/kill verification where supported), not grant unobserved success. Path B's report consumes supported evidence conservatively and preserves unknown outcomes.

Trusted UI actions continue through `POST /action` with current `generation`, UI `observationId`, and `action`. The driver cancels/disables Body control first. DeepSeek must never implement a second input controller. If richer UI skills need an endpoint, record a contract request instead of bypassing this boundary.

## Path B adapter and validation

Path B may put a client adapter in a new owned module. Its tests inject a request function and fake model transport; no real browser, game or model is needed. Build scenarios using the target contract, and keep a clear capability guard until Path A supplies it. No direct imports from new Path A internals; depend on this external interface and existing public exports only.

Shared-file change requests belong in `docs/path-b/CONTRACT-REQUESTS.md`, with rationale and compatibility tests. This document and the file ownership plan remain unchanged until reconciliation.
