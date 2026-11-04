# Independent review response and first repairs

Date: 2026-10-28. Source review: `INDEPENDENT-REVIEW-2026-10-28.md`, based on checkpoint `6ad4939`. The review itself is preserved unchanged. This response distinguishes verified repairs from accepted work that remains open.

## Decision

Adopt one scheduler and one physical executor for the user's three decision horizons: Luna immediate tactics, Terra 6.1 session planning, Sol 6.1 difficult decisions and post-session engineering. Avoid three continuously polling model loops. First repair the native control contract and outcome measurement; then build versioned plans, event routing and explicit per-tier budgets over that foundation.

The current two-tier native runtime is a baseline, not demonstrated native play. The previous 21m18s trial exercised browser actions. Its token and latency figures cannot establish native savings or Luna's cost. The review's estimated fixed overhead is a regression on that trial, not a proven universal lower bound for every model or transport. A two-second Luna reply TTL would need measurement against actual latency before adoption. The suggested reserve percentages and predicted savings also remain experimental.

## Reproduced and repaired

New tests reproduced six reported failures before fixes: turn tolerance/receipt retention, terminal cleanup failure, unread event loss, overlay-as-interaction success, idle target freshness, and turn-as-progress accounting.

| Finding | Repair and evidence | Remaining limits |
| --- | --- | --- |
| Idle scan age can exceed target freshness | A native read requests a fresh camera scan before collecting state/view in one non-yielding page evaluation. An actual engine bridge test advances the idle outdoor clock past 200ms and verifies fresh targets retain their handles. | Screenshot/DOM and native observation are still separate samples. This is not an atomic whole-screen snapshot. |
| Body considers a turn finished within its policy tolerance, executor required 2 degrees | Executor reads the Body tolerance, records it, and retains the arrival receipt across polls. An integration test runs the actual vendored Body against the executor until both agree on completion. | Actual game turn accuracy, timing and desired tolerance remain live checks. No perfect-heading claim. |
| Stop/restore rejection can leave a task running | Mark terminal before cleanup; retain cleanup errors, block new input while cleanup is unverified, and allow explicit cancellation to retry cleanup. Logging failure cannot prevent release. Worker holds on unverified cleanup. | A permanently unresolved page-evaluate operation and end-to-end HTTP/driver-crash timing still need fault tests. Lease expiry remains the independent release bound. |
| Completion evidence can be consumed/lost | Retain arrival evidence for the active task. Body exposes the last sequence discarded by overflow; missing unread events interrupt explicitly rather than producing a false completion or waiting to expire. | Other completion classes still need stronger task/plan identifiers and latched evidence. Scan pruning is distinct from ordinary log overflow. |
| A checking flag plus an unrelated overlay could certify use | A window requires an explicit Body use receipt, not just the checking flag. A regression reproduces the earlier false success. | The Body's HUD/window evidence can still be weak or unrelated. Stronger item, dialogue, door and quest predicates remain open. |
| Successful exploration is mapped to interrupted | Successful exploration hand completion maps to completed, preserves its evidence, and defaults to the existing 90-second exploration bound. The 90-second hard cap and explicit shorter maxMs remain. | This is bounded exploration completion, not proof of an exit, quest or useful discovery. A hand-boundary test establishes the mapping, not live navigation. |
| Report counts a completed turn as useful play | Metric v2 counts evidenced arrival after at least 2m movement, observed retreat separation after at least 2m, or place transition. Excludes turns, weak UI effects, tiny motion, and pending cleanup; deduplicates task IDs within epochs. | These are state transitions, not demonstrated useful goals. Kill, quest, item, save/load and browser-mode parity still need evidence producers. Raw outcome counts remain available separately. |
| UI timeout stops the controller, then keeps buying decisions against its latch | A timed-out action now cancels and holds the worker for repair. It never silently clears an operator stop or continues the same decision loop. | Bounded automatic recovery and operator-stop/recovery separation remain open. |
| Frequent polling rewrites unchanged memory and replays native events | Removed memory checkpointing from every intent poll; memory is checkpointed at decision/outcome boundaries. Status progress is throttled to two seconds or terminal state. Native events use a cursor. | Body scan/event logging can still be large; image retention, prompt budgets and separate state deltas remain open. |

## Review qualifications

- Retreat already had an observed-separation completion branch; fight did not. The review's statement that both lack completion is too broad. Fight termination and target-switch/occlusion behavior still need redesign.
- The installed bridge already ticks its scanner every 50ms, independently of a Body goal. Its idle scan *sampling cadence* remains slower than freshness; that is the reproduced defect. The scan clock being absent was not the cause.
- Do not infer a kill or an area being clear simply because a foe disappeared for several samples. The agent could be looking away or the target could be occluded. A combat skill needs explicit encounter, visibility and completion evidence before a positive terminal is trustworthy.
- The new turn test uses the actual Body but a simulated input hook. The native freshness test imports real engine modules but uses a simulated page. Neither establishes CDP, HTTP, rendering or live control.
- Existing hot-repair support does not make every layer hot. Worker/driver/Body replacement can preserve the page; current bridge/engine host updates need an appropriate page/session reload. Revision archives must include vendor sources before claiming reproducible repair of this port.

## Work remaining, in order

1. Complete model-free contract work: atomic observation basis, typed stable thing/person handles, task IDs/idempotency, source/vendor manifests, cleanup timeout/driver-failure tests and HTTP concurrency tests. Recheck uncovered relocation paths against the engine rather than assuming all teleports invalidate frames.
2. Add bounded skills with explicit evidence: encounter/fight/retreat and occlusion hysteresis first, then door/navigation and normal-player UI/recovery tasks. Local subgoals must remain within model-authorized plans. Avoid implementing a general behavior-tree engine before needed.
3. Add versioned plan/blackboard contracts, coalesced escalation queues, selective context/images, outcome-aware scheduling and per-tier usage/budget limits. Preserve subscription-only operation and hold on exhaustion; separate engineering usage rather than reporting unavailable usage as zero.
4. Wire Luna/Terra/Sol through that scheduler with measured latency and context budgets. No periodic empty reviews and no per-keypress model decisions. Compare two-tier and three-tier routing with the same skills and evidence.
5. When gameplay is resumed by the user, begin with a short zero-model live native smoke. Freeze code during measured runs, log any intervention, then use capped model comparisons before the one-hour trial. No live smoke, paid model call, browser or game is started by this review-response task.

## Validation

The full suite passed **131 tests** using `node --test test/*.test.mjs`; the overlapping controller subset passed **92 tests** using `node tools/native-benchmark.mjs`. No tests failed or were skipped. This includes a regression preventing task replacement from bypassing failed stop cleanup. Vendored-source hashes were updated and the native installer tests verified managed installation. Local game/control/debugging ports remained closed. Live native reliability and actual cost reductions remain unmeasured.

Checkpoint tag: `checkpoint/2026-10-28-review-repairs`. The earlier `checkpoint/2026-10-28-three-tier-review` remains available as the pre-repair baseline. A Git bundle of the new source checkpoint is stored locally under `data/checkpoints/2026-10-28-review-repairs/`; runtime saves and memory remain in the existing data folder.
