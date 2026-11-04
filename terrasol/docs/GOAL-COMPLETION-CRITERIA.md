# Remaining work and project completion criteria

Definition date: 2026-10-28. Verified code baseline: `dd08748`. This checklist defines the remaining goal, not an authorization to start gameplay or a claim that its acceptance checks have passed. No code or game behavior is changed by this document.

The goal is a persistent DFO adventurer with its own persona/memory, model-directed decisions, accurate ordinary-player controls, low model overhead, useful autonomous play, and a working live improvement loop. The current foundation is a reconciled controller and three-tier runtime with 172 model-free passing tests. That is not yet a demonstrated autonomous player.

Each item below remains OPEN until its implementation and stated evidence exist. Numerical checks are proposed operational targets, not measured results or existing user-approved performance claims.

## G1 - Configure and verify the actual three-tier mind

Remaining: choose an actually available Luna model identifier, configure its allowlist and explicit session caps, and verify all three real role transports. The current Luna default is unset and default session token/call caps are null; no relevant overrides were present in the inspected process environment. Role routing code and fake-role tests already exist.

Done when: a bounded preflight demonstrates valid responses from the selected Luna, Terra 6.1 and Sol 6.1 under subscription authentication; logs identify the exact model and role. Luna handles immediate tactical choices, Terra medium-term/session plans, and Sol difficult decisions/review. No silent model substitution or API billing fallback occurs. Existing local routines still need no per-keypress model call.

## G2 - Continue playing beyond the first plan

Remaining: distinguish a completed medium-term plan from a completed session. The scheduler currently reviews/holds at `session-complete` when a plan finishes. It must choose the next useful objective, reassess blocked plans and keep playing until the session deadline, operator stop or budget/safety hold.

Done when: one start executes at least three successive plan versions with different useful objectives without manual next-goal/resume commands. Completed steps and full plan arguments survive a worker replacement; scene changes require fresh observations. Repeated failure changes approach or escalates instead of buying the same decision indefinitely. The agent has a bounded survival/hold policy while waiting for a slower model.

## G3 - Let the new mind operate normal UI and startup

Remaining: connect model decisions to the trusted UI action broker. The new plan vocabulary is eight native intents plus tactical delegation; Luna's new schema chooses an intent, and the new scheduler holds when the native world is unavailable. The existing browser/UI broker alone does not give the new mind usable menu skills.

Done when: from the normal title/front door, the agent can select the intended mode, enter the correct existing character/save, handle loading/tutorials and reach the world without human clicks. New-character/account setup follows normal visible UI when needed. It can open/read/act in/close menus, select controls, enter text, scroll and drag, then resume the previous world objective. Stale controls and unknown screens produce a bounded refresh/reassessment. UI and Body never write input concurrently. A trusted generic UI fallback covers less common workflows, without requiring a hand-coded script for every screen.

## G4 - Prove reliable live control

Remaining: execute the prepared zero-model smoke against the actual game, CDP connection, native bridge and Body. Existing HTTP tests inject game adapters; they do not demonstrate rendering, motor accuracy, collisions or combat survival.

Done when: recorded live checks demonstrate turning to the declared tolerance, arrival on observed ground, blocked-motion detection, repeated doorway/room transitions, selected-target interaction, combat/retreat and short target occlusion. Jump/run/crouch and other available movement modes have a usable input path. Test stop/cancel, lease expiry, scene changes and driver loss; no stuck input or dual authority. Proposed normal connected-driver stop target: release within 500ms; loss-of-controller release must respect the documented finite lease. Unverified release must hold, never resume speculatively.

## G5 - Cover ordinary-player activities

Remaining: reliable workflows and observable outcomes for the capability matrix below. A key binding or successful click does not establish the workflow.

| Capability group | Required demonstration |
| --- | --- |
| Combat and survival | Ready the intended weapon, select/approach a foe, hit where possible, recognize when the fight is unresolved, disengage/retreat and recover; survive or recover from death without a restart loop. |
| Inventory and loot | Open the correct loot/container, acquire an item, inspect it, equip/use an appropriate item, handle capacity/dialogs, and verify the inventory/equipment result. |
| Magic | Read known spells, select/ready/cast, account for target/magicka, cancel or recast, and verify the observable effect. |
| NPC dialogue and quests | Select dialogue, accept/track a quest, consult journal/handbook, navigate toward it, perform a real quest step and recognize its result. |
| World travel | Leave/enter locations, use local/world maps and available travel/transport controls, handle interruptions and verify arrival. |
| Economy and services | Buy/sell or use an available service/bank, verify the intended item/gold change and return to the prior objective. |
| Rest, saves and recovery | Rest/heal, save/checkpoint using the selected mode's normal mechanics, and recover through offline load or online respawn as appropriate. Preserve Rowan rather than repeatedly replacing the character. |
| Social play | For online operation: read/respond to a player message through trusted chat input, retain relevant social context and resume gameplay. No forced social quota; conversation occurs when useful or wanted. |

Done when: each group has an independently reviewable end-to-end live receipt, with a generic normal-input/UI route for other available features and explicit handling of unsupported/ambiguous screens. This is control/workflow coverage, not an obligation to exhaust every quest or item. An offline trial does not establish online joining/chat/checkpoint behavior; those require their own online verification.

## G6 - Verify gameplay outcomes rather than control receipts

Remaining: richer evidence producers for target defeat/encounter state, quest updates, inventory/equipment/gold changes, travel, rest, save/load and recovery. Current terminal evidence explicitly says kill/game-goal verification is false; metric v2 mostly counts movement, separation and place transitions.

Done when: success predicates inspect authoritative player-observable changes or separately labeled verification-only evidence. A vanished foe is not a kill, a swing is not damage, and a window is not a completed purchase/quest. Reports distinguish attempted, observed, verified and unknown results. Scripted walking/turning cannot manufacture a successful trial score. Preserve task identity, generation/frame, plan/version, timestamps, range/targets and evidence through scheduler logging/reporting.

## G7 - Demonstrate durable persona, memory and continuity

Remaining: validate the existing Rowan persona, retrieval and full-plan checkpointing during actual play and repair. Add useful retention of failures, learned controls/routes, unfinished goals and relevant NPC/player relationships; distinguish facts from guesses and stale state.

Done when: Rowan resumes the correct unfinished task after worker and driver replacement with the game left open; avoids an already demonstrated failed approach; recalls a relevant lesson/social fact; and reacquires current world state before acting. No repeated fresh-start planning, duplicate completed quest actions, fabricated memories or permanent accumulation of routine per-action chatter.

## G8 - Execute a real continuous improvement loop

Remaining: connect Sol's review/engineering proposals to an external engineering executor that implements, tests, stages, applies and verifies changes. The playing process currently logs proposals; it does not implement them. Keep model-generated code execution outside the playing process.

Done when: a real failure is captured, Sol diagnoses it from evidence, a bounded patch is implemented with a reproducing regression, the patch is applied without closing/reopening the game, the failed goal is retried, and the result/rollback is recorded. Preserve the same character, persona, memory and compatible plan. Ordinary prompt/plan/skill/controller repairs need proven hot replacement. Current bridge/engine edits require a suitable reload: add hot replacement where needed or keep ordinary behavior improvements independent of those layers. A reload-requiring change is maintenance, not evidence of the live loop. Prove rollback on a deliberately failed replacement as well as successful repair.

## G9 - Make logs sufficient for diagnosis and replay

Remaining: turn existing structured traces into complete decision/effect dossiers. Compact prompt hashes alone cannot reconstruct a bad decision; blanket screenshots/full scans every poll are too expensive and noisy.

Done when: any significant failure can be traced through the exact source/vendor version, observation basis, compact decision input, selected image if any, model request/structured reply, plan change, input/task, observed outcome and repair. Log per-tier latency and input/cached/output usage, unknown usage, failures, holds, human interventions and revision boundaries. Retain useful bounded evidence and protect credentials. A replay fixture should reproduce a failure without a model/game. Classify omitted data explicitly rather than presenting it as zero or known.

## G10 - Demonstrate efficiency within the chosen allowance

Remaining: measure the real three-tier system. The old browser trial's 2.2M input tokens/21m18s is not a native-controller baseline, and the review's overhead estimates are not universal model/transport limits.

Done when: calibrated per-tier latency/context and actual call/token totals are available; repeated local execution produces no unnecessary calls; selective images/retrieval are used; pause occurs at configured caps or subscription exhaustion and survives worker replacement. Compare two-tier and three-tier routing using the same controller, equivalent starting save/objectives and bounded runs. Keep quality/survival/progress visible alongside cost. Report verified useful transitions per call/token, model-wait time, repetition and interventions. Do not claim globally minimal tokens from one run, or hide unreported developer/engineering usage inside a zero.

## G11 - Complete the actual hour trial

Remaining: run the full trial after control/workflow validation, with the intended persona/memory, real configured roles and allowance limits.

Done when: the agent completes a full 60-minute in-world trial from a preregistered start and makes useful verified progress across several ordinary activities without routine human gameplay input. For the current starting-dungeon character, a concrete itinerary could be exit the dungeon, reach a settlement, equip/rest/trade and perform a quest step; choose equivalent attainable goals before the run. Natural conversation is optional during the trial, with chat capability validated separately.

Record playing, model-wait, paused and repair time separately; elapsed wall time is not proof of play. No stuck inputs, unrecovered crash, unacknowledged budget breach or false success receipts. Normal death is not automatically failure if the agent recovers. Code changes/interventions are versioned and reported; validate baseline behavior with frozen code and test hot repair in a labeled drill/segment. If allowance ends early, pause correctly and report an incomplete trial. A useful independent end-of-run report must state what Rowan achieved, where it failed, what it cost and which improvements Sol actually applied.

## Implementation order

While the game is closed: G1 configuration, G2 continuing plan loop, G3 UI decision path, and G6/G9 evidence instrumentation can proceed. The first live validation should be G4's zero-model control smoke before another expensive model trial. Then validate G5/G7 workflows, G8 hot repair and G10 efficiency. Run G11 last.

The project is complete only when the broad player capability, continuity, improvement and logging requirements are demonstrated, and the hour trial passes within its configured allowance. The present code checkpoint has not reached that point.
