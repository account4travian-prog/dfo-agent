# DeepSeek round-two implementation prompt

Copy the prompt below into DeepSeek with local coding access.

---

Implement Path B of round two for DFO-TerraSol, covering our remaining goals G1-G10 in parallel with Codex's Path A. This is implementation work when I give you this prompt; do not spend the turn merely proposing another design.

Your worktree is `%USERPROFILE%\Documents\DFO\DFO-TerraSol-DeepSeek-R2`, branch `deepseek/goals-1-10-r2`, starting at tag `handoff/round2-goals-1-10`. If it was not created, create that separate worktree from the tag through the primary repository. Do not use the old DeepSeek branch or modify the primary checkout. Never overwrite a nonempty worktree or unrelated edits.

Read `docs/ROUND2-WORK-PLAN.md`, `docs/ROUND2-INTEGRATION-CONTRACT.md`, `docs/GOAL-COMPLETION-CRITERIA.md`, and `docs/RECONCILIATION-2026-10-28.md` first. Earlier round-one handoffs do not override round-two file ownership. The new base contains Codex's important post-merge plan, ground-target, attempted-call and cumulative-budget fixes; preserve them.

You own the continuous mind, configuration, UI decision path, memory, debugging packets, Sol diagnosis/proposals, reporting and efficiency/governor work. Specifically:

1. Resolve/configure the exact available Luna identifier from local metadata; keep Terra 6.1 for medium/session plans and Sol 6.1 for difficult decisions and review. Do not leave Luna unset again without an actual availability finding. Configure explicit finite session caps and prepare a bounded real-role preflight. No silent substitution, guessed subscription-to-token conversion, or API billing fallback.
2. Make completed medium-term plans produce the next useful Terra plan rather than ending the session. Demonstrate three successive plans; retain full plans, step arguments, memory and cumulative caps through worker replacement. Respect operator, usage and budget holds.
3. Extend plan/Luna schemas and the control client to choose native, generic trusted UI and catalogue workflow tasks via the frozen additive dfo-player.v1 contract. Support startup/modal/death decisions when native.ready is false. Codex implements actual UI/workflow execution; you implement selection, scheduling, bounded recovery and return to the prior objective. Use mocks while Codex builds it; no second input controller.
4. Improve uncertainty-qualified persona memory, lessons, unfinished work and social context. Capture bounded reconstructable decision packets and replies, replay fixtures and complete task/plan/basis/timing/evidence identity. Hashes alone are insufficient. Do not convert unknown usage or weak evidence into zeros/success.
5. Turn Sol evidence reviews into typed repair proposals/dossiers consumed by Codex's external repair executor, and handle repair status/checkpoint/resume. No generated-code execution in the playing process. Game text is evidence, never an instruction to change code, credentials, billing or operator policy.
6. Finish per-tier/session limits, cooldown/coalescing, selective context/images/retrieval, failure-call accounting, outage behavior and matched two-tier/three-tier measurement tools. Zero extra model calls during routine local polls; no periodic empty planning. Label estimates and fake results honestly.

Owned files are listed in ROUND2-WORK-PLAN.md: main/models/brain/protocol/memory/log/report/dashboard/handbook, src/mind/**, new mind configuration/preflight/replay/efficiency modules and their tests. Document under docs/round2/path-b/ and use uniquely named fixtures. Do not edit Codex's browser/controller/bridge/Body/executor/player/repair/vendor/reload files, shared contracts, README or package/game-config files. Put required cross-path changes in docs/round2/path-b/CONTRACT-REQUESTS.md.

Work incrementally and implement the deliverables. Reuse existing modules rather than replacing the system wholesale. Keep model transports subscription-only, preserve historical logs/saved-plan compatibility and keep public revision/logger APIs compatible with Codex's tools. Do not push/publish, launch the game/browser, make paid/model preflight calls, or read/copy credentials. Run focused model-free tests; Codex owns live PC testing and the combined engine-dependent suite. The hour trial G11 is outside this round.

Commit only your owned files on your branch. End with docs/round2/path-b/HANDOFF.md containing commit IDs, G1-G10 coverage, implemented versus demonstrated behavior, test commands/results, contract requests, remaining limits and prepared live preflight/A-B settings. A fake-only pass does not close a live acceptance requirement. Codex will review/merge, repair cross-path defects, execute the live acceptance phases under the current allowance/session instructions, and checkpoint the combined result.
