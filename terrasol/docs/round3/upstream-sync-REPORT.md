# Upstream sync report

Implemented the reviewer fixes. Live tags now come from the build-tag meta element at DFO_LIVE_SITE_URL or https://daggerfalljs.dev/, fetched without cache and with a 10-second timeout. The SHA must resolve as a commit and be an ancestor of upstream/main; missing, failed, unknown, and non-ancestor tags fall back to main with a receipt reason. Targets behind the current pin are no-ops.

Failed candidate validation records its output and error in a failure dossier, queues a dfo-repair.v1 proposal, and deletes the candidate while leaving the live engine and pin in place. Successful swaps keep the previous pin in untracked state and retain at most two previous engines. The tracked pin contains only commit, previousCommit, liveBuildTag, and updatedAt. Rollback restores the engine and pin. --commit refuses staged pin changes and commits only the pin file. The scheduled-task guide now specifies daily execution with --execute --commit, logged-on account, no stored password, missed-start recovery, 45-minute limit, and no parallel instance.

Regression tests cover meta parsing in both attribute orders, SHA target selection and fallback, behind-pin no-op, failed validation cleanup and repair queueing, swap and rollback, retention, and staged-pin refusal. The new tests first failed because the parser module was absent; the final focused round-three suite passed 11/11.

Full suite: node --test test/*.test.mjs reported 232 passed, 5 failed. All five failures are in test/native-bridge.test.mjs and require the ignored engine/ checkout, which is absent in this worktree as anticipated by COMMON.md.

Requests: none.

Still unverified until an authorized live run: actual website response, upstream fetch and remote state, candidate dependency installation against upstream, engine bridge compatibility and engine-backed full-suite results, real directory swap/rollback, pin-only commit, and scheduled-task execution. Tests used temporary Git repos, injected fetch/fetchRefs, and injected validation; no network request or game/service launch was made.
