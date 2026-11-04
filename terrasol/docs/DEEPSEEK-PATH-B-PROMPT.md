# DeepSeek implementation handoff: Path B

Copy the prompt below into DeepSeek with local coding/filesystem access.

---

Implement Path B of our DFO agent project. Codex/Sol is implementing Path A in parallel. You are the sole Path B implementer; do not delegate to paid models or invoke real playing models.

Start in `%USERPROFILE%\Documents\DFO\DFO-TerraSol-DeepSeek`, branch `deepseek/mind-runtime`. This is your separate Git worktree. Do not edit the primary checkout `%USERPROFILE%\Documents\DFO\DFO-TerraSol`. First inspect Git status and read `docs/PARALLEL-WORK-PLAN.md`, `docs/PARALLEL-RUNTIME-CONTRACT.md`, `docs/INDEPENDENT-REVIEW-2026-10-28.md`, `docs/REVIEW-RESPONSE-2026-10-28.md` and `docs/THREE-TIER-MIND-PLAN.md`. Re-verify findings: the original review describes an older baseline and several defects have already been repaired. Your worktree's starting commit is the shared handoff baseline; preserve all later unrelated edits.

Your job is the three-tier mind and efficiency runtime:

- Luna: short-term tactical intentions and immediate choices.
- Terra 6.1: medium-term/session plans, priorities and reassessment.
- Sol 6.1: difficult/high-end decisions, post-session review and engineering handoffs. Actual engineering code execution stays outside the playing process.

Build one event scheduler/blackboard, not three independent polling loops. Add typed versioned plans and request/reply bases, stale-reply rejection, queued/coalesced escalation, cooldowns, configurable role routing, compact per-tier context, selective images/handbook retrieval, per-tier usage/latency and a budget governor. Preserve persona/memory and plan continuity. Subscription-only authentication is mandatory; no API billing fallback, no auto-resume after exhaustion/operator stop. Token caps are configured engineering limits, not a guessed conversion to subscription allowance. Confirm the exact available Luna identifier locally without a real model call, or require explicit configuration; do not silently substitute a model.

Own only the Path B files named in `PARALLEL-WORK-PLAN.md`: main/models/brain/protocol/memory/report/dashboard modules, new mind/scheduler/plan/budget/context/client-adapter modules, reload tooling and their tests. Add documentation in `docs/path-b/`. Do not change controller/browser/bridge/Body/executor or vendor sources, shared contract, README, package/config files, earlier checkpoint/review documents, runtime data or original DFO projects. If you need a shared change, record it in `docs/path-b/CONTRACT-REQUESTS.md` rather than editing another path's files.

Build against a fake driver implementing `dfo-control.v1`. Path A is supplying that interface in parallel; the baseline driver does not yet advertise it. Use capability negotiation and hold when requirements are absent. Preserve current public exports and historical log parsing. Local tasks must continue across multiple polls without another model request, and stale plan/target/request replies must never operate a new task. Keep metrics evidence-based: turning, dispatch, generic UI change and foe disappearance are not useful-play proof. Cache tokens are included in input, never added twice. Unknown developer/engineering usage is unavailable, not zero.

Extend revision archives to cover source, tests and vendor hashes, with clear hot-swap classes and rollback notes. Changes to bridge/engine currently require a suitable page/session reload; worker/driver/Body replacement can preserve the page. Do not promise all-layer hot updates.

Use built-in Node facilities where practical. Reuse existing memory, model transport, logging and native polling foundations. Keep changes incremental and inspectable. Test with fake models/driver only: routine skill progress without repeated calls; stale plans; escalation dedupe and single-flight queuing; unavailable tiers; operator stop; budget exhaustion leading to pause/hold; historical reports; context limits and persona/plan continuity. Run focused tests for your owned paths. The full engine-dependent suite will be reconciled in the primary checkout; your worktree intentionally has no ignored engine/assets/runtime profile.

Do not launch a browser/game/live trial, run paid model smoke tests, read or copy credentials/private identity files, create remote resources, or push/publish. These are scoped development tasks. Keep the user's three-tier goal, but challenge unjustified deadlines, reserve percentages and predicted savings from the review; label estimates honestly.

Commit only your owned files on `deepseek/mind-runtime`. Do not merge/cherry-pick Path A, reset/stash/clean, force anything, or touch the primary checkout. End with `docs/path-b/HANDOFF.md`: implemented behavior, commit IDs, tests/results, mock versus real evidence, contract requests, deferred work, reconciliation instructions and pending live checks. Summarize how to run your fake end-to-end scenario. Codex will reconcile both paths and run the combined suite before another gameplay trial.
