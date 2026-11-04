# Native control integration contract

Lead-owned interface. Agents must report a required change before changing another stream's contract.

## Bridge stream

`src/native-bridge.mjs` exports:

- `ensureNativePort()` installs tracked bridge sources/host patch into the isolated configured engine and returns `{engineCommit, sources, patchedFiles}`. It does not launch a server/game/model.
- `readNative(page, after = 0)` returns `{ready, reason?, state, view, window, events, targets}` from the installed legacy-compatible `window.__agent`. `state` preserves the legacy Body contract (`pos`, `yaw`, `pitch`, `frame`, `mode`, vitals, foes, overlay/paused/loading/weapon); `events` is `{lines, dropped}`. `ready:false` is explicit unavailability. For a matching fresh state/view scan, `targets` contains wrappers `{kind:'foe',target:<exact state.foes entry>}` followed by `{kind:'thing',target:<exact view.things entry>}`; it is empty for stale scans. A model's `targetIndex` refers only to this exact observation, and the worker passes the wrapped legacy object to the executor. Recheck freshness before acceptance; do not reinterpret an old index against a different target list.

The engine bridge must preserve the legacy `__agent` methods needed by the Body: `state`, `view`, `_scan`, `events`, `press`, `release`, `releaseAll`, `look`, `swing`, plus relevant visible-map/window readers. Adapt the ported source to the current engine rather than rewriting this interface. Inputs use existing player binding/look/attack hooks. Visible foes carry a frame-scoped opaque `targetId`, stable across movement of that actor and invalidated by frame/bridge replacement. Acceptance matches that handle against the fresh observation and refreshes its coordinates; whole-object equality would incorrectly reject moving foes during model latency. Unseen actors are never exposed through the handle. Static things may use kind and coordinates as their identity.

Bridge owner: `vendor/native-agent/**`, `src/native-bridge.mjs`, native bridge installation patch/artifacts, `test/native-bridge*.test.mjs`, `docs/NATIVE-BRIDGE.md`, isolated engine agent modules and world-host wiring. No `src/browser.mjs` edits.

## Body stream

`src/body-runtime.mjs` exports:

- `installBody(page, {reload = false} = {})` installs/replaces the vendored legacy Body; returns source hash and Body identity. Replacement is idle/disabled, releases inputs, and disposes the prior clock.
- `readBody(page, after = 0)` returns `{ready, reason?, status, events}`.
- `commandBody(page, method, argument, expected)` permits the legacy `enable`, `setPolicy`, `setGoal`, and `setNavigation` methods plus the port's `setCombatGuard`; validates/reports their existing receipts and checks Body/frame/page identity atomically before dispatch.
- `stopBody(page)` disables the Body and releases native inputs.

`src/intent-executor.mjs` exports `createIntentExecutor({page, emit = () => {}, now = () => Date.now()})`, yielding:

- `start(intent, basis)` -> accepted task receipt. `basis` is `{generation, frame}`. Starting a new task cancels the previous one.
- `poll()` -> `{task, events}`. No model calls. It updates observed progress and returns terminal outcome when demonstrated.
- `cancel(reason = 'operator stop')` -> cancelled receipt and released inputs.

`intent` has `{kind, target?, degrees?, range?, maxMs?, stopHpPct?}`. Kinds: `turn`, `look`, `goto`, `use`, `explore`, `fight`, `retreat`, `stop`. `target` is a legacy current observed target, or `{x,z}` for a supported observed-ground destination. `turn.degrees` is signed relative degrees. Default maximum execution 30 seconds (90 for bounded exploration), hard cap 90 seconds; finite Body leases are renewed only while the current task and bridge identity remain valid. Fight/retreat use a temporary validated policy for the model's chosen action; restore the previous policy on termination, without writing into a replacement Body. They track the chosen sensed hostile and yield if the Body would select another actor. Optional `stopHpPct` is within 0..100, defaults to 35, and sets the combat health floor; noncombat still yields on any damage. Damage during combat is progress evidence, not automatically a new model decision. Exploration reuses the legacy bounded frontier hand.

`task` is `{id, kind, status, outcome?, reason?, startedAt, endedAt?, progress}`. Status is `running` or `terminal`. Outcome is `completed|interrupted|blocked|failed|cancelled|expired`. `progress` includes available displacement/angular/interaction/health evidence with a clear distinction between dispatch and observed effects.

Review repair: exploration defaults to 90 seconds, other intents to 30 seconds; the 90-second hard cap applies to both. Turn completion uses the actual Body faceToleranceDeg and retains its arrival receipt. Task termination is recorded before best-effort physical cleanup. `cleanupPending:true` blocks new execution until cancellation successfully retries cleanup; cleanup errors remain in the receipt. Body events include `lostThroughSeq`; loss of unread events interrupts execution explicitly. Native reads request a fresh camera sample before collecting state/view; screenshot/UI observations are still a separate basis.

The combat guard also runs within each 50ms Body tick before input. It checks the chosen target ID, frame, scan freshness, and health floor; failure releases input, disables the Body, and refuses renewed leases until cleared. Poll-time checks alone would allow the legacy nearest-hostile policy to switch actors between polls.

Body owner: `vendor/legacy-agent/**`, `src/body-runtime.mjs`, `src/intent-executor.mjs`, `test/body-*.test.mjs`, `test/intent-*.test.mjs`, `tools/native-benchmark.mjs`, `docs/BODY-PORT.md`. No main/browser/protocol edits.

## Integration stream

Driver endpoints:

- `GET /native?after=N` -> `readNative` plus driver generation.
- `POST /intent {intent,generation,frame}` -> executor start receipt, rejecting stale basis or an operator stop.
- `GET /intent` -> current task/events from executor poll.
- `POST /intent/cancel {reason}` -> cancel receipt.
- `POST /resume` -> explicitly clears the operator stop latch for the current supervisor epoch.

The driver owns the executor and all physical control authority. `/stop`, `/pause`, shutdown, scene identity changes, and driver replacement cancel native execution and release input. `/action` may execute trusted UI input only after cancelling/disabling native execution; simultaneous actors are forbidden. Existing browser endpoints remain supported.

The worker uses `--control native|browser`, default native; the native game startup URL includes `agent=1`. On attachment, do not silently navigate or reload an existing page missing its bridge. Native movement requires bridge readiness and receives compact native state and task outcomes. Before the world has booted, genuine front-door/load/character-creation UI may use trusted UI actions; this is an explicit UI startup state, never a timed movement fallback. Add a native pilot schema allowing either a native `intent` or existing UI `action`, exactly one non-null. Keep the old schema for explicit browser diagnostic mode. Schema normalization does not turn unavailable/ambiguous targets into guessed targets.

In native mode the worker starts an intent, locally polls until completion/interruption/failure, logs progress, checkpoints memory, and calls Terra when a new decision is required. Sol retains high-level planning authority. No repeated screenshot/model request while an unchanged native task is progressing. Images remain available for UI/ambiguous visual decisions; player state/receipts should be compact and nonduplicative.

Integration owner: `src/browser.mjs`, `src/main.mjs`, `src/protocol.mjs`, `src/brain.mjs`, `src/report.mjs`, `src/dashboard.mjs`, `test/browser.test.mjs`, `test/protocol.test.mjs`, `test/cycle.test.mjs`, `test/report.test.mjs`, `test/native-integration.test.mjs`, `docs/NATIVE-INTEGRATION.md`. Model transport/billing configuration and Rowan's durable-memory implementation remain unchanged unless a concrete blocker is reported to the lead.
