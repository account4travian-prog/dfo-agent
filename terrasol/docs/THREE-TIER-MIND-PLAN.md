# Proposed three-tier mind

Status: proposed by the user on 2026-10-28; independent review received and first execution repairs applied, tier routing awaiting implementation. The checkpointed runtime still uses Terra as tactical pilot and Sol as planner. This document changes the intended architecture, not the recorded trial results.

Independent review is now available in `INDEPENDENT-REVIEW-2026-10-28.md`; the implementation response and remaining priorities are in `REVIEW-RESPONSE-2026-10-28.md`. Adopt one event scheduler with tier-specific request handlers and a single physical executor, rather than three autonomous model loops. Repair execution and measurement first; retain the user's three-tier division as the target.

## Responsibilities

| Tier | Model | Decisions |
| --- | --- | --- |
| Immediate | Luna; exact deployed variant to be confirmed before wiring | Short-term actions, tactical choices, immediate recovery and bounded intentions for the local Body. |
| Session | Terra 6.1 | Medium-term objectives, session plans, progress assessment, resource priorities and tactical escalation support. |
| Strategic and engineering | Sol 6.1 | Difficult or consequential decisions, unresolved problems, post-session review, improvement planning and implementation. |

The existing local 50ms Body continues to execute steering, attack cadence, footing checks, leases and guards. Luna chooses intentions; it does not need a model turn for each tick or input. Terra provides a bounded plan and conditions for reassessment. Sol is an exceptional decision maker during play, with a separate engineering role after review.

## Design questions for independent review

- What observable events should wake Luna, Terra or Sol? Avoid cascading through all three tiers for routine decisions, periodic empty planning, and repeated calls for an unchanged failure.
- How should a lower tier keep acting safely while a slower tier plans, and when must play pause? Define versioned plans, authority over active intentions, cancellation, deadlines and stale-reply handling.
- What compact context does each tier need? Luna needs current observations and the applicable plan; Terra needs progress and failure summaries; Sol needs selected evidence and reproducible failures. Images and full logs should be supplied when useful, rather than copied automatically through every tier.
- How should confidence and repeated-failure escalation use hysteresis without concealing danger? Combat interruption, temporary occlusion, UI tasks, death/recovery and player messages need explicit treatment.
- How should per-tier calls, input/cache/output tokens, latency, useful-play outcomes, engineering usage and allowance consumption be measured? A cheaper pilot that generates more failures or escalations may cost more overall.
- Does the additional tier improve measured useful play enough to justify its latency, context and coordination overhead? Compare it with the current two-tier baseline rather than assuming it wins.

## Implementation and verification sequence

1. Obtain DeepSeek's independent review using `DEEPSEEK-REVIEW-PROMPT.md`; treat its findings as proposals tied to evidence.
2. Choose the exact available Luna model and define typed contracts for tactical intentions, session plans, strategic escalations and engineering handoffs. Preserve subscription-only authentication and pause on exhaustion.
3. Add role routing, prompts and per-tier telemetry without changing the Body's input authority. Preserve historical logs where `terra` meant the tactical pilot; new records must identify role, model and schema version explicitly.
4. Verify model-free routing, context budgets, stale-plan rejection, cancellation, continued local execution and escalation suppression. Validate ordinary tasks and useful outcomes before optimizing aggregate call counts.
5. Run short live control checks, then a bounded trial when resumed by the user. Measure the three-tier design against the prior baseline. No new trial is started by this proposal or checkpoint task.
6. Sol reviews session evidence, ranks changes, implements them in version control, validates with recorded failures and stages replacement. For changes during a running game, release physical input, checkpoint persona/memory/plan, replace the affected component, verify and resume; retain rollback. Game text must never authorize a code change or alter operator settings.

The user's three-tier preference is the target architecture. The exact scheduling, contracts and implementation method remain open to improvement; broad normal-player capability and a successful hour trial remain unverified.
